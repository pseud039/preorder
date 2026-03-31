import { prisma } from "../../lib/prisma.js";
import { asyncHandler } from "../../utils/errorHandler.js";
import { ApiResponse } from "../../utils/ApiResponse.js";
import { ApiError } from "../../utils/ApiError.js";
import { NotificationService } from "../../utils/notification/notification.service.js";
import { calculateOrderTotals } from "../../utils/order.service.js";
import Restraunt_ID from "../../utils/constant.js";

function validateStatusTransition(currentStatus, newStatus) {
  // Define allowed transitions
  const allowedTransitions = {
    Pending: ["Accepted", "Rejected"],
    Accepted: ["Preparing"],
    Preparing: ["Ready"],
    Ready: ["Completed"],
    Rejected: [], // Cannot transition from rejected
    Completed: [], // Cannot transition from completed
  };

  // Check if the transition is allowed
  const allowed = allowedTransitions[currentStatus];

  if (!allowed) {
    throw new ApiError(
      400,
      `Invalid current status: ${currentStatus}`
    );
  }

  if (!allowed.includes(newStatus)) {
    throw new ApiError(
      400,
      `Cannot change order status from '${currentStatus}' to '${newStatus}'. Allowed transitions: ${
        allowed.length > 0 ? allowed.join(", ") : "None"
      }`
    );
  }
}

// Helper: Validate if order can be edited
// Orders can only be edited when NOT paid - admin can modify before customer pays
function validateOrderCanBeEdited(order) {
  if (order.status === "Cancelled") {
    throw new ApiError(400, "Cannot edit a cancelled order");
  }

  if (order.restaurantStatus === "Completed") {
    throw new ApiError(400, "Cannot edit a completed order");
  }

  if (order.restaurantStatus === "Rejected") {
    throw new ApiError(400, "Cannot edit a rejected order");
  }

  if (["Preparing", "Ready"].includes(order.restaurantStatus)) {
    throw new ApiError(
      400,
      "Cannot edit order once preparation has started"
    );
  }

  if (!["Pending", "Accepted"].includes(order.restaurantStatus)) {
    throw new ApiError(
      400,
      `Cannot edit order with status: ${order.restaurantStatus}`
    );
  }

  // Only allow editing unpaid orders - once paid, order is locked
  if (order.paymentStatus === "paid") {
    throw new ApiError(400, "Cannot edit paid orders. Order is locked after payment.");
  }
}

export const getAllOrders = asyncHandler(async (req, res) => {
  const restaurantId = req.user.restaurantId;
  const {
    status,
    restaurantStatus,
    paymentStatus,
    page = 1,
    limit = 20,
    startDate,
    endDate,
    search,
  } = req.query;

  const where = {
    restaurantId: restaurantId,
  };

  if (status) {
    where.status = status;
  }

  if (restaurantStatus) {
    where.restaurantStatus = restaurantStatus;
  }

  if (paymentStatus) {
    where.paymentStatus = paymentStatus;
  }

  if (startDate || endDate) {
    where.createdAt = {};
    if (startDate) where.createdAt.gte = new Date(startDate);
    if (endDate) where.createdAt.lte = new Date(endDate);
  }

  if (search) {
    where.OR = [];

    if (!isNaN(search)) {
      where.OR.push({ id: parseInt(search) });
    }

    where.OR.push(
      { user: { name: { contains: search, mode: "insensitive" } } },
      { user: { email: { contains: search, mode: "insensitive" } } },
      { user: { phone: { contains: search, mode: "insensitive" } } }
    );
  }

  const pageNum = parseInt(page);
  const limitNum = parseInt(limit);
  const skip = (pageNum - 1) * limitNum;

  const [orders, total] = await Promise.all([
    prisma.order.findMany({
      where,
      skip,
      take: limitNum,
      orderBy: { createdAt: "desc" },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
          },
        },
        orderItems: {
          include: {
            menuItem: {
              select: {
                id: true,
                name: true,
                price: true,
                imageUrl: true,
                isVeg: true,
              },
            },
          },
        },
        timeSlot: true,
        payment: {
          select: {
            id: true,
            status: true,
            gatewayPaymentId: true,
            amount: true,
            createdAt: true,
          },
        },
      },
    }),
    prisma.order.count({ where }),
  ]);

  res.status(200).json(
    new ApiResponse(
      200,
      {
        orders,
        pagination: {
          total,
          page: pageNum,
          limit: limitNum,
          totalPages: Math.ceil(total / limitNum),
        },
      },
      "Orders fetched successfully"
    )
  );
});

