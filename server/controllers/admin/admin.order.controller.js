import { prisma } from "../../lib/prisma.js";
import { asyncHandler } from "../../utils/errorHandler.js";
import { ApiResponse } from "../../utils/ApiResponse.js";
import { ApiError } from "../../utils/ApiError.js";
import { NotificationService } from "../../utils/notification/notification.service.js";

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

  if (
    order.restaurantStatus === "Completed" &&
    restaurantStatus !== "Completed"
  ) {
    throw new ApiError(400, "Cannot change status of a completed order");
  }

  if (order.status === "Cancelled") {
    throw new ApiError(400, "Cannot update a cancelled order");
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
