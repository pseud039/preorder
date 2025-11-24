import jwt from "jsonwebtoken";
import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/errorHandler.js";

export const verifyJWTAdmin = asyncHandler(async (req, res, next) => {
  let token = req.cookies?.auth_token;
  
  if (!token && req.headers.authorization) {
    token = req.headers.authorization.replace("Bearer ", "");
  }
  if (!token) {
    throw new ApiError(401, "Unauthorized - No token provided");
  }

  try {
    const decoded = jwt.verify(token, process.env.REFRESH_TOKEN_SECRET);
    console.log("Token verified successfully for user:", decoded.userId);
    
    req.userId = decoded.userId;
    req.user = decoded;
    next();
  } catch (error) {
    console.error("Token verification error:", error.message);
    throw new ApiError(401, "Unauthorized - Invalid token");
  }
});
