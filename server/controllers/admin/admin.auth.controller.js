import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import { prisma } from "../../lib/prisma.js";
import { asyncHandler } from "../../utils/errorHandler.js";
import { ApiResponse } from "../../utils/ApiResponse.js";
import { ApiError } from "../../utils/ApiError.js";
import { emailTemplates } from "../../utils/email/emailTemplates.js";
import { sendEmail } from "../../utils/email/emailService.js";
import Restraunt_ID from "../../utils/constant.js";
import { parseDuration } from "../user.controller.js";

export const loginAdmin = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password || email.trim() === "" || password.trim() === "") {
    throw new ApiError(400, "Email and password are required");
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    throw new ApiError(400, "Invalid email format");
  }

  const user = await prisma.user.findFirst({
    where: {
      email,
      role: { in: ["admin", "chef", "superadmin"] },
    },
    include: {
      adminOf: {
        where: { isActive: true },
        include: { restaurant: true },
      },
      chefOf: {
        where: { isActive: true },
        include: { restaurant: true },
      },
    },
  });

  if (!user) {
    throw new ApiError(404, "Invalid credentials");
  }

  if (!user.isActive) {
    throw new ApiError(
      403,
      "Your account has been deactivated. Contact support."
    );
  }

  const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
  if (!isPasswordValid) {
    throw new ApiError(401, "Invalid credentials");
  }

  const accessToken = jwt.sign(
    {
      userId: user.id,
      email: user.email,
      role: user.role,
    },
    process.env.ACCESS_TOKEN_SECRET,
    { expiresIn: process.env.ACCESS_TOKEN_EXPIRY }
  );

  const refreshToken = jwt.sign(
    {
      userId: user.id,
      email: user.email,
      role: user.role,
    },
    process.env.REFRESH_TOKEN_SECRET,
    { expiresIn: process.env.REFRESH_TOKEN_EXPIRY }
  );

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
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    // maxAge: 15 * 60 * 1000, // 15 minutes
    maxAge: parseDuration(process.env.ACCESS_TOKEN_EXPIRY),
    path: "/",
  });

  res.cookie("refreshToken", refreshToken, {
    domain: ".predine.in",
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    // maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
     maxAge: parseDuration(process.env.REFRESH_TOKEN_EXPIRY),

    path: "/",
  });

  const responseData = {
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      phone: user.phone,
    },
    accessToken,
    refreshToken,
  };

  if (user.role === "admin" && user.adminOf) {
    responseData.restaurant = {
      id: user.adminOf.restaurantId,
      name: user.adminOf.restaurant.name,
    };
  } else if (user.role === "chef" && user.chefOf) {
    responseData.restaurant = {
      id: user.chefOf.restaurantId,
      name: user.chefOf.restaurant.name,
    };
    responseData.chefDetails = {
      specialization: user.chefOf.specialization,
      shiftStart: user.chefOf.shiftStart,
      shiftEnd: user.chefOf.shiftEnd,
    };
  }

  return res
    .status(200)
    .json(new ApiResponse(200, responseData, "Login successful"));
});

export const logoutAdmin = asyncHandler(async (req, res) => {
  const refreshToken = req.cookies?.refreshToken;

  if (refreshToken) {
    await prisma.refreshToken.deleteMany({
      where: { token: refreshToken },
    });
  }

  res.clearCookie("accessToken", { path: "/" });
  res.clearCookie("refreshToken", { path: "/" });

  return res
    .status(200)
    .json(new ApiResponse(200, null, "Logged out successfully"));
});

export const refreshAccessToken = asyncHandler(async (req, res) => {
  const refreshToken = req.cookies?.refreshToken;

  if (!refreshToken) {
    throw new ApiError(401, "Refresh token is required");
  }

  let decoded;
  try {
    decoded = jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET);
  } catch (error) {
    throw new ApiError(401, "Invalid or expired refresh token");
  }

  const tokenRecord = await prisma.refreshToken.findFirst({
    where: {
      token: refreshToken,
      userId: decoded.userId,
      expiresAt: { gt: new Date() },
    },
  });

  if (!tokenRecord) {
    throw new ApiError(401, "Invalid or expired refresh token");
  }

  const user = await prisma.user.findUnique({
    where: { id: decoded.userId },
  });

  if (!user || !user.isActive) {
    throw new ApiError(401, "User not found or inactive");
  }

  const newAccessToken = jwt.sign(
    {
      userId: user.id,
      email: user.email,
      role: user.role,
    },
    process.env.ACCESS_TOKEN_SECRET,
    { expiresIn: process.env.ACCESS_TOKEN_EXPIRY }
  );

  res.cookie("accessToken", newAccessToken, {
    domain: ".predine.in",
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: parseDuration(process.env.ACCESS_TOKEN_EXPIRY),
    path: "/",
  });

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        { accessToken: newAccessToken },
        "Token refreshed successfully"
      )
    );
});

