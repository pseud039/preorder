import bcrypt from "bcrypt";
import { prisma } from "../lib/prisma.js";
import { asyncHandler } from "../utils/errorHandler.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { ApiError } from "../utils/ApiError.js";
import { transporter } from "../utils/email/emailConfig.js";
import { emailTemplates } from "../utils/email/emailTemplates.js";
import { generateAccessToken } from "../controllers/user.controller.js";
import crypto from "crypto";

const SignUpClient = asyncHandler(async (req, res) => {
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
    where: { email, role:"customer"},
  });
  console.log(existingUser);

  if (existingUser) {
    throw new ApiError(409, "User already exists");
  }

  // Hash password
  const passwordHash = await bcrypt.hash(password, 10);

  // Generate tokens
  const refreshToken = crypto.randomBytes(64).toString('hex');
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 7); // 7 days

  const result = await prisma.$transaction(async (tx) => {
    // Create user
    const user = await tx.user.create({
      data: {
        email,
        passwordHash,
        emailVerified: false, 
      },
      select: {
        id: true,
        email: true,
        role: true,
        createdAt: true,
      },
    });

    await tx.refreshToken.create({
      data: {
        token: refreshToken,
        userId: user.id,
        expiresAt,
      },
    });

    return user;
  });

  const accessToken = generateAccessToken(result.id, result.email);

  // Generate email confirmation link
  const verificationToken = crypto.randomBytes(32).toString('hex');
  const verificationExpiry = new Date();
  verificationExpiry.setHours(verificationExpiry.getHours() + 24); // 24 hours

  await prisma.emailVerification.create({
    data: {
      userId: result.id,
      token: verificationToken,
      expiresAt: verificationExpiry,
    },
  }).catch(err => {
    console.error("Failed to create email verification:", err);
  });

  const confirmationLink = `${process.env.API_LINK}/api/auth/verify-email?token=${verificationToken}`;
try{
  const mailTemp =  emailTemplates.emailConformation(result.email, confirmationLink);
    const info = await transporter.sendMail({
        ...mailTemp,
        to: email,
      });
        } catch (error) {
    console.error("Failed to send booking link", error);
    throw new ApiError(400,"Bad Request");
  }

  // Set refresh token as httpOnly cookie
  res.cookie('refreshToken', refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 7 * 24 * 60 * 60 * 1000, 
  });

  return res
    .status(201)
    .json(
      new ApiResponse(
        201,
        {
          user: result,
          accessToken,
          message: "Please check your email to verify your account"
        },
        "User Registered Successfully"
      )
    );
});

export { SignUpClient };

const LoginClient = asyncHandler(async (req, res) => {
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
    where: { email, role: "customer" },
  });
  if (!existingUser) {
    throw new ApiError(404, "User not found");
  }
  return res
    .status(200)
    .json(ApiResponse(200,"Login successfull", "/dashboard"));
});

const forgotPassword= asyncHandler(async(req,res)=>{
  const {email} = req.body;

    if (!email || email.trim() === "") {
    throw new ApiError(400, "Email is required");
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    throw new ApiError(400, "Invalid email format");
  }
    const existingUser = await prisma.user.findUnique({
    where: { email, role: "customer" },
  });
  if (!existingUser) {
    throw new ApiError(404, "User not found");
  }
      const confirmationLink = `${process.env.API_LINK}/api/auth/password?token=${verificationToken}`;
try{
  const mailTemp =  emailTemplates.ForgotPassword(result.email, confirmationLink);
    const info = await transporter.sendMail({
        ...mailTemp,
        to: email,
      });
        } catch (error) {
    console.error("Failed to send booking link", error);
    throw new ApiError(400,"Bad Request");
  
    
  }
})