export const getOrderDetails = asyncHandler(async (req, res) => {
  const { orderId } = req.params;
  const restaurantId = req.user.restaurantId;

  const order = await prisma.order.findFirst({
    where: {
      id: parseInt(orderId),
      restaurantId: restaurantId,
    },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
        },
      },
      orderItems: {
        include: {
          menuItem: true,
        },
      },
      timeSlot: true,
      payment: true,
      commission: true,
    },
  });

  if (!order) {
    throw new ApiError(404, "Order not found");
  }

  res
    .status(200)
    .json(new ApiResponse(200, order, "Order details fetched successfully"));
});

export async function markAsPaid(orderId){
  const done = await prisma.order.update({
    where: { id: parseInt(orderId) },
    data: {
      paymentStatus: "paid",
    },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
        },
      },
      orderItems: {
        include: {
          menuItem: true,
        },
      },
      timeSlot: true,
      payment: true,
    },
  });
  if(done)
    return true;
    else
    return false;
}
export const updateOrderStatus = asyncHandler(async (req, res) => {
  const { orderId } = req.params;
  const { status, restaurantStatus, rejectionReason } = req.body;
  const restaurantId = req.user.restaurantId;

  if (!status && !restaurantStatus) {
    throw new ApiError(
      400,
      "Please provide either 'status' or 'restaurantStatus'"
    );
  }

  const order = await prisma.order.findFirst({
    where: {
      id: parseInt(orderId),
      restaurantId: restaurantId,
    },
  });

  if (!order) {
    throw new ApiError(404, "Order not found");
  }

  const validStatuses = ["Waiting", "Finished", "Delivered", "Cancelled"];
  const validRestaurantStatuses = [
    "Pending",
    "Updated",
    "Accepted",
    "Rejected",
    "Preparing",
    "Ready",
    "Completed",
  ];

  if (status && !validStatuses.includes(status)) {
    throw new ApiError(400, "Invalid order status");
  }

  if (restaurantStatus && !validRestaurantStatuses.includes(restaurantStatus)) {
    throw new ApiError(400, "Invalid restaurant order status");
  }
 if (restaurantStatus === "Rejected" && order.paymentStatus === "paid") {
    throw new ApiError(
      400,
      "Cannot reject a paid order. Please process a refund first or contact the customer."
    );
  }

  if (
    order.restaurantStatus === "Completed" &&
    restaurantStatus !== "Completed"
  ) {
    throw new ApiError(400, "Cannot change status of a completed order");
  }

  if (order.status === "Cancelled") {
    throw new ApiError(400, "Cannot update a cancelled order");
  }
if (restaurantStatus) {
    validateStatusTransition(order.restaurantStatus, restaurantStatus);
  }
  const updateData = {};

  if (status) {
    updateData.status = status;
  }

  if (restaurantStatus) {
    updateData.restaurantStatus = restaurantStatus;

    if (restaurantStatus === "Rejected") {
      updateData.rejectedAt = new Date();
      updateData.rejectionReason = rejectionReason || "No reason provided";

      updateData.status = "Cancelled";
    }

    if (restaurantStatus === "Accepted") {
      updateData.acceptedAt = new Date();
      updateData.expiresAt = null;

      const restaurant = await prisma.restaurant.findUnique({
        where: { id: restaurantId },
        select: {
          baseWaitingTimeMultiplier: true,
          fixedAdditionalTime: true,
        },
      });

      const orderItems = await prisma.orderItem.findMany({
        where: { orderId: order.id },
      });

      const maxWaitingTime = Math.max(
        ...orderItems.map((item) => item.waitingTime)
      );

      const actualWaitingTime = Math.round(
        maxWaitingTime * parseFloat(restaurant.baseWaitingTimeMultiplier) +
          restaurant.fixedAdditionalTime
      );

      updateData.estimatedWaitingTime = actualWaitingTime;
      updateData.estimatedReadyTime = new Date(
        Date.now() + actualWaitingTime * 60 * 1000
      );
      const paymentProcess = process.env.MANUAL_PAYMENT;
      if(paymentProcess === "true"){
        const markAsPaidResult = await markAsPaid(orderId);
        if(!markAsPaidResult){
          throw new ApiError(500, "Failed to mark order as paid");
        }
      }
    }

    if (restaurantStatus === "Completed") {
      updateData.status = "Delivered";
      updateData.actualPickupTime = new Date();
    }
  }

  const updatedOrder = await prisma.order.update({
    where: { id: parseInt(orderId) },
    data: updateData,
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
        },
      },
      orderItems: {
        include: {
          menuItem: true,
        },
      },
      timeSlot: true,
      payment: true,
    },
  });

  let notificationType, notificationTitle, notificationMessage;

  if (restaurantStatus === "Accepted") {
    notificationType = "ORDER_ACCEPTED";
    notificationTitle = "Order Accepted!";
    notificationMessage = `Your order #${order.id} has been accepted and will be ready in ${updateData.estimatedWaitingTime} minutes`;
  } else if (restaurantStatus === "Rejected") {
    notificationType = "ORDER_REJECTED";
    notificationTitle = "Order Rejected";
    notificationMessage = `Sorry, your order #${order.id} has been rejected. Reason: ${rejectionReason}`;
  } else if (restaurantStatus === "Preparing") {
    notificationType = "ORDER_PREPARING";
    notificationTitle = "Order is being prepared";
    notificationMessage = `Your order #${order.id} is now being prepared`;
  } else if (restaurantStatus === "Ready") {
    notificationType = "ORDER_READY";
    notificationTitle = "Order Ready!";
    notificationMessage = `Your order #${order.id} is ready for pickup`;
  } else if (restaurantStatus === "Completed") {
    notificationType = "ORDER_COMPLETED";
    notificationTitle = "Order Completed";
    notificationMessage = `Thank you! Your order #${order.id} is completed`;
  }

  if (notificationType) {
    await NotificationService.send({
      userId: order.userId,
      type: notificationType,
      title: notificationTitle,
      message: notificationMessage,
      data: {
        orderId: order.id,
        restaurantStatus: restaurantStatus || order.restaurantStatus,
      },
    });
  }

  res
    .status(200)
    .json(
      new ApiResponse(200, updatedOrder, "Order status updated successfully")
    );
});

