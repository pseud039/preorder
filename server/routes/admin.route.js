import jsonwebtoken from "jsonwebtoken";
import bcrypt from "bcrypt";
import express from "express";
import { upload } from "../middlewares/multer.middleware.js";
import {
  getMenu,
  getItemDetails,
  getMostPopular,
} from "../controllers/client/client.menu.controller.js";
import {
  addMenuItems,
  updateItem,
  deleteItem,
  addRestraunt,
} from "../controllers/admin/admin.menu.controller.js";
import {
  forgotPassword,
  LoginAdmin,
  SignUpAdmin,
} from "../controllers/admin/admin.auth.controller.js";
import {
  createTimeSlots,
  generateTimeSlots,
} from "../controllers/client/client.details.contoller.js";
import {
  getOrderDetails,
  updateOrderStatus,
} from "../controllers/admin/admin.order.controller.js";
import { verifyJWTAdmin } from "../middlewares/admin.middleware.js";
const router = express.Router();

//    Authentication
router.post("/signup", SignUpAdmin);
router.post("/login", LoginAdmin);
router.post("/forgot-password", forgotPassword);

//    Public Menu
router.get("/menu/popular", getMostPopular);
router.get("/menu/:id", getItemDetails);

//    Restaurant Management
router.post("/restaurant", verifyJWTAdmin, addRestraunt);

//    Menu Management
router.get("/menu", verifyJWTAdmin, getMenu);
router.post("/menu", verifyJWTAdmin, upload.single("imageUrl"), addMenuItems);
router.put("/menu/:id", verifyJWTAdmin, upload.single("imageUrl"), updateItem);
router.delete("/menu/:id", verifyJWTAdmin, deleteItem);

//    Time Slot Management
router.post("/createTimeslot", verifyJWTAdmin, createTimeSlots);
router.post("/generate", verifyJWTAdmin, generateTimeSlots);

//    Order Management
router.get("/orders", verifyJWTAdmin, getOrderDetails);
router.patch("/orders/:orderId/status", verifyJWTAdmin, updateOrderStatus);

export default router;
