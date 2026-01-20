
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
import { getAvailableTimeSlots } from "../controllers/client/client.details.contoller.js";
// Admin Menu Controllers
import {
  addRestaurant,
  addMenuItems,
  updateItem,
  deleteItem,
  createCategory,
  getMenu,
  getCategories,
  updateCategory,
  deleteCategory
} from "../controllers/admin/admin.menu.controller.js";

// Admin TimeSlot Controllers
import {
  getTimeSlots,
  createTimeSlot,
  batchCreateTimeSlots,
  updateTimeSlot,
  deleteTimeSlot,
  deleteTimeSlotsForDay
} from "../controllers/admin/admin.timeslot.controller.js";

import {
  getAllOrders,
  getOrderDetails,
  updateOrderStatus,
  cancelOrder,
  getDashboardStats,
  getRevenueReport,
  getPopularItems,
  updateOrderDetails,
  getOrderForEdit,
  deleteOrderItem,
  addOrderItem
} from "../controllers/admin/admin.order.controller.js";

import {
  getChefOrders,
  getChefOrderDetails,
  updateChefOrderStatus,
  getChefDashboard
} from "../controllers/chef/chef.order.controller.js";

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

router.post("/createTimeslot",verifyJWT, isAdmin, getAvailableTimeSlots);
router.get("/menu", verifyJWT, isAdmin, getMenu);
router.post("/menu", verifyJWT, isAdmin, upload.single("imageUrl"), addMenuItems);
router.patch("/menu/:id", verifyJWT, isAdmin, upload.single("imageUrl"), updateItem);
router.delete("/menu/:id", verifyJWT, isAdmin, deleteItem);

router.get("/categories", verifyJWT, isAdmin, getCategories);
router.post("/categories", verifyJWT, isAdmin, upload.single("imageUrl"), createCategory);
router.patch("/categories/:id", verifyJWT, isAdmin, upload.single("imageUrl"), updateCategory);
router.delete("/categories/:id", verifyJWT, isAdmin, deleteCategory);

router.get("/timeslots", verifyJWT, isAdmin, getTimeSlots);
router.post("/timeslots", verifyJWT, isAdmin, createTimeSlot);
router.post("/timeslots/batch", verifyJWT, isAdmin, batchCreateTimeSlots);
router.patch("/timeslots/:id", verifyJWT, isAdmin, updateTimeSlot);
router.delete("/timeslots/:id", verifyJWT, isAdmin, deleteTimeSlot);
router.delete("/timeslots/day/:dayOfWeek", verifyJWT, isAdmin, deleteTimeSlotsForDay);

router.get("/orders", verifyJWT, isAdmin, getAllOrders);
router.get("/orders/:orderId", verifyJWT, isAdmin, getOrderDetails);
router.patch("/orders/:orderId", verifyJWT, isAdmin, updateOrderStatus);
router.delete("/orders/:orderId/cancel", verifyJWT, isAdmin, cancelOrder);
router.patch("/orders/:orderId/edit/update", verifyJWT, isAdmin, updateOrderDetails);
router.get("/orders/:orderId/edit", verifyJWT, isAdmin, getOrderForEdit);
router.delete("/orders/:orderId/edit/items/:itemId", verifyJWT, isAdmin, deleteOrderItem);
router.post("/orders/:orderId/edit/items", verifyJWT, isAdmin, addOrderItem);
router.get("/orders/:orderId/edit/items", verifyJWT, isAdmin, getMenu);

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