export const cancelOrder = asyncHandler(async (req, res) => {
  const { orderId } = req.params;
  const { reason } = req.body;
  const restaurantId = req.user.restaurantId;

  const order = await prisma.order.findFirst({
    where: {
      id: parseInt(orderId),
      restaurantId: restaurantId,
    },
    include: { payment: true },
  });

  if (!order) {
    throw new ApiError(404, "Order not found");
  }

  if (order.status === "Delivered" || order.restaurantStatus === "Completed") {
    throw new ApiError(400, "Completed/delivered orders cannot be cancelled");
  }

  if (order.status === "Cancelled") {
    throw new ApiError(400, "Order is already cancelled");
  }

  const updatedOrder = await prisma.order.update({
    where: { id: parseInt(orderId) },
    data: {
      status: "Cancelled",
      restaurantStatus: "Rejected",
      rejectedAt: new Date(),
      rejectionReason: reason || "Cancelled by admin",
      notes: reason
        ? `${order.notes || ""}\nCancellation reason: ${reason}`
        : order.notes,
    },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
        },
      },
      orderItems: {
        include: {
          menuItem: true,
        },
      },
      payment: true,
    },
  });

  await prisma.notification.create({
    data: {
      userId: order.userId,
      type: "ORDER_REJECTED",
      title: "Order Cancelled",
      message: `Your order #${order.id} has been cancelled. ${
        reason ? `Reason: ${reason}` : ""
      }`,
      data: {
        orderId: order.id,
      },
    },
  });

  // TODO: Initiate refund if payment was successful

  res
    .status(200)
    .json(new ApiResponse(200, updatedOrder, "Order cancelled successfully"));
});

