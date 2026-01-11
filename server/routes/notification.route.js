import express from "express";
import {
  getMyNotifications,
  markAllAsRead,
  markAsRead,
  subscribeToPush,
  getVapidPublicKey,
  testNotification,
  unsubscribeFromPush,
} from "../utils/notification/notification.controller.js";
import { isCustomer, verifyJWT } from "../middlewares/middleware.js";

const router = express.Router();

router.get("/", getMyNotifications);

router.put("/:id/read", markAsRead);

router.put("/read-all", markAllAsRead);

router.post("/subscribe", verifyJWT, isCustomer, subscribeToPush);
router.post("/unsubscribe", unsubscribeFromPush);

router.get("/vapid-public-key", getVapidPublicKey);

router.post("/test", verifyJWT, testNotification);
export default router;
