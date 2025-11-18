import { prisma } from "../../lib/prisma.js";
import { asyncHandler } from "../../utils/errorHandler.js";
import { ApiResponse } from "../../utils/ApiResponse.js";
import { ApiError } from "../../utils/ApiError.js";

const getAllOrders = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const {
    status,
    paymentStatus,
    page = 1,
    limit = 20,
    startDate,
    endDate,
    search,
  } = req.query;

  const adminRestaurants = await prisma.restaurantAdmin.findMany({
    where: { userId },
    select: { restaurantId: true },
  });

  if (adminRestaurants.length === 0) {
    throw new ApiError(403, "You are not authorized to view orders");
  }

  const restaurantIds = adminRestaurants.map((ra) => ra.restaurantId);

  const where = {
    restaurantId: { in: restaurantIds },
  };

  if (status) {
    where.status = status;
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
    where.OR = [
      { id: isNaN(search) ? undefined : parseInt(search) },
      { user: { name: { contains: search, mode: "insensitive" } } },
      { user: { email: { contains: search, mode: "insensitive" } } },
    ].filter((condition) => condition.id !== undefined || condition.user);
  }

  const skip = (page - 1) * limit;

  const [orders, total] = await Promise.all([
    prisma.order.findMany({
      where,
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
              },
            },
          },
        },
        restaurant: {
          select: {
            id: true,
            name: true,
          },
        },
        timeSlot: true,
        payment: {
          select: {
            id: true,
            status: true,
            razorpayPaymentId: true,
            amount: true,
            createdAt: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
      skip: parseInt(skip),
      take: parseInt(limit),
    }),
    prisma.order.count({ where }),
  ]);

  res.json(
    new ApiResponse(200, "Orders fetched successfully", {
      data: {
        orders,
        pagination: {
          total,
          page: parseInt(page),
          limit: parseInt(limit),
          totalPages: Math.ceil(total / limit),
        },
      },
    })
  );
});

const getOrderDetails = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const { orderId } = req.params;

  // Verify admin has access to this order's restaurant
  const order = await prisma.order.findUnique({
    where: { id: parseInt(orderId) },
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
      restaurant: true,
      timeSlot: true,
      payment: true,
    },
  });

  if (!order) {
    throw new ApiError(404, "Order not found");
  }

  // Check if user is admin of this restaurant
  const isAdmin = await prisma.restaurantAdmin.findFirst({
    where: {
      userId,
      restaurantId: order.restaurantId,
    },
  });

  if (!isAdmin) {
    throw new ApiError(403, "You are not authorized to view this order");
  }

  res.json(new ApiResponse(200, "Order details fetched successfully", order));
});

const updateOrderStatus = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const { orderId } = req.params;
  const { status } = req.body;

  // Validate status
  const validStatuses = ["Waiting", "Finished", "Delivered", "Cancelled"];
  if (!validStatuses.includes(status)) {
    throw new ApiError(400, "Invalid order status");
  }

  // Get order and verify access
  const order = await prisma.order.findUnique({
    where: { id: parseInt(orderId) },
    include: { restaurant: true },
  });

  if (!order) {
    throw new ApiError(404, "Order not found");
  }

  // Check if user is admin of this restaurant
  const isAdmin = await prisma.restaurantAdmin.findFirst({
    where: {
      userId,
      restaurantId: order.restaurantId,
    },
  });

  if (!isAdmin) {
    throw new ApiError(403, "You are not authorized to update this order");
  }

  // Business logic validations
  if (order.paymentStatus !== "paid" && status !== "Cancelled") {
    throw new ApiError(
      400,
      "Cannot update status of unpaid order except to 'Cancelled'"
    );
  }

  if (order.status === "Delivered" && status !== "Delivered") {
    throw new ApiError(400, "Cannot change status of a delivered order");
  }

  if (order.status === "Cancelled") {
    throw new ApiError(400, "Cannot update a cancelled order");
  }

  // Update order status
  const updatedOrder = await prisma.order.update({
    where: { id: parseInt(orderId) },
    data: { status },
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
      restaurant: true,
      timeSlot: true,
      payment: true,
    },
  });

  res.json(
    new ApiResponse(200, "Order status updated successfully", updatedOrder)
  );
});

const cancelOrder = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const { orderId } = req.params;
  const { reason } = req.body;

  // Get order and verify access
  const order = await prisma.order.findUnique({
    where: { id: parseInt(orderId) },
    include: { payment: true },
  });

  if (!order) {
    throw new ApiError(404, "Order not found");
  }

  // Check if user is admin of this restaurant
  const isAdmin = await prisma.restaurantAdmin.findFirst({
    where: {
      userId,
      restaurantId: order.restaurantId,
    },
  });

  if (!isAdmin) {
    throw new ApiError(403, "You are not authorized to cancel this order");
  }

  // Cannot cancel already delivered orders
  if (order.status === "Delivered") {
    throw new ApiError(400, "Delivered orders cannot be cancelled");
  }

  // Cannot cancel already cancelled orders
  if (order.status === "Cancelled") {
    throw new ApiError(400, "Order is already cancelled");
  }

  // Update order
  const updatedOrder = await prisma.order.update({
    where: { id: parseInt(orderId) },
    data: {
      status: "Cancelled",
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
      restaurant: true,
      payment: true,
    },
  });

  // TODO: Initiate refund if payment was successful

  res.json(new ApiResponse(200, "Order cancelled successfully", updatedOrder));
});

