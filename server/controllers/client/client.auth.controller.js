import { prisma } from "../../lib/prisma.js";
import { asyncHandler } from "../../utils/errorHandler.js";
import { ApiError } from "../../utils/ApiError.js";
import { ApiResponse } from "../../utils/ApiResponse.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import { emailTemplates } from "../../utils/email/emailTemplates.js";
import { sendEmail } from "../../utils/email/emailService.js";
// import { SMSService } from "../../utils/sms.service.js";
import {
  generateAccessToken,
  generateRefreshToken,
  parseDuration,
} from "../user.controller.js";

const signup = asyncHandler(async (req, res) => {
  const { email, password, role = "customer" } = req.body;

  if (!email || !password) {
    throw new ApiError(400, "All fields are required");
  }

  if (password.length < 8) {
    throw new ApiError(400, "Password must be at least 8 characters");
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    throw new ApiError(400, "Invalid email format");
  }

  const existingUser = await prisma.user.findFirst({
    where: {
      OR: [{ email }],
    },
  });

  if (existingUser) {
    throw new ApiError(409, "User with this email or phone already exists");
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  const verificationToken = crypto.randomBytes(32).toString("hex");
  const expirationDate = new Date();
  expirationDate.setMinutes(expirationDate.getMinutes() + 15);

const { user, confirmationLink } = await prisma.$transaction(async (tx) => {
    const user = await tx.user.create({
      data: {
        email,
        passwordHash: hashedPassword,
        role,
        emailVerified: false,
        phoneVerified: false,
        isActive: true,
      },
      select: {
        id: true,
        email: true,
        phone: true,
        role: true,
        emailVerified: true,
        phoneVerified: true,
      },
    })

    const expirationTime = new Date(Date.now() + 15 * 60 * 1000)

    const emailToken = await tx.emailVerification.create({
      data: {
        userId: user.id,
        token: verificationToken,
        expiresAt: expirationTime,
      },
    })

    const confirmationLink = `${process.env.FRONTEND_URL}/verify-email/${emailToken.token}`

    return { user, confirmationLink }
  })

  try {
    await sendEmail({
      to: email,
      template: 'emailConformation',
      templateData: { link: confirmationLink },
      userId: user.id,
    })
  } catch (emailError) {
    console.error("Failed to send verification email:", emailError)
  }

  res
    .status(201)
    .json(
      new ApiResponse(
        201,
        { user },
        "Account created successfully. Please verify your email.",
        "/login",
      ),
    );
});

const verifyEmail = asyncHandler(async (req, res) => {
  const { token } = req.params;

  if (!token) {
    throw new ApiError(400, "Verification token is required");
  }

  const emailVerification = await prisma.emailVerification.findFirst({
    where: {
      token: token,
      expiresAt: {
        gt: new Date(),
      },
    },
  });

  if (!emailVerification) {
    throw new ApiError(400, "Invalid or expired verification token");
  }

  await prisma.user.update({
    where: { id: emailVerification.userId },
    data: {
      emailVerified: true,
      emailVerifiedAt: new Date(),
    },
  });

  // Delete the used verification token
  await prisma.emailVerification.delete({
    where: { id: emailVerification.id },
  });

  res
    .status(200)
    .json(
      new ApiResponse(200, null, "Email verified successfully", "/auth/login"),
    );
});

const resendVerificationEmail = asyncHandler(async (req, res) => {
  const { email } = req.body;

  if (!email) {
    throw new ApiError(400, "Email is required");
  }

  const user = await prisma.user.findUnique({
    where: { email: email, role: "customer" },
  });

  if (!user) {
    throw new ApiError(404, "User not found");
  }

  if (user.emailVerified) {
    throw new ApiError(400, "Email is already verified");
  }

  const verificationToken = crypto.randomBytes(32).toString("hex");
  const expirationDate = new Date();
  expirationDate.setMinutes(expirationDate.getMinutes() + 15);

  // Delete any existing verification tokens for this user
  await prisma.emailVerification.deleteMany({
    where: { userId: user.id },
  });

  // Create new verification token
  const emailToken = await prisma.emailVerification.create({
    data: {
      userId: user.id,
      token: verificationToken,
      expiresAt: expirationDate,
    },
  });

  const confirmationLink = `${process.env.FRONTEND_URL}/verify-email/${emailToken.token}`;
  const mailTemp = emailTemplates.emailConformation(email, confirmationLink);
  try {
    await sendEmail({ to: email, template:"emailConformation", userId: user.id, templateData: { link: confirmationLink },});
  } catch (emailError) {
    console.error("Failed to send verification email:", emailError);
  }
  res
    .status(200)
    .json(new ApiResponse(200, null, "Verification email sent successfully"));
});

const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    throw new ApiError(400, "Email and password are required");
  }

  const user = await prisma.user.findUnique({
    where: { email: email, role: "customer" },
  });

  if (!user) {
    throw new ApiError(401, "Invalid credentials");
  }

  if (!user.isActive) {
    throw new ApiError(
      403,
      "Your account has been deactivated. Please contact support",
    );
  }
  // if (!user.emailVerified) {
  //   throw new ApiError(401, "Please verify your email to login");
  // }

  const isPasswordValid = await bcrypt.compare(password, user.passwordHash);

  if (!isPasswordValid) {
    throw new ApiError(401, "Invalid credentials");
  }

  const accessToken = generateAccessToken(user.id);
  const refreshToken = generateRefreshToken(user.id);

  await prisma.refreshToken.create({
    data: {
      userId: user.id,
      token: refreshToken,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    },
  });

  res.cookie("accessToken", accessToken, {
    domain: ".predine.in",
    httpOnly: true,
    secure: true, // process.env.NODE_ENV === "production",
    sameSite: "Lax",
    // maxAge: 1 * 60 * 60 * 1000,
    maxAge: parseDuration(process.env.ACCESS_TOKEN_EXPIRY),
    // path: "/",
  });

  const userData = {
    id: user.id,
    name: user.name,
    email: user.email,
    phone: user.phone,
    role: user.role,
    emailVerified: user.emailVerified,
    phoneVerified: user.phoneVerified,
    restaurantId:
      user.restaurantAdmin?.[0]?.restaurantId ||
      user.restaurantChef?.[0]?.restaurantId ||
      null,
  };

  res.status(200).json(
    new ApiResponse(
      200,
      {
        user: userData,
        accessToken,
        refreshToken,
      },
      "Login successful",
    ),
  );
});

