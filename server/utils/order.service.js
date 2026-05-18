import { prisma } from "../lib/prisma.js";
import Restraunt_ID from "./constant.js";

const MAX_BOOKINGS_PER_SLOT = 30;

export class OrderService {
  static async generateTimeSlots(
    estimatedWaitingTime,
    slotsCount = 8,
    restaurantId = Restraunt_ID,
  ) {
    const now = new Date();
    const earliestPickupTime = new Date(
      now.getTime() + estimatedWaitingTime * 60 * 1000,
    );

    const templates = await prisma.timeSlot.findMany({
      where: {
        isAvailable: true,
        bookedCount: {
          lt: MAX_BOOKINGS_PER_SLOT,
        },
      },
      orderBy: [{ dayOfWeek: "asc" }, { startTime: "asc" }],
    });

    if (templates.length === 0) {
      return [];
    }

    const templatesByDay = new Map();
    for (const template of templates) {
      if (!templatesByDay.has(template.dayOfWeek)) {
        templatesByDay.set(template.dayOfWeek, []);
      }
      templatesByDay.get(template.dayOfWeek).push(template);
    }

    const availableSlots = [];

    for (
      let dayOffset = 0;
      dayOffset < 14 && availableSlots.length < slotsCount;
      dayOffset++
    ) {
      const dayDate = new Date(now);
      dayDate.setHours(0, 0, 0, 0);
      dayDate.setDate(dayDate.getDate() + dayOffset);

      const dayOfWeek = dayDate.getDay();
      const dayTemplates = templatesByDay.get(dayOfWeek) || [];

      for (const template of dayTemplates) {
        const startAt = this.combineDateAndTime(dayDate, template.startTime);
        const endAt = this.combineDateAndTime(dayDate, template.endTime);

        if (startAt < earliestPickupTime) {
          continue;
        }

        availableSlots.push({
          id: template.id,
          dayOfWeek: template.dayOfWeek,
          startTime: template.startTime,
          endTime: template.endTime,
          scheduledAt: startAt.toISOString(),
          label: this.formatTimeRange(startAt, endAt),
          isAvailable: true,
          remainingSlots: Math.max(
            0,
            MAX_BOOKINGS_PER_SLOT - template.bookedCount,
          ),
          isFull: template.bookedCount >= MAX_BOOKINGS_PER_SLOT,
          isToday: dayOffset === 0,
          dayLabel: this.getDayLabel(dayOffset, dayDate),
        });

        if (availableSlots.length >= slotsCount) {
          break;
        }
      }
    }

    return availableSlots;
  }

  static combineDateAndTime(baseDate, time) {
    const [hours, minutes] = time.split(":").map(Number);
    const mergedDate = new Date(baseDate);
    mergedDate.setHours(hours, minutes, 0, 0);
    return mergedDate;
  }

  static getDayLabel(dayOffset, date) {
    if (dayOffset === 0) {
      return "Today";
    }

    if (dayOffset === 1) {
      return "Tomorrow";
    }

    return date.toLocaleDateString("en-US", { weekday: "long" });
  }

  static formatTimeRange(start, end) {
    const formatTime = (date) => {
      let hours = date.getHours();
      let minutes = date.getMinutes();
      const ampm = hours >= 12 ? "PM" : "AM";
      hours = hours % 12;
      hours = hours ? hours : 12;
      minutes = minutes < 10 ? "0" + minutes : minutes;
      return `${hours}:${minutes} ${ampm}`;
    };

    return `${formatTime(start)} - ${formatTime(end)}`;
  }

  static async calculateOrderDetails(cartItems, restaurant) {
    const totalAmount = cartItems.reduce(
      (sum, item) => sum + parseFloat(item.price) * item.quantity,
      0,
    );

    const maxWaitingTime = cartItems.reduce((max, item) => {
      const actualWaitingTime =
        item.menuItem.waitingTime * restaurant.baseWaitingTimeMultiplier +
        restaurant.fixedAdditionalTime;
      return Math.max(max, actualWaitingTime);
    }, 0);

    return {
      totalAmount,
      estimatedWaitingTime: Math.round(maxWaitingTime),
    };
  }

  static async validateCartItems(cartItems) {
    const unavailable = [];
    const priceChanges = [];

    for (const item of cartItems) {
      const currentMenuItem = await prisma.menuItem.findUnique({
        where: { id: item.menuItemId },
      });

      if (!currentMenuItem || !currentMenuItem.isAvailable) {
        unavailable.push({
          id: item.id,
          name: item.menuItem.name,
        });
      }

      if (parseFloat(currentMenuItem.price) !== parseFloat(item.price)) {
        priceChanges.push({
          id: item.id,
          name: item.menuItem.name,
          oldPrice: item.price,
          newPrice: currentMenuItem.price,
        });
      }
    }

    return {
      isValid: unavailable.length === 0,
      unavailable,
      priceChanges,
    };
  }

  static canCancelOrder(order) {
    if (order.paymentStatus === "paid") {
      return {
        canCancel: false,
        reason: "Cannot cancel paid orders. Please contact restaurant.",
      };
    }

    if (["Preparing", "Ready", "Completed"].includes(order.restaurantStatus)) {
      return {
        canCancel: false,
        reason: "Order is already being prepared.",
      };
    }

    return { canCancel: true };
  }

  static isOrderExpired(order) {
    if (order.restaurantStatus !== "Pending") {
      return false;
    }

    return new Date() > new Date(order.expiresAt);
  }