export const getDashboardStats = asyncHandler(async (req, res) => {
  const restaurantId = req.user.restaurantId;
  const { startDate, endDate } = req.query;

  const dateFilter = {};
  if (startDate || endDate) {
    if (startDate) dateFilter.gte = new Date(startDate);
    if (endDate) dateFilter.lte = new Date(endDate);
  }

  const whereClause = {
    restaurantId: restaurantId,
    ...(Object.keys(dateFilter).length > 0 && { createdAt: dateFilter }),
  };

  const [
    totalOrders,
    pendingOrders,
    acceptedOrders,
    preparingOrders,
    readyOrders,
    completedOrders,
    cancelledOrders,
    totalRevenue,
    paidRevenue,
    todayOrders,
  ] = await Promise.all([
    prisma.order.count({ where: whereClause }),

    prisma.order.count({
      where: { ...whereClause, restaurantStatus: "Pending" },
    }),

    prisma.order.count({
      where: { ...whereClause, restaurantStatus: "Accepted" },
    }),

    prisma.order.count({
      where: { ...whereClause, restaurantStatus: "Preparing" },
    }),

    prisma.order.count({
      where: { ...whereClause, restaurantStatus: "Ready" },
    }),

    prisma.order.count({
      where: { ...whereClause, restaurantStatus: "Completed" },
    }),

    prisma.order.count({
      where: { ...whereClause, status: "Cancelled" },
    }),

    prisma.order.aggregate({
      where: whereClause,
      _sum: { totalAmount: true },
    }),

    prisma.order.aggregate({
      where: { ...whereClause, paymentStatus: "paid" },
      _sum: { totalAmount: true },
    }),

    prisma.order.count({
      where: {
        restaurantId,
        createdAt: {
          gte: new Date(new Date().setHours(0, 0, 0, 0)),
        },
      },
    }),
  ]);

  res.status(200).json(
    new ApiResponse(
      200,
      {
        totalOrders,
        pendingOrders,
        acceptedOrders,
        preparingOrders,
        readyOrders,
        completedOrders,
        cancelledOrders,
        activeOrders:
          pendingOrders + acceptedOrders + preparingOrders + readyOrders,
        todayOrders,
        totalRevenue: totalRevenue._sum.totalAmount || 0,
        paidRevenue: paidRevenue._sum.totalAmount || 0,
        pendingRevenue:
          (totalRevenue._sum.totalAmount || 0) -
          (paidRevenue._sum.totalAmount || 0),
      },
      "Dashboard stats fetched successfully"
    )
  );
});

