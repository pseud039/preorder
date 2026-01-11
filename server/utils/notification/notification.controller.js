// controllers/notification.controller.js
import { asyncHandler } from "../errorHandler.js";
import { ApiError } from "../ApiError.js";
import { ApiResponse } from "../ApiResponse.js";
import { NotificationService } from "./notification.service.js";

// 1. GET MY NOTIFICATIONS
export const getMyNotifications = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const { 
    page = 1, 
    limit = 20, 
    unreadOnly = false 
  } = req.query;

  const result = await NotificationService.getForUser(userId, {
    page: parseInt(page),
    limit: parseInt(limit),
    unreadOnly: unreadOnly === 'true'
  });

  res.status(200).json(
    new ApiResponse(
      200,
      result,
      "Notifications fetched successfully"
    )
  );
});

// 2. MARK NOTIFICATION AS READ
export const markAsRead = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const userId = req.user.id;

  const notification = await NotificationService.markAsRead(
    parseInt(id),
    userId
  );

  res.status(200).json(
    new ApiResponse(
      200,
      { notification },
      "Notification marked as read"
    )
  );
});

// 3. MARK ALL AS READ
export const markAllAsRead = asyncHandler(async (req, res) => {
  const userId = req.user.id;

  await NotificationService.markAllAsRead(userId);

  res.status(200).json(
    new ApiResponse(
      200,
      null,
      "All notifications marked as read"
    )
  );
});

// 4. SUBSCRIBE TO PUSH NOTIFICATIONS
export const subscribeToPush = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const  subscription  = req.body;
  if (!subscription || !subscription.endpoint || !subscription.keys) {
    throw new ApiError(400, "Invalid push subscription data");
  }

  const pushSubscription = await NotificationService.subscribeToPush(
    userId,
    subscription
  );

  res.status(200).json(
    new ApiResponse(
      200,
      { subscription: pushSubscription },
      "Successfully subscribed to push notifications"
    )
  );
});

// 5. UNSUBSCRIBE FROM PUSH NOTIFICATIONS
export const unsubscribeFromPush = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const { endpoint } = req.body;

  if (!endpoint) {
    throw new ApiError(400, "Endpoint is required");
  }

  await NotificationService.unsubscribeFromPush(userId, endpoint);

  res.status(200).json(
    new ApiResponse(
      200,
      null,
      "Successfully unsubscribed from push notifications"
    )
  );
});

// 6. GET VAPID PUBLIC KEY
export const getVapidPublicKey = asyncHandler(async (req, res) => {
  const publicKey = process.env.VAPID_PUBLIC_KEY;

  if (!publicKey) {
    throw new ApiError(500, "VAPID keys not configured");
  }

  res.status(200).json(
    new ApiResponse(
      200,
      { publicKey },
      "VAPID public key fetched successfully"
    )
  );
});

// 7. TEST NOTIFICATION (Development only)
export const testNotification = asyncHandler(async (req, res) => {
  const userId = req.user.id;

  console.log(process.env.NODE_ENV);

  if (process.env.NODE_ENV === 'production') {
    throw new ApiError(403, "Test endpoint not available in production");
  }

  await NotificationService.testWebPush(userId);

  res.status(200).json(
    new ApiResponse(
      200,
      null,
      "Test notification sent successfully"
    )
  );
});