  static isPaymentExpired(order) {
    if (
      order.paymentStatus !== "pending" ||
      order.restaurantStatus !== "Accepted"
    ) {
      return false;
    }

    if (!order.paymentExpiresAt) {
      return false;
    }

    return new Date() > new Date(order.paymentExpiresAt);
  }

  static getOrderStatusDisplay(order) {
    if (order.status === "Cancelled") {
      return {
        status: "Cancelled",
        message: order.rejectionReason || "Order was cancelled",
        color: "red",
        progress: 0,
      };
    }

    if (order.restaurantStatus === "Pending") {
      const expiresIn = Math.floor(
        (new Date(order.expiresAt) - new Date()) / 1000,
      );
      return {
        status: "Waiting for Confirmation",
        message: `Restaurant has ${Math.max(0, expiresIn)} seconds to accept`,
        color: "yellow",
        progress: 10,
      };
    }

    if (
      order.restaurantStatus === "Accepted" &&
      order.paymentStatus === "pending"
    ) {
      const expiresIn = Math.floor(
        (new Date(order.paymentExpiresAt) - new Date()) / 60000,
      );
      return {
        status: "Payment Required",
        message: `Complete payment within ${Math.max(0, expiresIn)} minutes`,
        color: "orange",
        progress: 25,
        action: "PAY_NOW",
      };
    }

    if (
      order.restaurantStatus === "Accepted" &&
      order.paymentStatus === "paid"
    ) {
      return {
        status: "Payment Received",
        message: "Restaurant is preparing your order",
        color: "blue",
        progress: 40,
      };
    }

    if (order.restaurantStatus === "Preparing") {
      return {
        status: "Preparing",
        message: order.estimatedReadyTime
          ? `Ready by ${new Date(order.estimatedReadyTime).toLocaleTimeString()}`
          : "Your order is being prepared",
        color: "blue",
        progress: 60,
      };
    }

    if (order.restaurantStatus === "Ready") {
      return {
        status: "Ready for Pickup",
        message: "Your order is ready! Please collect it.",
        color: "green",
        progress: 90,
        action: "VIEW_PICKUP_DETAILS",
      };
    }

    if (order.restaurantStatus === "Completed") {
      return {
        status: "Completed",
        message: "Order completed. Thank you!",
        color: "green",
        progress: 100,
      };
    }

    return {
      status: "Unknown",
      message: "Order status unknown",
      color: "gray",
      progress: 0,
    };
  }

  static getNextValidStatuses(currentStatus, paymentStatus) {
    if (currentStatus === "Pending") {
      return ["Accepted", "Rejected"];
    }

    if (currentStatus === "Accepted" && paymentStatus === "paid") {
      return ["Preparing"];
    }

    if (currentStatus === "Preparing") {
      return ["Ready"];
    }

    if (currentStatus === "Ready") {
      return ["Completed"];
    }

    return [];
  }

  static calculateCommission(orderAmount, commissionRate) {
    const commissionAmount =
      (parseFloat(orderAmount) * parseFloat(commissionRate)) / 100;
    const restaurantAmount = parseFloat(orderAmount) - commissionAmount;

    return {
      commissionAmount: parseFloat(commissionAmount.toFixed(2)),
      restaurantAmount: parseFloat(restaurantAmount.toFixed(2)),
    };
  }
}
// const PLATFORM_FEE_CONFIG = {
//   fixedFee: 5,
//   percentageFee: 0.02,
//   minFee: 5,
//   maxFee: 50,
// };
const PLATFORM_FEE_CONFIG = await prisma.paymentSetup.findFirst({
  where: { restaurantId: 3 },
});

export const calculateOrderTotals = async (orderItems, restaurantId) => {
  const restaurant = await prisma.restaurant.findUnique({
    where: { id: restaurantId },
    select: { taxRate: true },
  });

  const taxRate = restaurant?.taxRate || 0.05; // Default 5%

  const subtotal = orderItems.reduce(
    (sum, item) => sum + parseFloat(item.price) * item.quantity,
    0,
  );
  const PLATFORM_FEE_CONFIG = await prisma.paymentSetup.findFirst({
    where: { restaurantId: 3 },
  });
  console.log("Fee config: ", PLATFORM_FEE_CONFIG);

  let platformFee =
    PLATFORM_FEE_CONFIG.fixedfee + subtotal * (PLATFORM_FEE_CONFIG.precentagefee/100);
  platformFee = Math.max(
    PLATFORM_FEE_CONFIG.minFee,
    Math.min(PLATFORM_FEE_CONFIG.maxFee, platformFee),
  );
  platformFee = Math.round(platformFee * 100) / 100; // Round to 2 decimals

  const tax = Math.round(subtotal * taxRate * 100) / 100; // Round to 2 decimals

  const totalAmount = Math.round((subtotal + tax + platformFee) * 100) / 100;

  return {
    subtotal: Math.round(subtotal * 100) / 100,
    tax,
    taxRate,
    taxPercentage: Math.round(taxRate * 100), // For display: e.g., 5%
    platformFee,
    totalAmount,
    breakdown: {
      itemsTotal: Math.round(subtotal * 100) / 100,
      taxAmount: tax,
      taxLabel: `GST (${Math.round(taxRate * 100)}%)`,
      platformFeeAmount: platformFee,
      platformFeeLabel: "Platform Fee",
      grandTotal: totalAmount,
    },
  };
};



