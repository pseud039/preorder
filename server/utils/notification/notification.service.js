// services/notification.service.js
import { prisma } from "../../lib/prisma.js";
// import { SMSService } from "./sms.service.js";
import webpush from "web-push";

// Configure web-push with VAPID keys
if (process.env.VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY) {
  webpush.setVapidDetails(
    process.env.VAPID_EMAIL || 'mailto:admin@example.com',
    process.env.VAPID_PUBLIC_KEY,
    process.env.VAPID_PRIVATE_KEY
  );
}

export class NotificationService {
  /**
   * Send notification to user
   * @param {Object} params
   * @param {number} params.userId - User ID
   * @param {string} params.type - Notification type
   * @param {string} params.title - Notification title
   * @param {string} params.message - Notification message
   * @param {Object} params.data - Additional data (optional)
   */
  static async send({ userId, type, title, message, data = null }) {
    try {
      // 1. Save to database (always)
      const notification = await prisma.notification.create({
        data: {
          userId,
          type,
          title,
          message,
          data: data ? JSON.stringify(data) : null,
          isRead: false
        }
      });

      // 2. Send realtime notification (Socket.io) - for all roles
      await this.sendRealtime(userId, notification);

      // 3. Send Web Push notification - only for customers (PWA)
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { role: true }
      });

      if (user?.role === 'customer') {
        await this.sendWebPush(userId, { type, title, message, data });
      }

      // 4. Send SMS for critical notifications
      if (this.isCritical(type)) {
        // await this.sendSMS(userId, message);
      }

      return notification;
    } catch (error) {
      console.error("Error sending notification:", error);
      // Don't throw - notifications failing shouldn't break the main flow
      return null;
    }
  }

  /**
   * Send realtime notification via Socket.io
   */
  static async sendRealtime(userId, notification) {
    try {
      const io = global.io;
      
      if (io) {
        io.to(`user_${userId}`).emit('notification', {
          id: notification.id,
          type: notification.type,
          title: notification.title,
          message: notification.message,
          data: notification.data ? JSON.parse(notification.data) : null,
          createdAt: notification.createdAt
        });
      }
    } catch (error) {
      console.error("Error sending realtime notification:", error);
    }
  }

  /**
   * Send Web Push notification to all user's devices
   */
  static async sendWebPush(userId, payload) {
    try {
      const subscriptions = await prisma.pushSubscription.findMany({
        where: {
          userId,
          isActive: true
        }
      });

      if (subscriptions.length === 0) {
        console.log(`No active push subscriptions for user ${userId}`);
        return;
      }

      const notificationPayload = {
        title: payload.title,
        body: payload.message,
        icon: '/icon-192x192.png',
        badge: '/badge-72x72.png',
        data: {
          ...payload.data,
          type: payload.type,
          url: this.getNotificationUrl(payload.type, payload.data)
        }
      };

      const sendPromises = subscriptions.map(async (sub) => {
        try {
          await webpush.sendNotification(
            {
              endpoint: sub.endpoint,
              keys: {
                p256dh: sub.p256dh,
                auth: sub.auth
              }
            },
            JSON.stringify(notificationPayload)
          );
          console.log(`  Push sent to user ${userId} (${sub.endpoint.slice(-10)})`);
        } catch (error) {
          console.error(`  Failed to send push to ${sub.endpoint}:`, error);
          
          // If subscription is invalid (410 Gone), mark as inactive
          if (error.statusCode === 410) {
            await prisma.pushSubscription.update({
              where: { id: sub.id },
              data: { isActive: false }
            });
            console.log(`Marked subscription ${sub.id} as inactive`);
          }
        }
      });

      await Promise.allSettled(sendPromises);
    } catch (error) {
      console.error("Error sending web push notifications:", error);
    }
  }

  /**
   * Get URL for notification type
   */
  static getNotificationUrl(type, data) {
    const orderId = data?.orderId;
    
    switch (type) {
      case 'ORDER_ACCEPTED':
      case 'ORDER_REJECTED':
      case 'ORDER_PREPARING':
      case 'ORDER_READY':
      case 'ORDER_COMPLETED':
      case 'PAYMENT_REQUIRED':
        return orderId ? `/order-history/${orderId}` : '/orders';
      
      case 'ORDER_PLACED':
        return orderId ? `/admin/orders/${orderId}` : '/admin/orders';
      
      default:
        return '/';
    }
  }

  /**
   * Subscribe to push notifications
   */
  static async subscribeToPush(userId, subscription) {
    try {
      // Check if subscription already exists
      const existing = await prisma.pushSubscription.findUnique({
        where: { endpoint: subscription.endpoint }
      });

      if (existing) {
        // Update existing subscription
        return await prisma.pushSubscription.update({
          where: { id: existing.id },
          data: {
            p256dh: subscription.keys.p256dh,
            auth: subscription.keys.auth,
            isActive: true,
            updatedAt: new Date()
          }
        });
      }

      // Create new subscription
      return await prisma.pushSubscription.create({
        data: {
          userId,
          endpoint: subscription.endpoint,
          p256dh: subscription.keys.p256dh,
          auth: subscription.keys.auth,
          isActive: true
        }
      });
    } catch (error) {
      console.error("Error subscribing to push:", error);
      throw error;
    }
  }

 /**
 * Send notification to admin/chef with enhanced features
 */
