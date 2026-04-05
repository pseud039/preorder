// import express from "express";
// import {
//   forgotPassword,
//   login,
//   resetPassword,
//   signup,
//   logout,
//   verifyEmail,
//   updateProfile,
// } from "../controllers/client/client.auth.controller.js";
// import {
//   getCart,
//   addToCart,
//   removeFromCart,
//   clearCart,
//   updateCartItem,
//   createOrder,
//   getMyOrders,
//   getOrderById,
//   verifyPayment,
// } from "../controllers/client/client.order.controller.js";
// import{ createPaymentOrder, handlePaymentCallback, verifyPaymentStatus, getPaymentStatus } from "../utils/paymentgateway/payment.js";
// import { getCategories } from "../controllers/admin/admin.restraunt.controller.js";
// import {
//   getDetails,
//   sendOTP,
//   verifyOTP,
//   resendOTP,
//   selectTimeSlot,
//   getAvailableTimeSlots,
// } from "../controllers/client/client.details.contoller.js";
// import { isCustomer,verifyJWT } from "../middlewares/middleware.js";
// import { refreshToken } from "../controllers/user.controller.js";
// const router = express.Router();

// // Auth Routes
// router.post("/signup", signup);
// router.get("/verify-email/:token",verifyEmail);
// router.post("/login", login);
// router.post("/password", forgotPassword);
// router.post("/password/:token", resetPassword);
// router.post('/auth/refresh', refreshToken)

// // Authentication
// router.get("/logout", verifyJWT,isCustomer, logout);
// // router.get("/profile", verifyJWT, getProfile);

// // User Profile & Details
// router.get("/details", verifyJWT,isCustomer, getDetails);
// router.put("/details", verifyJWT,isCustomer, updateProfile);

// //OTP Management
// router.post("/send-otp", verifyJWT,isCustomer, sendOTP);
// router.post("/verify-otp", verifyJWT,isCustomer, verifyOTP);
// router.post("/resend-otp", verifyJWT,isCustomer, resendOTP);

// //Menu & Categories
// router.get("/categories", verifyJWT,isCustomer,getCategories);

// // Cart Management
// router.get("/order", verifyJWT,isCustomer, getCart);
// router.post("/add", verifyJWT,isCustomer,addToCart);
// router.post("/update", verifyJWT,isCustomer, updateCartItem);
// router.post("/delete", verifyJWT,isCustomer, removeFromCart);
// router.post("/remove", verifyJWT,isCustomer, clearCart);
// // Time Slot Management
// router.get("/available", verifyJWT, isCustomer,getAvailableTimeSlots);
// router.post("/select", verifyJWT, selectTimeSlot);

// // Order Management
// router.post("/create-order", verifyJWT, isCustomer, createOrder);
// router.get("/orders", verifyJWT, isCustomer, getMyOrders);
// router.get("/orders/:orderId", verifyJWT, isCustomer,getOrderById);

// // Payment
// // router.post("/payment/verify", verifyJWT, verifyPayment);
// router.post("/payment/create", verifyJWT, isCustomer, createPaymentOrder);
// router.post("/payment/callback", handlePaymentCallback);
// router.post("/payment/verify", verifyJWT, isCustomer, verifyPaymentStatus);
// router.get("/payment/status/:orderId", verifyJWT, isCustomer, getPaymentStatus);

// // router.get("/notifications", getMyNotifications);

// // // Mark notification as read
// // router.put("/notifications/:id/read", markAsRead);

// // // Mark all notifications as read
// // router.put("/notifications/read-all", markAllAsRead);

// // // Push notification subscription
// // router.post("/notifications/subscribe", subscribeToPush);
// // router.post("/notifications/unsubscribe", unsubscribeFromPush);

// // // Get VAPID public key (needed for frontend)
// // router.get("/notifications/vapid-public-key", getVapidPublicKey);

// // // Test notification (development only)
// // if (process.env.NODE_ENV !== 'production') {
// //   router.post("/notifications/test", testNotification);
// // }

import express from "express";
import {
  forgotPassword,
  login,
  resetPassword,
  signup,
  logout,
  verifyEmail,
  updateProfile,
  deleteUser,
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
} from "../controllers/client/client.order.controller.js";
import {
  createPaymentOrder,
  // verifyPayment,
  verifyPaymentStatus,
  getPaymentStatus,
  handlePaymentCallback,
  // handlePaymentWebhook
} from "../utils/paymentgateway/payment.js";
import { getCategories } from "../controllers/admin/admin.restraunt.controller.js";
import {
  getDetails,
  sendOTP,
  verifyOTP,
  resendOTP,
  selectTimeSlot,
  getAvailableTimeSlots,
} from "../controllers/client/client.details.contoller.js";
import { isCustomer, verifyJWT } from "../middlewares/middleware.js";
import { refreshToken } from "../controllers/user.controller.js";
import { getTimeSlots } from "../controllers/admin/admin.timeslot.controller.js";
import PaytmChecksum from "paytmchecksum";
const router = express.Router();

router.post("/signup", signup);
router.get("/verify-email/:token", verifyEmail);
router.post("/login", login);
router.post("/password", forgotPassword);
router.post("/password/:token", resetPassword);
router.post("/auth/refresh", refreshToken);
router.get("/logout", verifyJWT, isCustomer, logout);
router.delete("/delete-account", verifyJWT, isCustomer, deleteUser);

router.get("/details", verifyJWT, isCustomer, getDetails);
router.put("/details", verifyJWT, isCustomer, updateProfile);

router.post("/send-otp", verifyJWT, isCustomer, sendOTP);
router.post("/verify-otp", verifyJWT, isCustomer, verifyOTP);
router.post("/resend-otp", verifyJWT, isCustomer, resendOTP);

router.get("/categories", verifyJWT, isCustomer, getCategories);

router.get("/order", verifyJWT, isCustomer, getCart);
router.post("/add", verifyJWT, isCustomer, addToCart);
router.post("/update", verifyJWT, isCustomer, updateCartItem);
router.post("/delete", verifyJWT, isCustomer, removeFromCart);
router.post("/remove", verifyJWT, isCustomer, clearCart);

router.get("/available", verifyJWT, isCustomer, getAvailableTimeSlots);
router.post("/select", verifyJWT, isCustomer, selectTimeSlot);
router.get("/timeslots", verifyJWT, getTimeSlots);

router.post("/create-order", verifyJWT, isCustomer, createOrder);
router.get("/orders", verifyJWT, isCustomer, getMyOrders);
router.get("/orders/:orderId", verifyJWT, isCustomer, getOrderById);

// Create Razorpay order
router.post("/payment/create-order", verifyJWT, isCustomer, createPaymentOrder);

// Verify payment after successful transaction
// router.post("/payment/verify", verifyJWT, isCustomer, verifyPayment);

// Check payment status
router.post(
  "/payment/verify-status",
  verifyJWT,
  isCustomer,
  verifyPaymentStatus,
);

// Get payment details by order ID
router.get("/payment/status/:orderId", verifyJWT, isCustomer, getPaymentStatus);

// Razorpay webhook (NO AUTH - Razorpay servers call this)
// router.post("/payment/webhook", handlePaymentWebhook);

router.all("/payment/callback", handlePaymentCallback);

export default router;
