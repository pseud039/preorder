import express from "express";
import { getMyNotifications,markAllAsRead,markAsRead,subscribeToPush,getVapidPublicKey,testNotification,unsubscribeFromPush } from "../utils/notification/notification.controller.js";

const router = express.Router();

router.get("/", getMyNotifications);

router.put("/:id/read", markAsRead);

router.put("/read-all", markAllAsRead);

router.post("/subscribe", subscribeToPush);
router.post("/unsubscribe", unsubscribeFromPush);

router.get("/vapid-public-key", getVapidPublicKey);

  router.post("/test", testNotification);
export default router;