export const getRevenueReport = asyncHandler(async (req, res) => {
  const restaurantId = req.user.restaurantId;
  const { startDate, endDate, groupBy = "day" } = req.query;

  const where = {
    restaurantId: restaurantId,
    paymentStatus: "paid",
  };

  if (startDate || endDate) {
    where.createdAt = {};
    if (startDate) where.createdAt.gte = new Date(startDate);
    if (endDate) where.createdAt.lte = new Date(endDate);
  }

  const orders = await prisma.order.findMany({
    where,
    select: {
      createdAt: true,
      totalAmount: true,
    },
    orderBy: { createdAt: "asc" },
  });

  const revenueByDate = {};
  orders.forEach((order) => {
    let dateKey;
    const date = new Date(order.createdAt);

    if (groupBy === "month") {
      dateKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(
        2,
        "0"
      )}`;
    } else {
      dateKey = date.toISOString().split("T")[0];
    }

    if (!revenueByDate[dateKey]) {
      revenueByDate[dateKey] = {
        date: dateKey,
        revenue: 0,
        orderCount: 0,
      };
    }

    revenueByDate[dateKey].revenue += Number(order.totalAmount);
    revenueByDate[dateKey].orderCount += 1;
  });

  const revenueData = Object.values(revenueByDate);

  res.status(200).json(
    new ApiResponse(
      200,
      {
        revenueByDate: revenueData,
        totalRevenue: revenueData.reduce((sum, item) => sum + item.revenue, 0),
        totalOrders: revenueData.reduce(
          (sum, item) => sum + item.orderCount,
          0
        ),
      },
      "Revenue report fetched successfully"
    )
  );
});

export const getPopularItems = asyncHandler(async (req, res) => {
  const restaurantId = req.user.restaurantId;
  const { startDate, endDate, limit = 10 } = req.query;

  const orderWhere = {
    restaurantId: restaurantId,
    paymentStatus: "paid",
  };

  if (startDate || endDate) {
    orderWhere.createdAt = {};
    if (startDate) orderWhere.createdAt.gte = new Date(startDate);
    if (endDate) orderWhere.createdAt.lte = new Date(endDate);
  }

  const popularItems = await prisma.orderItem.groupBy({
    by: ["menuItemId"],
    where: {
      order: orderWhere,
    },
    _sum: {
      quantity: true,
    },
    _count: {
      id: true,
    },
    orderBy: {
      _sum: {
        quantity: "desc",
      },
    },
    take: parseInt(limit),
  });

  const itemsWithDetails = await Promise.all(
    popularItems.map(async (item) => {
      const menuItem = await prisma.menuItem.findUnique({
        where: { id: item.menuItemId },
        select: {
          id: true,
          name: true,
          price: true,
          imageUrl: true,
          isVeg: true,
          category: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      });

      return {
        ...menuItem,
        totalQuantitySold: item._sum.quantity,
        orderCount: item._count.id,
        revenue: Number(menuItem.price) * item._sum.quantity,
      };
    })
  );

  res
    .status(200)
    .json(
      new ApiResponse(
        200,
        { items: itemsWithDetails },
        "Popular items fetched successfully"
      )
    );
});

export const getOrderForEdit = asyncHandler(async (req, res) => {
  const { orderId } = req.params;
  const restaurantId = req.user.restaurantId || Restraunt_ID;

  const order = await prisma.order.findFirst({
    where: {
      id: parseInt(orderId),
      restaurantId: restaurantId,
    },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          phone: true,
          email: true,
        },
      },
      orderItems: {
        include: {
          menuItem: {
            select: {
              id: true,
              name: true,
              price: true,
              imageUrl: true,
              isVeg: true,
              category: true,
              isAvailable: true,
              waitingTime: true,
            },
          },
        },
      },
      timeSlot: true,
      payment: {
        select: {
          id: true,
          status: true,
          amount: true,
        },
      },
    },
  });

  if (!order) {
    throw new ApiError(404, "Order not found");
  }

  // Validate if order can be edited
  validateOrderCanBeEdited(order);

  // Get available menu items for adding
  const availableMenuItems = await prisma.menuItem.findMany({
    where: {
      restaurantId: restaurantId,
      isAvailable: true,
    },
    select: {
      id: true,
      name: true,
      price: true,
      imageUrl: true,
      isVeg: true,
      category: true,
      waitingTime: true,
    },
    orderBy: {
      categoryId: "asc",
    },
  });

  // Get available time slots
  const availableTimeSlots = await prisma.timeSlot.findMany({
    where: {
      isAvailable: true,
    },
    orderBy: [
      { dayOfWeek: "asc" },
      { startTime: "asc" },
    ],
  });

  res.status(200).json(
    new ApiResponse(
      200,
      {
        order,
        availableMenuItems,
        availableTimeSlots,
        canEdit: true,
      },
      "Order fetched for editing"
    )
  );
});

export const updateOrderDetails = asyncHandler(async (req, res) => {
  const { orderId } = req.params;
  const { orderItems, timeSlotId } = req.body;
  const restaurantId = req.user.restaurantId || Restraunt_ID;

  if (!orderItems || !Array.isArray(orderItems) || orderItems.length === 0) {
    throw new ApiError(400, "Order must have at least one item");
  }

  const order = await prisma.order.findFirst({
    where: {
      id: parseInt(orderId),
      restaurantId: restaurantId,
    },
    include: {
      orderItems: {
        include: {
          menuItem: true,
        },
      },
      user: {
        select: {
          id: true,
          name: true,
          phone: true,
          email: true,
        },
      },
    },
  });

  if (!order) {
    throw new ApiError(404, "Order not found");
  }

  validateOrderCanBeEdited(order);

  const updateData = {};
  const changes = [];

  const oldItemsMap = new Map(
    order.orderItems.map((item) => [item.menuItemId, item.quantity])
  );
  const newItemsMap = new Map(
    orderItems.map((item) => [item.menuItemId, item.quantity])
  );

  const itemsChanged =
    oldItemsMap.size !== newItemsMap.size ||
    [...oldItemsMap.keys()].some(
      (key) => !newItemsMap.has(key) || oldItemsMap.get(key) !== newItemsMap.get(key)
    );

  if (itemsChanged) {
    const menuItemIds = orderItems.map((item) => item.menuItemId);
    const menuItems = await prisma.menuItem.findMany({
      where: {
        id: { in: menuItemIds },
        restaurantId: restaurantId,
      },
    });

    if (menuItems.length !== menuItemIds.length) {
      throw new ApiError(400, "Some menu items not found");
    }

    const unavailableItems = menuItems.filter((item) => !item.isAvailable);
    if (unavailableItems.length > 0) {
      throw new ApiError(
        400,
        `These items are not available: ${unavailableItems.map((i) => i.name).join(", ")}`
      );
    }

    await prisma.orderItem.deleteMany({
      where: { orderId: order.id },
    });

    // FIX: Convert Decimal to Number for proper calculation
    const orderItemsData = orderItems.map((item) => {
      const menuItem = menuItems.find((mi) => mi.id === item.menuItemId);
      
      return {
        orderId: order.id,
        menuItemId: item.menuItemId,
        quantity: item.quantity,
        price: menuItem.price, // Keep as Decimal for Prisma
        waitingTime: menuItem.waitingTime || 0,
      };
    });

    await prisma.orderItem.createMany({
      data: orderItemsData,
    });

    // FIX: Convert Decimal to Number for calculateOrderTotals
    const orderItemsForCalculation = orderItemsData.map(item => ({
      ...item,
      price: Number(item.price) // Convert Decimal to Number
    }));

    // Calculate totals using helper with converted prices
    const totals = await calculateOrderTotals(orderItemsForCalculation, restaurantId);
    
    // FIX: Ensure totalAmount is properly set as a number
    // Prisma will convert it to Decimal automatically
    updateData.totalAmount = totals.totalAmount;

    changes.push("order items");
  }

  // Update time slot
  if (timeSlotId && timeSlotId !== order.timeSlotId) {
    const timeSlot = await prisma.timeSlot.findUnique({
      where: { id: parseInt(timeSlotId) },
    });

    if (!timeSlot) {
      throw new ApiError(404, "Time slot not found");
    }

    if (!timeSlot.isAvailable) {
      throw new ApiError(400, "Selected time slot is not available");
    }

    updateData.timeSlotId = parseInt(timeSlotId);
    changes.push("pickup time");
  }

  if (changes.length === 0) {
    throw new ApiError(400, "No changes detected");
  }

  // Update the order with new totalAmount
  const updatedOrder = await prisma.order.update({
    where: { id: parseInt(orderId) },
    data: updateData,
    include: {
      user: {
        select: {
          id: true,
          name: true,
          phone: true,
          email: true,
        },
      },
      orderItems: {
        include: {
          menuItem: {
            select: {
              id: true,
              name: true,
              price: true,
              imageUrl: true,
              isVeg: true,
              category: true,
            },
          },
        },
      },
      timeSlot: true,
      payment: true,
    },
  });
// @TODO:CREATE NOTIFICATION

  // const changesText = changes.join(", ");
  // await prisma.notification.create({
  //   data: {
  //     userId: order.userId,
  //     type: "ORDER_UPDATED",
  //     title: "Your Order Has Been Updated",
  //     message: `Your order #${order.id} has been modified by the restaurant. Changes made: ${changesText}. Please review your updated order.`,
  //     data: {
  //       orderId: order.id,
  //       changes: changes,
  //       updatedBy: "restaurant",
  //       newTotal: Number(updatedOrder.totalAmount),
  //       oldTotal: Number(order.totalAmount),
  //     },
  //   },
  // });

  res.status(200).json(
    new ApiResponse(
      200,
      updatedOrder,
      `Order updated successfully. Changes: ${changes.join(", ")}`
    )
  );
});
// Delete a specific order item
export const deleteOrderItem = asyncHandler(async (req, res) => {
  const { orderId, orderItemId } = req.params;
  const restaurantId = req.user.restaurantId || Restraunt_ID;

  // Find the order
  const order = await prisma.order.findFirst({
    where: {
      id: parseInt(orderId),
      restaurantId: restaurantId,
    },
    include: {
      orderItems: {
        include: {
          menuItem: true,
        },
      },
      user: {
        select: {
          id: true,
          name: true,
        },
      },
    },
  });

  if (!order) {
    throw new ApiError(404, "Order not found");
  }

  // Validate order can be edited
  validateOrderCanBeEdited(order);

  // Check if order item exists
  const orderItem = order.orderItems.find(
    (item) => item.id === parseInt(orderItemId)
  );

  if (!orderItem) {
    throw new ApiError(404, "Order item not found");
  }

  // Cannot delete if it's the only item
  if (order.orderItems.length === 1) {
    throw new ApiError(
      400,
      "Cannot delete the last item. Order must have at least one item. Consider cancelling the order instead."
    );
  }

  // Delete the order item
  await prisma.orderItem.delete({
    where: { id: parseInt(orderItemId) },
  });

  // Recalculate order totals
  const remainingItems = await prisma.orderItem.findMany({
    where: { orderId: order.id },
  });

  const totals = await calculateOrderTotals(remainingItems, restaurantId);

  // Update order with new totals
  const updatedOrder = await prisma.order.update({
    where: { id: parseInt(orderId) },
    data: {
      totalAmount: totals.totalAmount,
    },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          phone: true,
        },
      },
      orderItems: {
        include: {
          menuItem: {
            select: {
              id: true,
              name: true,
              price: true,
              imageUrl: true,
              isVeg: true,
            },
          },
        },
      },
      timeSlot: true,
    },
  });

  // Send notification to customer
  await prisma.notification.create({
    data: {
      userId: order.userId,
      type: "ORDER_UPDATED",
      title: "Item Removed from Your Order",
      message: `${orderItem.menuItem.name} (x${orderItem.quantity}) has been removed from your order #${order.id}. New total: ₹${totals.totalAmount}`,
      data: {
        orderId: order.id,
        removedItem: {
          name: orderItem.menuItem.name,
          quantity: orderItem.quantity,
        },
        newTotal: totals.totalAmount,
        oldTotal: order.totalAmount,
      },
    },
  });

  res.status(200).json(
    new ApiResponse(
      200,
      updatedOrder,
      `${orderItem.menuItem.name} removed from order successfully`
    )
  );
});

