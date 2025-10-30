import jwt from "jsonwebtoken";
import crypto from "crypto";
import { PrismaClient } from "../lib/generated/prisma/client.js";

const prisma = new PrismaClient();

const ACCESS_TOKEN_SECRET = process.env.ACCESS_TOKEN_SECRET;
const REFRESH_TOKEN_SECRET = process.env.REFRESH_TOKEN_SECRET;
const ACCESS_TOKEN_EXPIRY = process.env.ACCESS_TOKEN_EXPIRY;
const REFRESH_TOKEN_EXPIRY = process.env.REFRESH_TOKEN_EXPIRY; 


function generateAccessToken(userId, email) {
  return jwt.sign(
    { userId, email },
    ACCESS_TOKEN_SECRET,
    { expiresIn: ACCESS_TOKEN_EXPIRY }
  );
}

function generateRefreshToken() {
  return crypto.randomBytes(64).toString('hex');
}


async function createRefreshToken(userId) {
  const token = generateRefreshToken();
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 7);

  await prisma.refreshToken.create({
    data: {
      token,
      userId: parseInt(userId),
      expiresAt
    }
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
      include: { user: true }
    });

    if (!refreshToken) {
      return null;
    }

    // Check if token is expired
    if (new Date() > refreshToken.expiresAt) {
      await prisma.refreshToken.delete({
        where: { id: refreshToken.id }
      });
      return null;
    }

    return refreshToken;
  } catch (error) {
    console.error('Error verifying refresh token:', error);
    return null;
  }
}


async function deleteRefreshToken(token) {
  try {
    await prisma.refreshToken.delete({
      where: { token }
    });
    return true;
  } catch (error) {
    console.error('Error deleting refresh token:', error);
    return false;
  }
}


async function deleteAllUserRefreshTokens(userId) {
  try {
    await prisma.refreshToken.deleteMany({
      where: { userId: parseInt(userId) }
    });
    return true;
  } catch (error) {
    console.error('Error deleting user refresh tokens:', error);
    return false;
  }
}


export {
  generateAccessToken,
  createRefreshToken,
  verifyAccessToken,
  verifyRefreshToken,
  deleteRefreshToken,
  deleteAllUserRefreshTokens,
};