const getDashboardStats = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const { startDate, endDate } = req.query;

  const adminRestaurants = await prisma.restaurantAdmin.findMany({
    where: { userId },
    select: { restaurantId: true },
  });

  if (adminRestaurants.length === 0) {
    throw new ApiError(403, "You are not authorized to view dashboard stats");
  }

  const restaurantIds = adminRestaurants.map((ra) => ra.restaurantId);

  // Build date filter
  const dateFilter = {};
  if (startDate || endDate) {
    if (startDate) dateFilter.gte = new Date(startDate);
    if (endDate) dateFilter.lte = new Date(endDate);
  }

  const [
    totalOrders,
    pendingOrders,
    completedOrders,
    cancelledOrders,
    totalRevenue,
    paidRevenue,
  ] = await Promise.all([
    // Total orders
    prisma.order.count({
      where: {
        restaurantId: { in: restaurantIds },
        ...(Object.keys(dateFilter).length > 0 && { createdAt: dateFilter }),
      },
    }),

    prisma.order.count({
      where: {
        restaurantId: { in: restaurantIds },
        status: { in: ["Waiting", "Finished"] },
        ...(Object.keys(dateFilter).length > 0 && { createdAt: dateFilter }),
      },
    }),

    prisma.order.count({
      where: {
        restaurantId: { in: restaurantIds },
        status: "Delivered",
        ...(Object.keys(dateFilter).length > 0 && { createdAt: dateFilter }),
      },
    }),

    prisma.order.count({
      where: {
        restaurantId: { in: restaurantIds },
        status: "Cancelled",
        ...(Object.keys(dateFilter).length > 0 && { createdAt: dateFilter }),
      },
    }),

    prisma.order.aggregate({
      where: {
        restaurantId: { in: restaurantIds },
        ...(Object.keys(dateFilter).length > 0 && { createdAt: dateFilter }),
      },
      _sum: { totalAmount: true },
    }),

    prisma.order.aggregate({
      where: {
        restaurantId: { in: restaurantIds },
        paymentStatus: "paid",
        ...(Object.keys(dateFilter).length > 0 && { createdAt: dateFilter }),
      },
      _sum: { totalAmount: true },
    }),
  ]);

  res.json(
    new ApiResponse(200, "Dashboard stats fetched successfully", {
      data: {
        totalOrders,
        pendingOrders,
        completedOrders,
        cancelledOrders,
        totalRevenue: totalRevenue._sum.totalAmount || 0,
        paidRevenue: paidRevenue._sum.totalAmount || 0,
        pendingRevenue:
          (totalRevenue._sum.totalAmount || 0) -
          (paidRevenue._sum.totalAmount || 0),
      },
    })
  );
});
const getRevenueReport = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const { startDate, endDate, groupBy = "day" } = req.query;

  // Get admin's restaurant(s)
  const adminRestaurants = await prisma.restaurantAdmin.findMany({
    where: { userId },
    select: { restaurantId: true },
  });

  if (adminRestaurants.length === 0) {
    throw new ApiError(403, "You are not authorized to view revenue report");
  }

  const restaurantIds = adminRestaurants.map((ra) => ra.restaurantId);

  const where = {
    restaurantId: { in: restaurantIds },
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

  // Group by date
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

  res.json(
    new ApiResponse(200, "Revenue report fetched successfully", {
      data: {
        revenueByDate: revenueData,
        totalRevenue: revenueData.reduce((sum, item) => sum + item.revenue, 0),
        totalOrders: revenueData.reduce(
          (sum, item) => sum + item.orderCount,
          0
        ),
      },
    })
  );
});

const getPopularItems = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const { startDate, endDate, limit = 10 } = req.query;

  // Get admin's restaurant(s)
  const adminRestaurants = await prisma.restaurantAdmin.findMany({
    where: { userId },
    select: { restaurantId: true },
  });

  if (adminRestaurants.length === 0) {
    throw new ApiError(403, "You are not authorized to view popular items");
  }

  const restaurantIds = adminRestaurants.map((ra) => ra.restaurantId);

  // Build date filter for orders
  const orderWhere = {
    restaurantId: { in: restaurantIds },
    paymentStatus: "paid",
  };

  if (startDate || endDate) {
    orderWhere.createdAt = {};
    if (startDate) orderWhere.createdAt.gte = new Date(startDate);
    if (endDate) orderWhere.createdAt.lte = new Date(endDate);
  }

  // Get order items with aggregation
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
          category: true,
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

  res.json(
    new ApiResponse(200, "Popular items fetched successfully", {
      items: itemsWithDetails,
    })
  );
});

export {
  getAllOrders,
  getOrderDetails,
  updateOrderStatus,
  cancelOrder,
  getDashboardStats,
  getRevenueReport,
  getPopularItems,
};