// Add a single item to order
export const addOrderItem = asyncHandler(async (req, res) => {
  const { orderId } = req.params;
  const { menuItemId, quantity } = req.body;
  const restaurantId = req.user.restaurantId || Restraunt_ID;

  if (!menuItemId || !quantity || quantity < 1) {
    throw new ApiError(400, "menuItemId and quantity (min 1) are required");
  }

  // Find the order
  const order = await prisma.order.findFirst({
    where: {
      id: parseInt(orderId),
      restaurantId: restaurantId,
    },
    include: {
      orderItems: true,
      user: {
        select: {
          id: true,
          name: true,
        },
      },
    },
  });

  if (!order) {
    throw new ApiError(404, "Order not found");
  }

  // Validate order can be edited
  validateOrderCanBeEdited(order);

  // Find the menu item
  const menuItem = await prisma.menuItem.findFirst({
    where: {
      id: parseInt(menuItemId),
      restaurantId: restaurantId,
    },
  });

  if (!menuItem) {
    throw new ApiError(404, "Menu item not found");
  }

  if (!menuItem.isAvailable) {
    throw new ApiError(400, `${menuItem.name} is currently not available`);
  }

  // Check if item already exists in order
  const existingOrderItem = order.orderItems.find(
    (item) => item.menuItemId === parseInt(menuItemId)
  );

  if (existingOrderItem) {
    // Update quantity of existing item
    const newQuantity = existingOrderItem.quantity + parseInt(quantity);
    const newPrice = Number(menuItem.price) * newQuantity;

    await prisma.orderItem.update({
      where: { id: existingOrderItem.id },
      data: {
        quantity: newQuantity,
        price: newPrice,
      },
    });
  } else {
    // Add new order item
    await prisma.orderItem.create({
      data: {
        orderId: order.id,
        menuItemId: parseInt(menuItemId),
        quantity: parseInt(quantity),
        price: Number(menuItem.price) * parseInt(quantity),
        waitingTime: menuItem.waitingTime || 0,
      },
    });
  }

  // Recalculate order totals
  const allItems = await prisma.orderItem.findMany({
    where: { orderId: order.id },
  });

  const totals = await calculateOrderTotals(allItems, restaurantId);

  // Update order with new totals
  const updatedOrder = await prisma.order.update({
    where: { id: parseInt(orderId) },
    data: {
      totalAmount: totals.totalAmount,
    },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          phone: true,
        },
      },
      orderItems: {
        include: {
          menuItem: {
            select: {
              id: true,
              name: true,
              price: true,
              imageUrl: true,
              isVeg: true,
            },
          },
        },
      },
      timeSlot: true,
    },
  });

  // Send notification to customer
  await prisma.notification.create({
    data: {
      userId: order.userId,
      type: "ORDER_UPDATED",
      title: "Item Added to Your Order",
      message: `${menuItem.name} (x${quantity}) has been added to your order #${order.id}. New total: ₹${totals.totalAmount}`,
      data: {
        orderId: order.id,
        addedItem: {
          name: menuItem.name,
          quantity: parseInt(quantity),
        },
        newTotal: totals.totalAmount,
        oldTotal: order.totalAmount,
      },
    },
  });

  res.status(200).json(
    new ApiResponse(
      200,
      updatedOrder,
      `${menuItem.name} added to order successfully`
    )
  );
});

