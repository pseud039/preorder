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
    getAllOrders,
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
router.get("/menu", getMenu);
router.post("/menu", upload.single("imageUrl"), addMenuItems);
router.put("/menu/:id", upload.single("imageUrl"), updateItem);
router.delete("/menu/:id", deleteItem);

//    Time Slot Management
router.post("/createTimeslot", createTimeSlots);
router.post("/generate", generateTimeSlots);

//    Order Management
router.get("/orders", getAllOrders);
router.get("/orders/:orderId",getOrderDetails);
router.patch("/orders/:orderId", updateOrderStatus);

export default router;
