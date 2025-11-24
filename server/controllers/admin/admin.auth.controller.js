import bcrypt from "bcrypt";
import { prisma } from "../../lib/prisma.js";
import { asyncHandler } from "../../utils/errorHandler.js";
import { ApiResponse } from "../../utils/ApiResponse.js";
import { ApiError } from "../../utils/ApiError.js";
import { transporter } from "../../utils/email/emailConfig.js";
import { emailTemplates } from "../../utils/email/emailTemplates.js";
import { generateAccessToken } from "../user.controller.js";
import crypto from "crypto";
import jwt from "jsonwebtoken";

const SignUpAdmin = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password || email.trim() === "" || password.trim() === "") {
    throw new ApiError(400, "All fields are required");
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    throw new ApiError(400, "Invalid email format");
  }

  if (password.length < 8) {
    throw new ApiError(400, "Password must be at least 8 characters long");
  }

  // Check if user already exists
  const existingUser = await prisma.user.findFirst({
    where: { email, role: "admin" },
  });
  console.log(existingUser);

  if (existingUser) {
    throw new ApiError(409, "User already exists");
  }

  // Hash password
  const passwordHash = await bcrypt.hash(password, 10);

  // Generate tokens
  const refreshToken = crypto.randomBytes(64).toString("hex");
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 7); // 7 days

  const result = await prisma.$transaction(async (tx) => {
    // Create user
    const admin = await tx.user.create({
      data: {
      email,
      passwordHash,
      emailVerified: false,
      role: "admin",
      },
      select: {
      id: true,
      email: true,
      role: true,
      createdAt: true,
      },
    });

    const restaurantId = req.body?.restaurantId
      ? parseInt(req.body.restaurantId, 10)
      : 3;

    // Ensure restaurant exists within the same transaction
    const restaurant = await tx.restaurant.findUnique({
      where: { id: restaurantId },
    });
    if (!restaurant) {
      throw new ApiError(404, "Restaurant not found");
    }

    await tx.restaurantAdmin.create({
      data: {
      userId: admin.id,
      restaurantId,
      },
    });

    await tx.refreshToken.create({
      data: {
        token: refreshToken,
        userId: admin.id,
        expiresAt,
      },
    });

    return admin;
  });

  const accessToken = generateAccessToken(result.id, result.email);

  // Generate email confirmation link
  const verificationToken = crypto.randomBytes(32).toString("hex");
  const verificationExpiry = new Date();
  verificationExpiry.setHours(verificationExpiry.getHours() + 24); // 24 hours

  await prisma.emailVerification
    .create({
      data: {
        userId: result.id,
        token: verificationToken,
        expiresAt: verificationExpiry,
      },
    })
    .catch((err) => {
      console.error("Failed to create email verification:", err);
    });

  const confirmationLink = `${process.env.API_LINK}/api/auth/verify-email?token=${verificationToken}`;
  try {
    const mailTemp = emailTemplates.emailConformation(
      result.email,
      confirmationLink
    );
    const info = await transporter.sendMail({
      ...mailTemp,
      to: email,
    });
  } catch (error) {
    console.error("Failed to send booking link", error);
    throw new ApiError(400, "Bad Request");
  }

  // Set refresh token as httpOnly cookie
  res.cookie("refreshToken", refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });
  return res.status(201).json(
    new ApiResponse(
      201,
      {
        user: result,
        accessToken,
        message: "Please check your email to verify your account",
      },
      "Admin Registered Successfully"
    )
  );
});

const LoginAdmin = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password || email.trim() === "" || password.trim() === "") {
    throw new ApiError(400, "All fields are required");
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    throw new ApiError(400, "Invalid email format");
  }

  if (password.length < 8) {
    throw new ApiError(400, "Password must be at least 8 characters long");
  }
  const existingUser = await prisma.user.findUnique({
    where: { email, role: "admin" },
  });
  if (!existingUser) {
    throw new ApiError(404, "User not found");
  }
  const HashedPassword = existingUser.passwordHash;
  const isPasswordValid = await bcrypt.compare(password, HashedPassword);
  if (!isPasswordValid) {
    throw new ApiError(400, "Invalid password");
  }
    // Generate JWT token
    const token = jwt.sign(
      { 
        userId: existingUser.id, 
        email: existingUser.email, 
        role: existingUser.role 
      },
      process.env.REFRESH_TOKEN_SECRET,
      { expiresIn: '7d' }
    );
  
    res.cookie('auth_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000,
      path: '/',
    });
  
    return res.status(200).json(
      new ApiResponse(200, {
        id: existingUser.id,
        email: existingUser.email,
        token: token
      }, "Login successful")
    );
});

const forgotPassword = asyncHandler(async (req, res) => {
  const { email } = req.body;

  if (!email || email.trim() === "") {
    throw new ApiError(400, "Email is required");
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    throw new ApiError(400, "Invalid email format");
  }
  const existingUser = await prisma.user.findUnique({
    where: { email, role: "admin" },
  });
  if (!existingUser) {
    throw new ApiError(404, "User not found");
  }
  const resetToken = crypto.randomBytes(32).toString("hex");

  const hashedToken = crypto
    .createHash("sha256")
    .update(resetToken)
    .digest("hex");

  const expiresAt = new Date(Date.now() + 15 * 60 * 1000);

   const result = await prisma.passwordReset.create({
    data: {
      userId: existingUser.id,
      token: hashedToken,
      expiresAt,
    },
  });
  const confirmationLink = `${process.env.API_LINK}/admin/password/${resetToken}`;
  console.log(confirmationLink);
  try {
    const mailTemp = emailTemplates.ForgotPassword(
      result.email,
      confirmationLink
    );
    const info = await transporter.sendMail({
      ...mailTemp,
      to: email,
    });
  } catch (error) {
    console.error("Failed to send booking link", error);
    throw new ApiError(400, "Bad Request");
  }
  return res.status(200).json(new ApiResponse(200, "Mail sent successfully"));
});
const resetpass = asyncHandler(async (req, res) => {
  const { token } = req.params;
  const { email, password } = req.body;

  if (
    !email ||
    !password ||
    !token ||
    email.trim() === "" ||
    password.trim() === ""
  ) {
    throw new ApiError(400, "All fields are required");
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    throw new ApiError(400, "Invalid email format");
  }

  if (password.length < 8) {
    throw new ApiError(400, "Password must be at least 8 characters long");
  }

  const existingUser = await prisma.restrauntAdmin.findFirst({
    where: { email, role: "admin" },
  });

  if (!existingUser) {
    throw new ApiError(404, "User not found");
  }

  const hashedToken = crypto.createHash("sha256").update(token).digest("hex");

  const resetRecord = await prisma.passwordReset.findFirst({
    where: {
      userId: existingUser.id,
      token: hashedToken,
      expiresAt: {
        gt: new Date(),
      },
    },
  });

  if (!resetRecord) {
    throw new ApiError(400, "Invalid or expired reset token");
  }

  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(password, salt);

  await prisma.restrauntAdmin.update({
    where: { id: existingUser.id },
    data: { passwordHash: hashedPassword },
  });

  await prisma.passwordReset.delete({
    where: { id: resetRecord.id },
  });

  return res
    .status(200)
    .json(new ApiResponse(200, "Password has been reset successfully"));
});

const logoutClient = asyncHandler(async (req, res) => {});

export { LoginAdmin, forgotPassword, resetpass, logoutClient, SignUpAdmin };
