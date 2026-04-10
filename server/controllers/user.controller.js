import jwt from "jsonwebtoken";
import crypto from "crypto";
import { asyncHandler } from "../utils/errorHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { prisma } from "../lib/prisma.js";

const ACCESS_TOKEN_SECRET = process.env.ACCESS_TOKEN_SECRET;
const REFRESH_TOKEN_SECRET = process.env.REFRESH_TOKEN_SECRET;
const ACCESS_TOKEN_EXPIRY = process.env.ACCESS_TOKEN_EXPIRY;
const REFRESH_TOKEN_EXPIRY = process.env.REFRESH_TOKEN_EXPIRY;

function generateAccessToken(userId, email) {
  return jwt.sign({ userId, email }, ACCESS_TOKEN_SECRET, {
    expiresIn: ACCESS_TOKEN_EXPIRY,
  });
}

export const parseDuration = (duration) => {
  const match = duration.match(/^(\d+)([smhd])$/);
  
  if (!match) {
    throw new Error('Invalid duration format. Use format like: 1s, 5m, 1h, 1d');
  }

  const value = parseInt(match[1]);
  const unit = match[2];

  const units = {
    s: 1000,           // seconds
    m: 60 * 1000,      // minutes
    h: 60 * 60 * 1000, // hours
    d: 24 * 60 * 60 * 1000 // days
  };

  return value * units[unit];
};

function generateRefreshToken() {
  return crypto.randomBytes(64).toString("hex");
}

async function createRefreshToken(userId) {
  const token = generateRefreshToken();
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 7);

  await prisma.refreshToken.create({
    data: {
      token,
      userId: parseInt(userId),
      expiresAt,
    },
  });

  return token;
}

function verifyAccessToken(token) {
  try {
    return jwt.verify(token, ACCESS_TOKEN_SECRET);
  } catch (error) {
    return null;
  }
}

async function verifyRefreshToken(token) {
  try {
    const refreshToken = await prisma.refreshToken.findUnique({
      where: { token },
      include: { user: true },
    });

    if (!refreshToken) {
      return null;
    }

    if (new Date() > refreshToken.expiresAt) {
      await prisma.refreshToken.delete({
        where: { id: refreshToken.id },
      });
      return null;
    }

    return refreshToken;
  } catch (error) {
    console.error("Error verifying refresh token:", error);
    return null;
  }
}

async function deleteRefreshToken(token) {
  try {
    await prisma.refreshToken.delete({
      where: { token },
    });
    return true;
  } catch (error) {
    console.error("Error deleting refresh token:", error);
    return false;
  }
}

async function deleteAllUserRefreshTokens(userId) {
  try {
    await prisma.refreshToken.deleteMany({
      where: { userId: parseInt(userId) },
    });
    return true;
  } catch (error) {
    console.error("Error deleting user refresh tokens:", error);
    return false;
  }
}

export const refreshToken = asyncHandler(async (req, res) => {
  const refreshToken = req.cookies?.refreshToken;

  if (!refreshToken) {
    throw new ApiError(401, "Refresh token required");
  }

  try {
    const decoded = jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET);

    const storedToken = await prisma.refreshToken.findFirst({
      where: {
        token: refreshToken,
        userId: decoded.userId,
        expiresAt: {
          gt: new Date(),
        },
      },
    });

    if (!storedToken) {
      throw new ApiError(401, "Invalid or expired refresh token");
    }

    const newAccessToken = generateAccessToken(decoded.userId);

    res.cookie("accessToken", newAccessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      domain: ".predine.in",
    sameSite: "Lax",
      // maxAge: 1 * 60 * 60 * 1000,
      maxAge: parseDuration(ACCESS_TOKEN_EXPIRY),
      path: "/",
    });

    res
      .status(200)
      .json(
        new ApiResponse(
          200,
          { accessToken: newAccessToken },
          "Token refreshed successfully"
        )
      );
  } catch (error) {
    if (
      error.name === "JsonWebTokenError" ||
      error.name === "TokenExpiredError"
    ) {
      throw new ApiError(401, "Invalid or expired refresh token");
    }
    throw error;
  }
});

export {
  generateAccessToken,
  generateRefreshToken,
  createRefreshToken,
  verifyAccessToken,
  verifyRefreshToken,
  deleteRefreshToken,
  deleteAllUserRefreshTokens,
};
