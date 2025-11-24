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
  selectTimeSlot
} from "../controllers/client/client.details.contoller.js";

const router = express.Router();

router.post("/signUp", SignUpClient);
router.post("/login", LoginClient);
router.post("/password", forgotPassword);
router.post("/password/:token", resetpass);
router.get("/logout", logoutClient);
router.get("/order", verifyJWT, getCart);
router.post("/add", verifyJWT, addToCart);
router.post("/update", verifyJWT, updateCartItem);
router.post("/delete", verifyJWT, removeFromCart);
router.post("/remove", verifyJWT, clearCart);
router.get("/categories", verifyJWT, getCategories);
router.get("/details", verifyJWT, getDetails);
router.put("/details", verifyJWT, updateDetails);
router.post("/send-otp", verifyJWT, sendOTP);
router.post("/verify-otp", verifyJWT, verifyOTP);
router.post("/resend-otp", verifyJWT, resendOTP);
router.get('/available', verifyJWT, getAvailableSlots);
router.post('/select', verifyJWT, selectTimeSlot);
router.post("/create-order",verifyJWT, createOrder);
router.post('/verify-payment', verifyJWT, verifyPayment);
router.get("/orders/:orderId",verifyJWT,getOrderById);
router.get("/profile",verifyJWT,getProfile);
export default router;
