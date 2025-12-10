// import jsonwebtoken from "jsonwebtoken";
// import bcrypt from "bcrypt";
// import express from "express";
// import { upload } from "../middlewares/multer.middleware.js";
// import {
//   getMenu,
//   getItemDetails,
//   getMostPopular,
// } from "../controllers/client/client.menu.controller.js";
// import {
//   addMenuItems,
//   updateItem,
//   deleteItem,
//   // addRestraunt,
//   createCategory,
// } from "../controllers/admin/admin.menu.controller.js";
// import {
//   forgotPassword,
//   LoginAdmin,
// } from "../controllers/admin/admin.auth.controller.js";
import {
  // generateTimeSlots,
  getAvailableTimeSlots,
} from "../controllers/client/client.details.contoller.js";
// import {
//     getAllOrders,
//   getOrderDetails,
//   updateOrderStatus,
// } from "../controllers/admin/admin.order.controller.js";
// import { verifyJWTAdmin } from "../middlewares/admin.middleware.js";
// const router = express.Router();

// //    Authentication
// router.post("/login", LoginAdmin);
// router.post("/forgot-password", forgotPassword);

// //    Public Menu
// router.get("/menu/popular", getMostPopular);
// router.get("/menu/:id", getItemDetails);

// //    Restaurant Management
// // router.post("/restaurant", verifyJWTAdmin, addRestraunt);

// //    Menu Management
// router.get("/menu", getMenu);
// router.post("/menu", upload.single("imageUrl"), addMenuItems);
// router.put("/menu/:id", upload.single("imageUrl"), updateItem);
// router.delete("/menu/:id", deleteItem);
// router.post("/category/add", upload.single("imageUrl"), createCategory)

//    Time Slot Management
// router.post("/createTimeslot", getAvailableTimeSlots);
// router.post("/generate", generateTimeSlots);

// //    Order Management
// router.get("/orders", getAllOrders);
// router.get("/orders/:orderId",getOrderDetails);
// router.patch("/orders/:orderId", updateOrderStatus);

// export default router;
import express from "express";
import { upload } from "../middlewares/multer.middleware.js";
import { verifyJWT, isAdmin, isChef, isSuperAdmin, isAdminOrChef } from "../middlewares/middleware.js";

// Auth Controllers
import {
  loginAdmin,
  logoutAdmin,
  refreshAccessToken,
  createAdmin,
  createChef,
  forgotPassword,
  resetPassword,
  getCurrentUser
} from "../controllers/admin/admin.auth.controller.js";

// Admin Menu Controllers
import {
  addRestaurant,
  addMenuItems,
  updateItem,
  deleteItem,
  createCategory,
  getMenu,
  getCategories
} from "../controllers/admin/admin.menu.controller.js";

// Admin Order Controllers
import {
  getAllOrders,
  getOrderDetails,
  updateOrderStatus,
  cancelOrder,
  getDashboardStats,
  getRevenueReport,
  getPopularItems
} from "../controllers/admin/admin.order.controller.js";

// Chef Controllers
import {
  getChefOrders,
  getChefOrderDetails,
  updateChefOrderStatus,
  getChefDashboard
} from "../controllers/chef/chef.order.controller.js";

// SuperAdmin Controllers
import {
  getAllRestaurants,
  getRestaurantDetails,
  updateRestaurant,
  getAllCommissions,
  getCommissionSummary,
  settleCommissions,
  updateCommissionStatus,
  getPlatformAnalytics
} from "../controllers/superadmin/superadmin.controller.js";

const router = express.Router();

router.post("/auth/login", loginAdmin); 
router.post("/auth/forgot-password", forgotPassword);
router.post("/auth/reset-password/:token", resetPassword);

router.post("/auth/logout", verifyJWT, logoutAdmin);
router.post("/auth/refresh", refreshAccessToken);
router.get("/auth/me", verifyJWT, getCurrentUser);

router.post("/staff/create-chef", verifyJWT, isAdmin, createChef);
router.post("/staff/create-admin", verifyJWT, isSuperAdmin, createAdmin);

router.post("/restaurant", verifyJWT, isAdmin, addRestaurant);

router.post("/createTimeslot", getAvailableTimeSlots);
router.get("/menu", verifyJWT, isAdmin, getMenu);
router.post("/menu", verifyJWT, isAdmin, upload.single("imageUrl"), addMenuItems);
router.patch("/menu/:id", verifyJWT, isAdmin, upload.single("imageUrl"), updateItem);
router.delete("/menu/:id", verifyJWT, isAdmin, deleteItem);

router.get("/categories", verifyJWT, isAdmin, getCategories);
router.post("/categories", verifyJWT, isAdmin, upload.single("imageUrl"), createCategory);

router.get("/orders", verifyJWT, isAdmin, getAllOrders);
router.get("/orders/:orderId", verifyJWT, isAdmin, getOrderDetails);
router.patch("/orders/:orderId", verifyJWT, isAdmin, updateOrderStatus);
router.delete("/orders/:orderId/cancel", verifyJWT, isAdmin, cancelOrder);

router.get("/dashboard", verifyJWT, isAdmin, getDashboardStats);
router.get("/revenue-report", verifyJWT, isAdmin, getRevenueReport);
router.get("/popular-items", verifyJWT, isAdmin, getPopularItems);

router.get("/chef/dashboard", verifyJWT, isChef, getChefDashboard);
router.get("/chef/orders", verifyJWT, isChef, getChefOrders);
router.get("/chef/orders/:orderId", verifyJWT, isChef, getChefOrderDetails);
router.patch("/chef/orders/:orderId/status", verifyJWT, isChef, updateChefOrderStatus);

router.get("/superadmin/restaurants", verifyJWT, isSuperAdmin, getAllRestaurants);
router.get("/superadmin/restaurants/:id", verifyJWT, isSuperAdmin, getRestaurantDetails);
router.patch("/superadmin/restaurants/:id", verifyJWT, isSuperAdmin, updateRestaurant);

router.get("/superadmin/commissions", verifyJWT, isSuperAdmin, getAllCommissions);
router.get("/superadmin/commissions/summary", verifyJWT, isSuperAdmin, getCommissionSummary);
router.post("/superadmin/commissions/settle", verifyJWT, isSuperAdmin, settleCommissions);
router.patch("/superadmin/commissions/:id/status", verifyJWT, isSuperAdmin, updateCommissionStatus);

router.get("/superadmin/analytics/overview", verifyJWT, isSuperAdmin, getPlatformAnalytics);

export default router;