export const createAdmin = asyncHandler(async (req, res) => {
  const { email, password, name, phone } = req.body;
  const restaurantId = Restraunt_ID

  if (!email || !password || !name || !phone || !restaurantId) {
    throw new ApiError(400, "All fields are required");
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    throw new ApiError(400, "Invalid email format");
  }

  if (password.length < 8) {
    throw new ApiError(400, "Password must be at least 8 characters long");
  }

  if (phone.length < 10) {
    throw new ApiError(400, "Invalid phone number");
  }

  const restaurant = await prisma.restaurant.findUnique({
    where: { id: restaurantId },
  });

  if (!restaurant) {
    throw new ApiError(404, "Restaurant not found");
  }

  const existingUser = await prisma.user.findFirst({
    where: {
      OR: [{ email }, { phone }],
    },
  });

  if (existingUser) {
    throw new ApiError(409, "User with this email or phone already exists");
  }

  const passwordHash = await bcrypt.hash(password, 10);

  const result = await prisma.$transaction(async (tx) => {
    const newUser = await tx.user.create({
      data: {
        email,
        passwordHash,
        name,
        phone,
        role: "admin",
        isActive: true,
        emailVerified: false,
      },
    });

    const restaurantAdmin = await tx.restaurantAdmin.create({
      data: {
        userId: newUser.id,
        restaurantId: parseInt(restaurantId),
        isActive: true,
      },
    });

    return { user: newUser, admin: restaurantAdmin };
  });

  try {
    const mailTemp = emailTemplates.InviteAdmin(email, password);
    await sendEmail({ to: email, subject: mailTemp.subject, html: mailTemp.html });
  } catch (error) {
    console.error("Failed to send welcome email:", error);
  }

  return res.status(201).json(
    new ApiResponse(
      201,
      {
        user: {
          id: result.user.id,
          email: result.user.email,
          name: result.user.name,
          role: result.user.role,
        },
        restaurant: {
          id: restaurant.id,
          name: restaurant.name,
        },
      },
      "Admin created successfully"
    )
  );
});

export const createChef = asyncHandler(async (req, res) => {
  const { email, password, name, phone, specialization, shiftStart, shiftEnd } =
    req.body;
  const restaurantId = req.user.restaurantId || Restraunt_ID; // From auth middleware

  if (!email || !password || !name || !phone) {
    throw new ApiError(400, "Email, password, name, and phone are required");
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    throw new ApiError(400, "Invalid email format");
  }

  if (password.length < 8) {
    throw new ApiError(400, "Password must be at least 8 characters long");
  }

  if (phone.length < 10) {
    throw new ApiError(400, "Invalid phone number");
  }

  const existingUser = await prisma.user.findFirst({
    where: {
      OR: [{ email }, { phone }],
    },
  });

  if (existingUser) {
    throw new ApiError(409, "User with this email or phone already exists");
  }

  const passwordHash = await bcrypt.hash(password, 10);

  const result = await prisma.$transaction(async (tx) => {
    const newUser = await tx.user.create({
      data: {
        email,
        passwordHash,
        name,
        phone,
        role: "chef",
        isActive: true,
        emailVerified: false,
      },
    });

    const restaurantChef = await tx.restaurantChef.create({
      data: {
        userId: newUser.id,
        restaurantId: restaurantId,
        isActive: true,
        specialization: specialization || null,
        shiftStart: shiftStart || null,
        shiftEnd: shiftEnd || null,
      },
    });

    return { user: newUser, chef: restaurantChef };
  });

  try {
    const mailTemp = emailTemplates.InviteChef(email, password);
    await sendEmail({ to: email, subject: mailTemp.subject, html: mailTemp.html });
  } catch (error) {
    throw new ApiError(500, "Failed to send invite email");
  }
  return res.status(201).json(
    new ApiResponse(
      201,
      {
        user: {
          id: result.user.id,
          email: result.user.email,
          name: result.user.name,
          role: result.user.role,
        },
        chefDetails: {
          specialization: result.chef.specialization,
          shiftStart: result.chef.shiftStart,
          shiftEnd: result.chef.shiftEnd,
        },
      },
      "Chef created successfully"
    )
  );
});

