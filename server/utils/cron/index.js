import cron from "node-cron";
import { prisma } from "../../lib/prisma.js";
import { NotificationService } from "../notification/notification.service.js";

export function startOrderExpiryCron() {
  cron.schedule("* * * * *", async () => {
    try {
      console.log("[CRON] Checking for expired orders...");

      const expiredOrders = await prisma.order.findMany({
        where: {
          restaurantStatus: "Pending",
          expiresAt: { lt: new Date() },
          status: { not: "Cancelled" },
        },
        include: {
          restaurant: {
            select: { id: true, name: true },
          },
          user: {
            select: { id: true, name: true },
          },
        },
      });

      for (const order of expiredOrders) {
        try {
          const updated = await prisma.order.updateMany({
            where: {
              id: order.id,
              status: { not: "Cancelled" },
            },
            data: {
              status: "Cancelled",
              restaurantStatus: "Rejected",
              rejectionReason:
                "Restaurant did not respond in time (2-minute timeout)",
            },
          });

          if (updated.count > 0) {
            await NotificationService.send({
              userId: order.userId,
              type: "ORDER_EXPIRED",
              title: "Order Cancelled",
              message: `Your order #${order.id} was cancelled as ${order.restaurant.name} didn't respond in time.`,
              data: { orderId: order.id },
            });

            const restaurantAdmin = await prisma.restaurantAdmin.findFirst({
              where: { restaurantId: order.restaurantId, isActive: true },
            });

            if (restaurantAdmin) {
              await NotificationService.send({
                userId: restaurantAdmin.userId,
                type: "ORDER_EXPIRED",
                title: "Order Auto-Rejected",
                message: `Order #${order.id} was auto-rejected due to 2-minute timeout.`,
                data: { orderId: order.id },
              });
            }

            console.log(`[CRON] Expired order #${order.id}`);
          }
        } catch (error) {
          console.error(`[CRON] Error expiring order #${order.id}:`, error);
        }
      }

      if (expiredOrders.length > 0) {
        console.log(`[CRON] Processed ${expiredOrders.length} expired orders`);
      }
    } catch (error) {
      console.error("[CRON] Order expiry error:", error);
    }
  });

  console.log("Order expiry CRON started (runs every minute)");
}

export function startPaymentExpiryCron() {
  cron.schedule("* * * * *", async () => {
    try {
      console.log("[CRON] Checking for payment timeouts...");

      const paymentExpiredOrders = await prisma.order.findMany({
        where: {
          restaurantStatus: "Accepted",
          paymentStatus: "pending",
          paymentExpiresAt: { lt: new Date() },
          status: { not: "Cancelled" },
        },
        include: {
          user: {
            select: { id: true, name: true },
          },
          restaurant: {
            select: { id: true, name: true },
          },
        },
      });

      for (const order of paymentExpiredOrders) {
        try {
          const updated = await prisma.order.updateMany({
            where: {
              id: order.id,
              status: { not: "Cancelled" },
            },
            data: {
              status: "Cancelled",
              restaurantStatus: "Rejected",
              rejectionReason: "Payment not received within 10 minutes",
            },
          });

          if (updated.count > 0) {
            await prisma.payment.updateMany({
              where: { orderId: order.id },
              data: { status: "expired" },
            });

            await NotificationService.send({
              userId: order.userId,
              type: "PAYMENT_EXPIRED",
              title: "Order Cancelled - Payment Timeout",
              message: `Your order #${order.id} was cancelled as payment wasn't received within 10 minutes.`,
              data: { orderId: order.id },
            });

            const restaurantAdmin = await prisma.restaurantAdmin.findFirst({
              where: { restaurantId: order.restaurantId, isActive: true },
            });

            if (restaurantAdmin) {
              await NotificationService.send({
                userId: restaurantAdmin.userId,
                type: "PAYMENT_EXPIRED",
                title: "Order Cancelled - Payment Timeout",
                message: `Order #${order.id} cancelled due to payment timeout.`,
                data: { orderId: order.id },
              });
            }

            console.log(`[CRON] Payment expired for order #${order.id}`);
          }
        } catch (error) {
          console.error(
            `[CRON] Error processing payment expiry for order #${order.id}:`,
            error
          );
        }
      }

      if (paymentExpiredOrders.length > 0) {
        console.log(
          `[CRON] Processed ${paymentExpiredOrders.length} payment timeouts`
        );
      }
    } catch (error) {
      console.error("[CRON] Payment expiry error:", error);
    }
  });

  console.log(" Payment expiry CRON started (runs every minute)");
}

