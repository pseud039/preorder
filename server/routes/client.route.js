import jsonwebtoken from "jsonwebtoken";
import bcrypt from "bcrypt";
import express from "express";
import {
  forgotPassword,
  LoginClient,
  logoutClient,
  resetpass,
  SignUpClient,
  getProfile,
} from "../controllers/client/client.auth.controller.js";
import {
  getCart,
  addToCart,
  removeFromCart,
  clearCart,
  updateCartItem,
  createOrder,
  getMyOrders,
  getOrderById,
  verifyPayment,
} from "../controllers/client/client.order.controller.js";
import { verifyJWT } from "../middlewares/client.middleware.js";
import { getCategories } from "../controllers/client/client.menu.controller.js";
import {
  getDetails,
  updateDetails,
  sendOTP,
  verifyOTP,
  resendOTP,
  getAvailableSlots,
  selectTimeSlot,
} from "../controllers/client/client.details.contoller.js";

const router = express.Router();

// Auth Routes
router.post("/signup", SignUpClient);
router.post("/login", LoginClient);
router.post("/password", forgotPassword);
router.post("/password/:token", resetpass);

// Authentication
router.get("/logout", verifyJWT, logoutClient);
router.get("/profile", verifyJWT, getProfile);

// User Profile & Details
router.get("/details", verifyJWT, getDetails);
router.put("/details", verifyJWT, updateDetails);

//OTP Management
router.post("/send-otp", verifyJWT, sendOTP);
router.post("/verify-otp", verifyJWT, verifyOTP);
router.post("/resend-otp", verifyJWT, resendOTP);

//Menu & Categories
router.get("/categories", verifyJWT, getCategories);

// Cart Management
router.get("/order", verifyJWT, getCart);
router.post("/add", verifyJWT, addToCart);
router.post("/update", verifyJWT, updateCartItem);
router.post("/delete", verifyJWT, removeFromCart);
router.post("/remove", verifyJWT, clearCart);

// Time Slot Management
router.get("/available", verifyJWT, getAvailableSlots);
router.post("/select", verifyJWT, selectTimeSlot);

// Order Management
router.post("/create-order", verifyJWT, createOrder);
// router.get("/orders", verifyJWT, getMyOrders);
router.get("/orders/:orderId", verifyJWT, getOrderById);

// Payment
router.post("/payment/verify", verifyJWT, verifyPayment);

export default router;
