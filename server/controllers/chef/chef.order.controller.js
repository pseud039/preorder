import { prisma } from "../../lib/prisma.js";
import { asyncHandler } from "../../utils/errorHandler.js";
import { ApiResponse } from "../../utils/ApiResponse.js";
import { ApiError } from "../../utils/ApiError.js";

export const getChefOrders = asyncHandler(async (req, res) => {
  const restaurantId = req.user.restaurantId;
  const {
    restaurantStatus,
    page = 1,
    limit = 20,
    sortBy = "createdAt",
    sortOrder = "desc",
  } = req.query;

  const skip = (parseInt(page) - 1) * parseInt(limit);

  const where = {
    restaurantId: restaurantId,
    paymentStatus: "paid",
  };

  if (restaurantStatus) {
    where.restaurantStatus = restaurantStatus;
  } else {
    where.restaurantStatus = {
      in: ["Accepted", "Preparing", "Ready"],
    };
  }

  const [orders, total] = await Promise.all([
    prisma.order.findMany({
      where,
      skip,
      take: parseInt(limit),
      orderBy: { [sortBy]: sortOrder },
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
                imageUrl: true,
                isVeg: true,
              },
            },
          },
        },
        timeSlot: true,
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
          page: parseInt(page),
          limit: parseInt(limit),
          totalPages: Math.ceil(total / parseInt(limit)),
        },
      },
      "Orders fetched successfully"
    )
  );
});

export const getChefOrderDetails = asyncHandler(async (req, res) => {
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
      payment: {
        select: {
          id: true,
          status: true,
          amount: true,
          gatewayPaymentId: true,
        },
      },
    },
  });

  if (!order) {
    throw new ApiError(404, "Order not found");
  }

  res
    .status(200)
    .json(new ApiResponse(200, order, "Order details fetched successfully"));
});

export const updateChefOrderStatus = asyncHandler(async (req, res) => {
  const { orderId } = req.params;
  const { restaurantStatus } = req.body;
  const restaurantId = req.user.restaurantId;

  const allowedStatuses = ["Preparing", "Ready"];
  if (!allowedStatuses.includes(restaurantStatus)) {
    throw new ApiError(
      400,
      "Chefs can only update order status to 'Preparing' or 'Ready'"
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

  if (order.paymentStatus !== "paid") {
    throw new ApiError(400, "Cannot update unpaid orders");
  }

  if (order.restaurantStatus === "Rejected") {
    throw new ApiError(400, "Cannot update rejected orders");
  }

  if (order.restaurantStatus === "Completed") {
    throw new ApiError(400, "Cannot update completed orders");
  }

  if (
    restaurantStatus === "Ready" &&
    !["Accepted", "Preparing"].includes(order.restaurantStatus)
  ) {
    throw new ApiError(
      400,
      "Order must be 'Accepted' or 'Preparing' before marking as 'Ready'"
    );
  }

  if (
    restaurantStatus === "Preparing" &&
    order.restaurantStatus !== "Accepted"
  ) {
    throw new ApiError(
      400,
      "Order must be 'Accepted' before marking as 'Preparing'"
    );
  }

  let updateData = {
    restaurantStatus,
  };

  if (restaurantStatus === "Preparing" && !order.estimatedReadyTime) {
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

  const updatedOrder = await prisma.order.update({
    where: { id: parseInt(orderId) },
    data: updateData,
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
          menuItem: true,
        },
      },
    },
  });

  await prisma.notification.create({
    data: {
      userId: order.userId,
      type:
        restaurantStatus === "Preparing" ? "ORDER_PREPARING" : "ORDER_READY",
      title:
        restaurantStatus === "Preparing"
          ? "Order is being prepared"
          : "Order is ready for pickup",
      message:
        restaurantStatus === "Preparing"
          ? `Your order #${order.id} is now being prepared by our chef`
          : `Your order #${order.id} is ready! Please come pick it up.`,
      data: {
        orderId: order.id,
        restaurantStatus,
      },
    },
  });

  res
    .status(200)
    .json(
      new ApiResponse(200, updatedOrder, "Order status updated successfully")
    );
});

export const getChefDashboard = asyncHandler(async (req, res) => {
  const restaurantId = req.user.restaurantId;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const [
    pendingOrders,
    preparingOrders,
    readyOrders,
    todayCompletedOrders,
    activeOrders,
  ] = await Promise.all([
    // Pending (Accepted but not started)
    prisma.order.count({
      where: {
        restaurantId,
        restaurantStatus: "Accepted",
        paymentStatus: "paid",
      },
    }),

    prisma.order.count({
      where: {
        restaurantId,
        restaurantStatus: "Preparing",
        paymentStatus: "paid",
      },
    }),

    prisma.order.count({
      where: {
        restaurantId,
        restaurantStatus: "Ready",
        paymentStatus: "paid",
      },
    }),

    prisma.order.count({
      where: {
        restaurantId,
        restaurantStatus: "Completed",
        createdAt: { gte: today },
      },
    }),

    prisma.order.findMany({
      where: {
        restaurantId,
        restaurantStatus: { in: ["Accepted", "Preparing", "Ready"] },
        paymentStatus: "paid",
      },
      take: 10,
      orderBy: { createdAt: "asc" },
      include: {
        user: {
          select: {
            name: true,
            phone: true,
          },
        },
        orderItems: {
          include: {
            menuItem: {
              select: {
                name: true,
                isVeg: true,
              },
            },
          },
        },
        timeSlot: true,
      },
    }),
  ]);

  res.status(200).json(
    new ApiResponse(
      200,
      {
        stats: {
          pendingOrders,
          preparingOrders,
          readyOrders,
          todayCompletedOrders,
          totalActiveOrders: pendingOrders + preparingOrders + readyOrders,
        },
        activeOrders,
      },
      "Dashboard data fetched successfully"
    )
  );
});
