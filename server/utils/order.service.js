import { prisma } from "../lib/prisma.js";

export class OrderService {

  /**
   * Generates time slots and stores them in the database if they don't exist.
   * Returns slots with actual database IDs for proper order association.
   */
  static async generateTimeSlots(estimatedWaitingTime, slotsCount = 8) {
    const slots = [];
    const now = new Date();
    
    const earliestPickupTime = new Date(now.getTime() + estimatedWaitingTime * 60 * 1000);
    
    const minutes = earliestPickupTime.getMinutes();
    const roundedMinutes = Math.ceil(minutes / 30) * 30;
    earliestPickupTime.setMinutes(roundedMinutes);
    earliestPickupTime.setSeconds(0);
    earliestPickupTime.setMilliseconds(0);
    
    for (let i = 0; i < slotsCount; i++) {
      const slotStart = new Date(earliestPickupTime.getTime() + i * 30 * 60 * 1000);
      const slotEnd = new Date(slotStart.getTime() + 30 * 60 * 1000);
      const dayOfWeek = slotStart.getDay();
      
      // Find or create the slot in the database
      let dbSlot = await prisma.timeSlot.findFirst({
        where: {
          slotStart: slotStart,
          slotEnd: slotEnd,
        },
      });
      
      if (!dbSlot) {
        dbSlot = await prisma.timeSlot.create({
          data: {
            slotStart: slotStart,
            slotEnd: slotEnd,
            dayOfWeek: dayOfWeek,
            isAvailable: true,
            bookedCount: 0,
          },
        });
      }
      
      slots.push({
        id: dbSlot.id, // Use actual database ID
        slotStart: slotStart.toISOString(), 
        slotEnd: slotEnd.toISOString(),     
        label: this.formatTimeRange(slotStart, slotEnd),
        isAvailable: dbSlot.isAvailable,
        remainingSlots: 30 - dbSlot.bookedCount, // Assuming capacity of 30
        isFull: dbSlot.bookedCount >= 30,
      });
    }
    
    return slots;
  }

  static formatTimeRange(start, end) {
    const formatTime = (date) => {
      let hours = date.getHours();
      let minutes = date.getMinutes();
      const ampm = hours >= 12 ? 'PM' : 'AM';
      hours = hours % 12;
      hours = hours ? hours : 12;
      minutes = minutes < 10 ? '0' + minutes : minutes;
      return `${hours}:${minutes} ${ampm}`;
    };
    
    return `${formatTime(start)} - ${formatTime(end)}`;
  }


  static async calculateOrderDetails(cartItems, restaurant) {
    const totalAmount = cartItems.reduce(
      (sum, item) => sum + (parseFloat(item.price) * item.quantity),
      0
    );

    const maxWaitingTime = cartItems.reduce((max, item) => {
      const actualWaitingTime = 
        (item.menuItem.waitingTime * restaurant.baseWaitingTimeMultiplier) + 
        restaurant.fixedAdditionalTime;
      return Math.max(max, actualWaitingTime);
    }, 0);

    return {
      totalAmount,
      estimatedWaitingTime: Math.round(maxWaitingTime)
    };
  }

  static async validateCartItems(cartItems) {
    const unavailable = [];
    const priceChanges = [];

    for (const item of cartItems) {
      const currentMenuItem = await prisma.menuItem.findUnique({
        where: { id: item.menuItemId }
      });

      if (!currentMenuItem || !currentMenuItem.isAvailable) {
        unavailable.push({
          id: item.id,
          name: item.menuItem.name
        });
      }

      if (parseFloat(currentMenuItem.price) !== parseFloat(item.price)) {
        priceChanges.push({
          id: item.id,
          name: item.menuItem.name,
          oldPrice: item.price,
          newPrice: currentMenuItem.price
        });
      }
    }

    return {
      isValid: unavailable.length === 0,
      unavailable,
      priceChanges
    };
  }

  static canCancelOrder(order) {
    if (order.paymentStatus === "paid") {
      return {
        canCancel: false,
        reason: "Cannot cancel paid orders. Please contact restaurant."
      };
    }

    if (["Preparing", "Ready", "Completed"].includes(order.restaurantStatus)) {
      return {
        canCancel: false,
        reason: "Order is already being prepared."
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
    if (order.paymentStatus !== "pending" || order.restaurantStatus !== "Accepted") {
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
        progress: 0
      };
    }

    if (order.restaurantStatus === "Pending") {
      const expiresIn = Math.floor((new Date(order.expiresAt) - new Date()) / 1000);
      return {
        status: "Waiting for Confirmation",
        message: `Restaurant has ${Math.max(0, expiresIn)} seconds to accept`,
        color: "yellow",
        progress: 10
      };
    }

    if (order.restaurantStatus === "Accepted" && order.paymentStatus === "pending") {
      const expiresIn = Math.floor((new Date(order.paymentExpiresAt) - new Date()) / 60000);
      return {
        status: "Payment Required",
        message: `Complete payment within ${Math.max(0, expiresIn)} minutes`,
        color: "orange",
        progress: 25,
        action: "PAY_NOW"
      };
    }

    if (order.restaurantStatus === "Accepted" && order.paymentStatus === "paid") {
      return {
        status: "Payment Received",
        message: "Restaurant is preparing your order",
        color: "blue",
        progress: 40
      };
    }

    if (order.restaurantStatus === "Preparing") {
      return {
        status: "Preparing",
        message: order.estimatedReadyTime 
          ? `Ready by ${new Date(order.estimatedReadyTime).toLocaleTimeString()}`
          : "Your order is being prepared",
        color: "blue",
        progress: 60
      };
    }

    if (order.restaurantStatus === "Ready") {
      return {
        status: "Ready for Pickup",
        message: "Your order is ready! Please collect it.",
        color: "green",
        progress: 90,
        action: "VIEW_PICKUP_DETAILS"
      };
    }

    if (order.restaurantStatus === "Completed") {
      return {
        status: "Completed",
        message: "Order completed. Thank you!",
        color: "green",
        progress: 100
      };
    }

    return {
      status: "Unknown",
      message: "Order status unknown",
      color: "gray",
      progress: 0
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
    const commissionAmount = (parseFloat(orderAmount) * parseFloat(commissionRate)) / 100;
    const restaurantAmount = parseFloat(orderAmount) - commissionAmount;

    return {
      commissionAmount: parseFloat(commissionAmount.toFixed(2)),
      restaurantAmount: parseFloat(restaurantAmount.toFixed(2))
    };
  }
}
// utils/orderCalculations.js
export const calculateOrderTotals = async (orderItems, restaurantId) => {
  // Get restaurant tax rate
  const restaurant = await prisma.restaurant.findUnique({
    where: { id: restaurantId },
    select: { taxRate: true },
  });

  const taxRate = restaurant?.taxRate || 0.05; // Default 5%

  // Calculate subtotal
  const subtotal = orderItems.reduce(
    (sum, item) => sum + (item.price * item.quantity),
    0
  );

  // Calculate tax
  const tax = Math.round(subtotal * taxRate * 100) / 100; // Round to 2 decimals

  // Calculate total
  const totalAmount = subtotal + tax;

  return {
    subtotal,
    tax,
    taxRate,
    totalAmount,
  };
};