export const refreshToken = asyncHandler(async (req, res) => {
  const { refreshToken: clientRefreshToken } = req.body;

  if (!clientRefreshToken) {
    throw new ApiError(401, "Refresh token is required");
  }

  let decoded;
  try {
    decoded = jwt.verify(clientRefreshToken, process.env.REFRESH_TOKEN_SECRET);
  } catch (error) {
    throw new ApiError(401, "Invalid refresh token");
  }

  const user = await prisma.user.findUnique({
    where: { id: decoded.userId },
  });

  if (!user || user.refreshToken !== clientRefreshToken) {
    throw new ApiError(401, "Invalid refresh token");
  }

  const { accessToken, refreshToken: newRefreshToken } = generateTokens(
    user.id,
  );

  await prisma.user.update({
    where: { id: user.id },
    data: { refreshToken: newRefreshToken },
  });

  res.status(200).json(
    new ApiResponse(
      200,
      {
        accessToken,
        refreshToken: newRefreshToken,
      },
      "Token refreshed successfully",
    ),
  );
});

export const logout = asyncHandler(async (req, res) => {
  const userId = req.user.id;

  // Clear user refresh tokens
  await prisma.refreshToken.deleteMany({
    where: { userId: userId },
  });

  await prisma.user.update({
    where: { id: userId },
    data: { refreshTokens: { set: [] } },
  });

  res.clearCookie("accessToken");

  res.status(200).json(new ApiResponse(200, null, "Logged out successfully"));
});

export const forgotPassword = asyncHandler(async (req, res) => {
  const { email } = req.body;

  if (!email) {
    throw new ApiError(400, "Email is required");
  }

  const user = await prisma.user.findUnique({
    where: { email },
  });

  if (!user) {
    res
      .status(200)
      .json(
        new ApiResponse(
          200,
          null,
          "If the email exists, a password reset link has been sent",
        ),
      );
    return;
  }

  const resetToken = crypto.randomBytes(32).toString("hex");
  const resetTokenExpiry = new Date(Date.now() + 60 * 60 * 1000);

  await prisma.user.update({
    where: { id: user.id },
    data: {
      passwordResetToken: resetToken,
      passwordResetExpiry: resetTokenExpiry,
    },
  });

  const resetLink = `${process.env.FRONTEND_URL}/reset-password/${resetToken}`;
  const mailTemp = emailTemplates.ForgotPassword(email, resetLink);
  try {
    await sendEmail({ to: email, template:"ForgotPassword", userId: user.id, templateData: { link: resetLink },});
  } catch (emailError) {
    console.error("Failed to send password reset email:", emailError);
  }
  res
    .status(200)
    .json(
      new ApiResponse(
        200,
        null,
        "If the email exists, a password reset link has been sent",
      ),
    );
});