export function startCommissionSettlementCron() {
  cron.schedule("0 2 * * *", async () => {
    try {
      console.log("[CRON] Starting daily commission settlement...");

      const eligibleCommissions = await prisma.commission.findMany({
        where: {
          status: "pending",
          order: {
            restaurantStatus: "Completed",
            paymentStatus: "paid",
          },
        },
        include: {
          restaurant: {
            select: {
              id: true,
              name: true,
            },
          },
          order: true,
        },
      });

      const restaurantGroups = {};
      eligibleCommissions.forEach((comm) => {
        if (!restaurantGroups[comm.restaurantId]) {
          restaurantGroups[comm.restaurantId] = {
            restaurant: comm.restaurant,
            commissions: [],
            totalOrders: 0,
            totalCommission: 0,
            totalRestaurantAmount: 0,
          };
        }

        restaurantGroups[comm.restaurantId].commissions.push(comm);
        restaurantGroups[comm.restaurantId].totalOrders += 1;
        restaurantGroups[comm.restaurantId].totalCommission += Number(
          comm.commissionAmount
        );
        restaurantGroups[comm.restaurantId].totalRestaurantAmount += Number(
          comm.restaurantAmount
        );
      });

      let totalSettled = 0;
      let totalCommissionAmount = 0;

      for (const [restaurantId, data] of Object.entries(restaurantGroups)) {
        try {
          await prisma.commission.updateMany({
            where: {
              id: { in: data.commissions.map((c) => c.id) },
              status: "pending",
            },
            data: {
              status: "settled",
              settledAt: new Date(),
            },
          });

          const restaurantAdmin = await prisma.restaurantAdmin.findFirst({
            where: { restaurantId: Number(restaurantId), isActive: true },
            include: { user: true },
          });

          if (restaurantAdmin) {
            await NotificationService.send({
              userId: restaurantAdmin.userId,
              type: "SETTLEMENT_PROCESSED",
              title: "Daily Settlement Processed",
              message: `₹${data.totalRestaurantAmount.toFixed(2)} from ${
                data.totalOrders
              } orders has been settled. Commission: ₹${data.totalCommission.toFixed(
                2
              )}`,
              data: {
                restaurantId: Number(restaurantId),
                totalOrders: data.totalOrders,
                totalAmount: data.totalRestaurantAmount,
                commission: data.totalCommission,
                settledAt: new Date().toISOString(),
              },
            });
          }

          totalSettled += data.totalOrders;
          totalCommissionAmount += data.totalCommission;

          console.log(
            `[CRON] Settled Restaurant ${restaurantId}: ${
              data.totalOrders
            } orders, ₹${data.totalRestaurantAmount.toFixed(2)}`
          );
        } catch (error) {
          console.error(
            `[CRON] Failed to settle Restaurant ${restaurantId}:`,
            error
          );

          await prisma.commission.updateMany({
            where: { id: { in: data.commissions.map((c) => c.id) } },
            data: { status: "failed" },
          });
        }
      }

      if (totalSettled > 0) {
        console.log(
          `[CRON] Settlement complete: ${totalSettled} orders, ₹${totalCommissionAmount.toFixed(
            2
          )} commission`
        );

        const superadmins = await prisma.user.findMany({
          where: { role: "superadmin", isActive: true },
        });

        for (const admin of superadmins) {
          await NotificationService.send({
            userId: admin.id,
            type: "SETTLEMENT_SUMMARY",
            title: "Daily Settlement Summary",
            message: `${totalSettled} orders settled across ${
              Object.keys(restaurantGroups).length
            } restaurants. Total commission: ₹${totalCommissionAmount.toFixed(
              2
            )}`,
            data: {
              totalOrders: totalSettled,
              totalRestaurants: Object.keys(restaurantGroups).length,
              totalCommission: totalCommissionAmount,
              date: new Date().toISOString(),
            },
          });
        }
      } else {
        console.log("[CRON] No commissions to settle today");
      }
    } catch (error) {
      console.error("[CRON] Commission settlement error:", error);
    }
  });

  console.log(" Commission settlement CRON started (runs daily at 2 AM)");
}

export function startNotificationCleanupCron() {
  cron.schedule("0 3 * * *", async () => {
    try {
      console.log("[CRON] Cleaning up old notifications...");

      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - 30);

      const deleted = await prisma.notification.deleteMany({
        where: {
          createdAt: { lt: cutoffDate },
          isRead: true,
        },
      });

      console.log(`[CRON] Deleted ${deleted.count} old notifications`);
    } catch (error) {
      console.error("[CRON] Notification cleanup error:", error);
    }
  });

  console.log(" Notification cleanup CRON started (runs daily at 3 AM)");
}

export function startPendingPaymentVerificationCron() {
  cron.schedule("*/5 * * * *", async () => {
    try {
      console.log("[CRON] Verifying pending payments...");

      const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
      const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000);

      const pendingPayments = await prisma.payment.findMany({
        where: {
          status: "pending",
          createdAt: {
            gte: tenMinutesAgo,
            lt: fiveMinutesAgo,
          },
        },
        include: {
          order: true,
        },
      });

      for (const payment of pendingPayments) {
        try {
          // const status = await PaymentService.checkPaymentStatus(payment.gatewayOrderId);
          console.log(
            `[CRON] Checking payment ${payment.id} for order ${payment.orderId}`
          );
        } catch (error) {
          console.error(`[CRON] Error verifying payment ${payment.id}:`, error);
        }
      }
    } catch (error) {
      console.error("[CRON] Pending payment verification error:", error);
    }
  });

  console.log(
    "Pending payment verification CRON started (runs every 5 minutes)"
  );
}

export function startAllCrons() {
  console.log("Starting all CRON jobs...");

  startOrderExpiryCron();
  startPaymentExpiryCron();
  startCommissionSettlementCron();
  startNotificationCleanupCron();
  startPendingPaymentVerificationCron();

  console.log(" All CRON jobs started successfully");
}
