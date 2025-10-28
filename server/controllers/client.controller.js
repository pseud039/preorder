import { asyncHandler } from "../utils/errorHandler.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { ApiError } from "../utils/ApiError.js";
import { prisma } from "../lib/prisma.js";
import bcrypt from "bcrypt";

const SignUpClient = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password || email.trim() === "" || password.trim() === "") {
    throw new ApiError(400, "All fields are required");
  }

  // Email format validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    throw new ApiError(400, "Invalid email format");
  }

  // Password strength validation
  if (password.length < 8) {
    throw new ApiError(400, "Password must be at least 8 characters long");
  }

  const existingUser = await prisma.user.findUnique({
    where: { email },
  });

  if (existingUser) {
    throw new ApiError(409, "User already exists");
  }

  // Hash password
  const passwordHash = await bcrypt.hash(password, 10);

  // Create user
  const userCreated = await prisma.user.create({
    data: {
      email,
      passwordHash,
      // role will default to 'customer' automatically
    },
    select: {
      id: true,
      email: true,
      role: true,
      createdAt: true,
      // Don't return passwordHash
    },
  });

  return res
    .status(201)
    .json(
      new ApiResponse(
        201,
        userCreated,
        "User Registered Successfully",
        "/dashboard"
      )
    );
});

export { SignUpClient };