export const forgotPassword = asyncHandler(async (req, res) => {
  const { email } = req.body;

  if (!email || email.trim() === "") {
    throw new ApiError(400, "Email is required");
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    throw new ApiError(400, "Invalid email format");
  }

  // Find user (admin or chef only)
  const user = await prisma.user.findFirst({
    where: {
      email,
      role: { in: ["admin", "chef", "superadmin"] },
    },
  });

  if (!user) {
    // Don't reveal if user exists
    return res
      .status(200)
      .json(
        new ApiResponse(
          200,
          null,
          "If the email exists, a reset link has been sent"
        )
      );
  }

  // Generate reset token
  const resetToken = crypto.randomBytes(32).toString("hex");
  const hashedToken = crypto
    .createHash("sha256")
    .update(resetToken)
    .digest("hex");
  const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

  // Store token
  await prisma.passwordReset.create({
    data: {
      userId: user.id,
      token: hashedToken,
      expiresAt,
    },
  });

  // Send email
  const resetLink = `${process.env.FRONTEND_URL}/admin/reset-password/${resetToken}`;

  try {
    const mailTemp = emailTemplates.ForgotPassword(email, resetLink);
    await sendEmail({ to: email, subject: mailTemp.subject, html: mailTemp.html });
  } catch (error) {
    console.error("Failed to send reset email:", error);
    throw new ApiError(500, "Failed to send reset email");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, null, "Password reset link sent successfully"));
});

export const resetPassword = asyncHandler(async (req, res) => {
  const { token } = req.params;
  const { password } = req.body;

  if (!password || password.trim() === "") {
    throw new ApiError(400, "Password is required");
  }

  if (password.length < 8) {
    throw new ApiError(400, "Password must be at least 8 characters long");
  }

  const hashedToken = crypto.createHash("sha256").update(token).digest("hex");

  const resetRecord = await prisma.passwordReset.findFirst({
    where: {
      token: hashedToken,
      used: false,
      expiresAt: { gt: new Date() },
    },
    include: { user: true },
  });

  if (!resetRecord) {
    throw new ApiError(400, "Invalid or expired reset token");
  }

  const passwordHash = await bcrypt.hash(password, 10);

  await prisma.$transaction([
    prisma.user.update({
      where: { id: resetRecord.userId },
      data: { passwordHash },
    }),
    prisma.passwordReset.update({
      where: { id: resetRecord.id },
      data: {
        used: true,
        usedAt: new Date(),
      },
    }),
    prisma.refreshToken.deleteMany({
      where: { userId: resetRecord.userId },
    }),
  ]);

  return res
    .status(200)
    .json(new ApiResponse(200, null, "Password reset successfully"));
});

export const getCurrentUser = asyncHandler(async (req, res) => {
  const user = await prisma.user.findUnique({
    where: { id: req.user.id },
    select: {
      id: true,
      email: true,
      name: true,
      phone: true,
      role: true,
      emailVerified: true,
      phoneVerified: true,
      isActive: true,
      createdAt: true,
      adminOf: {
        where: { isActive: true },
        select: {
          restaurantId: true,
          restaurant: {
            select: {
              id: true,
              name: true,
              description: true,
              address: true,
              contactNumber: true,
              imageUrl: true,
            },
          },
        },
      },
      chefOf: {
        where: { isActive: true },
        select: {
          restaurantId: true,
          specialization: true,
          shiftStart: true,
          shiftEnd: true,
          restaurant: {
            select: {
              id: true,
              name: true,
              address: true,
            },
          },
        },
      },
    },
  });

  return res
    .status(200)
    .json(new ApiResponse(200, user, "User info fetched successfully"));
});