// Update quantity of a specific order item
export const updateOrderItemQuantity = asyncHandler(async (req, res) => {
  const { orderId, orderItemId } = req.params;
  const { quantity } = req.body;
  const restaurantId = req.user.restaurantId || Restraunt_ID;

  if (!quantity || quantity < 1) {
    throw new ApiError(400, "Quantity must be at least 1");
  }

  // Find the order
  const order = await prisma.order.findFirst({
    where: {
      id: parseInt(orderId),
      restaurantId: restaurantId,
    },
    include: {
      orderItems: {
        include: {
          menuItem: true,
        },
      },
      user: {
        select: {
          id: true,
          name: true,
        },
      },
    },
  });

  if (!order) {
    throw new ApiError(404, "Order not found");
  }

  // Validate order can be edited
  validateOrderCanBeEdited(order);

  // Find the order item
  const orderItem = order.orderItems.find(
    (item) => item.id === parseInt(orderItemId)
  );

  if (!orderItem) {
    throw new ApiError(404, "Order item not found");
  }

  // Update the order item quantity
  const newPrice = Number(orderItem.menuItem.price) * parseInt(quantity);

  await prisma.orderItem.update({
    where: { id: parseInt(orderItemId) },
    data: {
      quantity: parseInt(quantity),
      price: newPrice,
    },
  });

  // Recalculate order totals
  const allItems = await prisma.orderItem.findMany({
    where: { orderId: order.id },
  });

  const totals = await calculateOrderTotals(allItems, restaurantId);

  // Update order with new totals
  const updatedOrder = await prisma.order.update({
    where: { id: parseInt(orderId) },
    data: {
      totalAmount: totals.totalAmount,
    },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          phone: true,
        },
      },
      orderItems: {
        include: {
          menuItem: {
            select: {
              id: true,
              name: true,
              price: true,
              imageUrl: true,
              isVeg: true,
            },
          },
        },
      },
      timeSlot: true,
    },
  });

  // Send notification to customer
  await prisma.notification.create({
    data: {
      userId: order.userId,
      type: "ORDER_UPDATED",
      title: "Order Item Quantity Updated",
      message: `${orderItem.menuItem.name} quantity changed from ${orderItem.quantity} to ${quantity} in order #${order.id}. New total: ₹${totals.totalAmount}`,
      data: {
        orderId: order.id,
        updatedItem: {
          name: orderItem.menuItem.name,
          oldQuantity: orderItem.quantity,
          newQuantity: parseInt(quantity),
        },
        newTotal: totals.totalAmount,
        oldTotal: order.totalAmount,
      },
    },
  });

  res.status(200).json(
    new ApiResponse(
      200,
      updatedOrder,
      `${orderItem.menuItem.name} quantity updated successfully`
    )
  );
});