export const resetPassword = asyncHandler(async (req, res) => {
  const { token } = req.params;
  const { password } = req.body;

  if (!token || !password) {
    throw new ApiError(400, "Token and password are required");
  }

  if (password.length < 8) {
    throw new ApiError(400, "Password must be at least 8 characters");
  }

  const user = await prisma.user.findFirst({
    where: {
      passwordResetToken: token,
      passwordResetExpiry: {
        gt: new Date(),
      },
    },
  });

  if (!user) {
    throw new ApiError(400, "Invalid or expired reset token");
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  await prisma.user.update({
    where: { id: user.id },
    data: {
      password: hashedPassword,
      passwordResetToken: null,
      passwordResetExpiry: null,
    },
  });

  res
    .status(200)
    .json(
      new ApiResponse(200, null, "Password reset successful", "/auth/login"),
    );
});

const getCurrentUser = asyncHandler(async (req, res) => {
  const user = await prisma.user.findUnique({
    where: { id: req.user.id },
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      role: true,
      emailVerified: true,
      phoneVerified: true,
      avatar: true,
      createdAt: true,
      restaurantAdmin: {
        include: {
          restaurant: {
            select: {
              id: true,
              name: true,
              isActive: true,
            },
          },
        },
      },
      restaurantChef: {
        include: {
          restaurant: {
            select: {
              id: true,
              name: true,
              isActive: true,
            },
          },
        },
      },
    },
  });

  res
    .status(200)
    .json(new ApiResponse(200, { user }, "User fetched successfully"));
});

const updateProfile = asyncHandler(async (req, res) => {
  const { name, phone } = req.body;
  const userId = req.user.id;

  const updateData = {};

  if (name) {
    if (name.trim().length < 2) {
      throw new ApiError(400, "Name must be at least 2 characters");
    }
    updateData.name = name.trim();
  }

  if (phone) {
    const phoneRegex = /^[6-9]\d{9}$/;
    if (!phoneRegex.test(phone)) {
      throw new ApiError(400, "Invalid phone number");
    }

    const existingUser = await prisma.user.findFirst({
      where: {
        phone,
        NOT: { id: userId },
      },
    });

    if (existingUser) {
      throw new ApiError(409, "Phone number is already in use");
    }

    updateData.phone = phone;
    updateData.phoneVerified = false;
  }

  const user = await prisma.user.update({
    where: { id: userId },
    data: updateData,
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      role: true,
      emailVerified: true,
      phoneVerified: true,
    },
  });

  res
    .status(200)
    .json(new ApiResponse(200, { user }, "Profile updated successfully"));
});

export const changePassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  const userId = req.user.id;

  if (!currentPassword || !newPassword) {
    throw new ApiError(400, "Current password and new password are required");
  }

  if (newPassword.length < 8) {
    throw new ApiError(400, "New password must be at least 8 characters");
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
  });

  const isPasswordValid = await bcrypt.compare(currentPassword, user.password);

  if (!isPasswordValid) {
    throw new ApiError(401, "Current password is incorrect");
  }

  const hashedPassword = await bcrypt.hash(newPassword, 10);

  await prisma.user.update({
    where: { id: userId },
    data: { password: hashedPassword },
  });

  res
    .status(200)
    .json(new ApiResponse(200, null, "Password changed successfully"));
});

export const deleteUser = asyncHandler(async (req, res) => {
  const userId = req.user.id;

  if (!userId) throw new ApiError(401, "User not signed in!");

  const exists = await prisma.user.findFirst({
    where: { id: userId },
  });

  if (!exists) throw new ApiError(404, "User not found!");

  await prisma.user.update({
    where: { id: userId },
    data: { isActive: false },
  });
  res.clearCookie("accessToken");
  return res
    .status(200)
    .json(new ApiResponse(200, null, "User account deactivated successfully"));
});

export {
  signup,
  verifyEmail,
  resendVerificationEmail,
  login,
  updateProfile,
  getCurrentUser,
};