static async sendToAdmin({ restaurantId, type, title, message, data = null }) {
  try {
    // Get all admins and chefs for this restaurant
    const [admins, chefs] = await Promise.all([
      prisma.restaurantAdmin.findMany({
        where: { 
          restaurantId,
          isActive: true 
        },
        select: { userId: true }
      }),
      prisma.restaurantChef.findMany({
        where: { 
          restaurantId,
          isActive: true 
        },
        select: { userId: true }
      })
    ]);

    const userIds = [
      ...admins.map(a => a.userId),
      ...chefs.map(c => c.userId)
    ];

    if (userIds.length === 0) {
      console.log('No admins/chefs found for restaurant:', restaurantId);
      return;
    }

    // Send to all admins and chefs
    for (const userId of userIds) {
      await this.send({
        userId,
        type,
        title,
        message,
        data
      });
    }

    return true;
  } catch (error) {
    console.error('Error sending admin notification:', error);
    return false;
  }
}

  /**
   * Unsubscribe from push notifications
   */
  static async unsubscribeFromPush(userId, endpoint) {
    try {
      const subscription = await prisma.pushSubscription.findFirst({
        where: {
          userId,
          endpoint
        }
      });

      if (!subscription) {
        throw new Error("Subscription not found");
      }

      await prisma.pushSubscription.update({
        where: { id: subscription.id },
        data: { isActive: false }
      });

      return true;
    } catch (error) {
      console.error("Error unsubscribing from push:", error);
      throw error;
    }
  }

  /**
   * Test web push notification
   */
  static async testWebPush(userId) {
    await this.sendWebPush(userId, {
      type: 'TEST',
      title: '  Test Notification',
      message: 'This is a test notification from your app!',
      data: { test: true }
    });
  }

  /**
   * Send SMS for critical notifications
   */
//   static async sendSMS(userId, message) {
//     try {
//       const user = await prisma.user.findUnique({
//         where: { id: userId },
//         select: { phone: true, phoneVerified: true }
//       });

//       if (user?.phone && user.phoneVerified) {
//         await SMSService.send(user.phone, message);
//       }
//     } catch (error) {
//       console.error("Error sending SMS notification:", error);
//     }
//   }

  /**
   * Check if notification type is critical
   */
  static isCritical(type) {
    const criticalTypes = [
      'ORDER_ACCEPTED',
      'ORDER_REJECTED',
      'ORDER_READY',
      'PAYMENT_REQUIRED',
      'ORDER_EXPIRED',
      'PAYMENT_EXPIRED',
      'ORDER_PLACED'
    ];

    return criticalTypes.includes(type);
  }

  /**
   * Get notifications for user
   */
  static async getForUser(userId, { page = 1, limit = 20, unreadOnly = false }) {
    const skip = (page - 1) * limit;

    const where = { userId };
    if (unreadOnly) {
      where.isRead = false;
    }

    const [notifications, total, unreadCount] = await Promise.all([
      prisma.notification.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' }
      }),
      prisma.notification.count({ where }),
      prisma.notification.count({
        where: { userId, isRead: false }
      })
    ]);

    return {
      notifications,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      },
      unreadCount
    };
  }

  /**
   * Mark notification as read
   */
  static async markAsRead(notificationId, userId) {
    const notification = await prisma.notification.findUnique({
      where: { id: notificationId }
    });

    if (!notification || notification.userId !== userId) {
      throw new Error("Notification not found or unauthorized");
    }

    return prisma.notification.update({
      where: { id: notificationId },
      data: { isRead: true }
    });
  }

  /**
   * Mark all notifications as read for user
   */
  static async markAllAsRead(userId) {
    return prisma.notification.updateMany({
      where: {
        userId,
        isRead: false
      },
      data: { isRead: true }
    });
  }

  /**
   * Delete old notifications (for cleanup)
   */
  static async cleanupOld(daysOld = 30) {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysOld);

    const deleted = await prisma.notification.deleteMany({
      where: {
        createdAt: { lt: cutoffDate },
        isRead: true
      }
    });

    console.log(`Deleted ${deleted.count} old notifications`);
    return deleted.count;
  }

  /**
   * Bulk send to multiple users
   */
  static async sendBulk(userIds, { type, title, message, data = null }) {
    try {
      const notifications = userIds.map(userId => ({
        userId,
        type,
        title,
        message,
        data: data ? JSON.stringify(data) : null,
        isRead: false
      }));

      await prisma.notification.createMany({
        data: notifications
      });

      // Send realtime to all users via Socket.io
      const io = global.io;
      if (io) {
        userIds.forEach(userId => {
          io.to(`user_${userId}`).emit('notification', {
            type,
            title,
            message,
            data,
            createdAt: new Date()
          });
        });
      }

      // Send web push only to customers (PWA)
      const users = await prisma.user.findMany({
        where: { id: { in: userIds } },
        select: { id: true, role: true }
      });

      const customerIds = users
        .filter(user => user.role === 'customer')
        .map(user => user.id);

      for (const userId of customerIds) {
        await this.sendWebPush(userId, { type, title, message, data });
      }

      return true;
    } catch (error) {
      console.error("Error sending bulk notifications:", error);
      return false;
    }
  }
}