import jsonwebtoken from "jsonwebtoken";
import bcrypt from "bcrypt";
import express from "express";
import { upload } from "../middlewares/multer.middleware.js";
import {getMenu,getItemDetails,getMostPopular} from "../controllers/client/client.menu.controller.js";
import {addMenuItems,updateItem,deleteItem, addRestraunt} from "../controllers/admin/admin.menu.controller.js";
import { forgotPassword, LoginAdmin,SignUpAdmin } from "../controllers/admin/admin.auth.controller.js";
import { createTimeSlots, generateTimeSlots } from "../controllers/client/client.details.contoller.js";
import { getOrderDetails, updateOrderStatus } from "../controllers/admin/admin.order.controller.js";
import { verifyJWTAdmin } from "../middlewares/admin.middleware.js";
const router = express.Router();
// const POST_FIELD = { name: "issueImg", maxCount: 1 };

router.get("/menu",verifyJWTAdmin,getMenu);
router.get("/menu/popular",getMostPopular);
router.get("/menu/:id",getItemDetails);
router.post("/menu", upload.single('imageUrl'),addMenuItems);
router.put("/menu/:id",updateItem);
router.delete("/menu/:id",deleteItem);
router.post("/restraunt",addRestraunt);
router.post("/login",LoginAdmin);
router.post("/signup",SignUpAdmin);
router.post("/forgotPassword",forgotPassword);
router.post("/createTimeslot",verifyJWTAdmin,createTimeSlots);
router.post("/generate",verifyJWTAdmin,generateTimeSlots);
router.get("/orders",verifyJWTAdmin,getOrderDetails);
router.patch(`/orders/:orderId/status`,verifyJWTAdmin,updateOrderStatus);

export default router;