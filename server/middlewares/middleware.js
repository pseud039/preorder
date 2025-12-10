import jwt from "jsonwebtoken";
import { prisma } from "../lib/prisma.js";
import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/errorHandler.js";

export const verifyJWT = asyncHandler(async (req, res, next) => {
  try {
    let token = req.headers.authorization?.replace("Bearer ", "");
    
    if (!token) {
      token = req.cookies?.accessToken;
    }
    // console.log(token);
    if (!token) {
      throw new ApiError(401, "Access token is required");
    }

    const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);

    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: true,
        isActive: true,
        emailVerified: true,
        phoneVerified: true,
        adminOf: {
          where: { isActive: true },
          select: {
            restaurantId: true,
            restaurant: {
              select: {
                id: true,
                name: true,
                isActive: true
              }
            }
          }
        },
        chefOf: {
          where: { isActive: true },
          select: {
            restaurantId: true,
            restaurant: {
              select: {
                id: true,
                name: true,
                isActive: true
              }
            }
          }
        }
      }
    });

    if (!user) {
      throw new ApiError(401, "Invalid access token - user not found");
    }

    if (!user.isActive) {
      throw new ApiError(403, "Your account has been deactivated");
    }

     req.user = {
      ...user,
      restaurantId: user.adminOf?.restaurantId || 
                    user.chefOf?.restaurantId || 
                    null
    };

    next();
  } catch (error) {
    if (error.name === "JsonWebTokenError") {
      throw new ApiError(401, "Invalid access token");
    }
    if (error.name === "TokenExpiredError") {
      throw new ApiError(401, "Access token has expired");
    }
    throw error;
  }
});

export const isCustomer = asyncHandler(async (req, res, next) => {
  if (req.user.role !== "customer") {
    throw new ApiError(403, "This action is only available to customers");
  }
  next();
});

export const isAdmin = asyncHandler(async (req, res, next) => {
  if (req.user.role !== "admin") {
    throw new ApiError(403, "This action is only available to restaurant admins");
  }

  if (!req.user.restaurantId) {
    throw new ApiError(403, "You are not assigned to any restaurant");
  }

  next();
});

export const isChef = asyncHandler(async (req, res, next) => {
  if (req.user.role !== "chef") {
    throw new ApiError(403, "This action is only available to chefs");
  }

  if (!req.user.restaurantId) {
    throw new ApiError(403, "You are not assigned to any restaurant");
  }

  next();
});

export const isSuperAdmin = asyncHandler(async (req, res, next) => {
  if (req.user.role !== "superadmin") {
    throw new ApiError(403, "This action is only available to superadmins");
  }
  next();
});

export const isAdminOrChef = asyncHandler(async (req, res, next) => {
  if (!["admin", "chef"].includes(req.user.role)) {
    throw new ApiError(403, "This action is only available to restaurant staff");
  }

  if (!req.user.restaurantId) {
    throw new ApiError(403, "You are not assigned to any restaurant");
  }

  next();
});

export const isOwner = (resourceKey = 'userId') => {
  return asyncHandler(async (req, res, next) => {
    const resourceId = req.params.id;
    
    next();
  });
};

export const optionalAuth = asyncHandler(async (req, res, next) => {
  try {
    const token = req.headers.authorization?.replace("Bearer ", "");

    if (!token) {
      req.user = null;
      return next();
    }

    const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isActive: true
      }
    });

    req.user = user && user.isActive ? user : null;
    next();
  } catch (error) {
    req.user = null;
    next();
  }
});

export const requireEmailVerified = asyncHandler(async (req, res, next) => {
  if (!req.user.emailVerified) {
    throw new ApiError(403, "Please verify your email before proceeding");
  }
  next();
});

export const requirePhoneVerified = asyncHandler(async (req, res, next) => {
  if (!req.user.phoneVerified) {
    throw new ApiError(403, "Please verify your phone number before proceeding");
  }
  next();
});