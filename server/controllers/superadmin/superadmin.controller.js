import { prisma } from "../../lib/prisma.js";
import { asyncHandler } from "../../utils/errorHandler.js";
import { ApiResponse } from "../../utils/ApiResponse.js";
import { ApiError } from "../../utils/ApiError.js";

export const getAllRestaurants = asyncHandler(async (req, res) => {
  const { page = 1, limit = 20, isActive, search } = req.query;

  const skip = (parseInt(page) - 1) * parseInt(limit);
  const where = {};

  if (isActive !== undefined) {
    where.isActive = isActive === "true";
  }

  if (search) {
    where.OR = [
      { name: { contains: search, mode: "insensitive" } },
      { address: { contains: search, mode: "insensitive" } },
    ];
  }

  const [restaurants, total] = await Promise.all([
    prisma.restaurant.findMany({
      where,
      skip,
      take: parseInt(limit),
      orderBy: { createdAt: "desc" },
      include: {
        _count: {
          select: {
            orders: { where: { paymentStatus: "paid" } },
            menuItems: true,
            admins: { where: { isActive: true } },
            chefs: { where: { isActive: true } },
          },
        },
        commissions: {
          where: { status: "pending" },
          select: {
            commissionAmount: true,
          },
        },
      },
    }),
    prisma.restaurant.count({ where }),
  ]);

  const restaurantsWithStats = await Promise.all(
    restaurants.map(async (restaurant) => {
      const [totalRevenue, pendingCommission] = await Promise.all([
        prisma.order.aggregate({
          where: {
            restaurantId: restaurant.id,
            paymentStatus: "paid",
          },
          _sum: { totalAmount: true },
        }),
        prisma.commission.aggregate({
          where: {
            restaurantId: restaurant.id,
            status: "pending",
          },
          _sum: { commissionAmount: true },
        }),
      ]);

      return {
        ...restaurant,
        stats: {
          totalOrders: restaurant._count.orders,
          totalRevenue: totalRevenue._sum.totalAmount || 0,
          pendingCommission: pendingCommission._sum.commissionAmount || 0,
          totalMenuItems: restaurant._count.menuItems,
          totalAdmins: restaurant._count.admins,
          totalChefs: restaurant._count.chefs,
        },
      };
    })
  );

  res.status(200).json(
    new ApiResponse(
      200,
      {
        restaurants: restaurantsWithStats,
        pagination: {
          total,
          page: parseInt(page),
          limit: parseInt(limit),
          totalPages: Math.ceil(total / parseInt(limit)),
        },
      },
      "Restaurants fetched successfully"
    )
  );
});

/**
 * @route GET /api/superadmin/restaurants/:id
 * @desc Get restaurant details with full stats
 * @access SuperAdmin
 */
export const getRestaurantDetails = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const restaurant = await prisma.restaurant.findUnique({
    where: { id: parseInt(id) },
    include: {
      admins: {
        where: { isActive: true },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              phone: true,
            },
          },
        },
      },
      chefs: {
        where: { isActive: true },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              phone: true,
            },
          },
        },
      },
      _count: {
        select: {
          orders: true,
          menuItems: true,
        },
      },
    },
  });

  if (!restaurant) {
    throw new ApiError(404, "Restaurant not found");
  }

  const [totalRevenue, totalCommission, pendingCommission, settledCommission] =
    await Promise.all([
      prisma.order.aggregate({
        where: {
          restaurantId: restaurant.id,
          paymentStatus: "paid",
        },
        _sum: { totalAmount: true },
      }),
      prisma.commission.aggregate({
        where: { restaurantId: restaurant.id },
        _sum: { commissionAmount: true },
      }),
      prisma.commission.aggregate({
        where: {
          restaurantId: restaurant.id,
          status: "pending",
        },
        _sum: { commissionAmount: true },
      }),
      prisma.commission.aggregate({
        where: {
          restaurantId: restaurant.id,
          status: "settled",
        },
        _sum: { commissionAmount: true },
      }),
    ]);

  res.status(200).json(
    new ApiResponse(
      200,
      {
        ...restaurant,
        stats: {
          totalRevenue: totalRevenue._sum.totalAmount || 0,
          totalCommission: totalCommission._sum.commissionAmount || 0,
          pendingCommission: pendingCommission._sum.commissionAmount || 0,
          settledCommission: settledCommission._sum.commissionAmount || 0,
        },
      },
      "Restaurant details fetched successfully"
    )
  );
});

/**
 * @route PATCH /api/superadmin/restaurants/:id
 * @desc Update restaurant settings (commission rate, multipliers)
 * @access SuperAdmin
 */
export const updateRestaurant = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const {
    name,
    description,
    address,
    contactNumber,
    imageUrl,
    commissionRate,
    baseWaitingTimeMultiplier,
    fixedAdditionalTime,
    isActive,
  } = req.body;

  const restaurant = await prisma.restaurant.findUnique({
    where: { id: parseInt(id) },
  });

  if (!restaurant) {
    throw new ApiError(404, "Restaurant not found");
  }

  if (commissionRate !== undefined) {
    const rate = parseFloat(commissionRate);
    if (rate < 0 || rate > 100) {
      throw new ApiError(400, "Commission rate must be between 0 and 100");
    }
  }

  if (baseWaitingTimeMultiplier !== undefined) {
    const multiplier = parseFloat(baseWaitingTimeMultiplier);
    if (multiplier < 0.1 || multiplier > 10) {
      throw new ApiError(400, "Multiplier must be between 0.1 and 10");
    }
  }

  const updatedRestaurant = await prisma.restaurant.update({
    where: { id: parseInt(id) },
    data: {
      ...(name && { name }),
      ...(description !== undefined && { description }),
      ...(address !== undefined && { address }),
      ...(contactNumber !== undefined && { contactNumber }),
      ...(imageUrl !== undefined && { imageUrl }),
      ...(commissionRate !== undefined && {
        commissionRate: parseFloat(commissionRate),
      }),
      ...(baseWaitingTimeMultiplier !== undefined && {
        baseWaitingTimeMultiplier: parseFloat(baseWaitingTimeMultiplier),
      }),
      ...(fixedAdditionalTime !== undefined && {
        fixedAdditionalTime: parseInt(fixedAdditionalTime),
      }),
      ...(isActive !== undefined && { isActive }),
    },
  });

  res
    .status(200)
    .json(
      new ApiResponse(200, updatedRestaurant, "Restaurant updated successfully")
    );
});

export const getAllCommissions = asyncHandler(async (req, res) => {
  const {
    restaurantId,
    status,
    startDate,
    endDate,
    page = 1,
    limit = 20,
  } = req.query;

  const skip = (parseInt(page) - 1) * parseInt(limit);
  const where = {};

  if (restaurantId) {
    where.restaurantId = parseInt(restaurantId);
  }

  if (status) {
    where.status = status;
  }

  if (startDate || endDate) {
    where.createdAt = {};
    if (startDate) where.createdAt.gte = new Date(startDate);
    if (endDate) where.createdAt.lte = new Date(endDate);
  }

  const [commissions, total] = await Promise.all([
    prisma.commission.findMany({
      where,
      skip,
      take: parseInt(limit),
      orderBy: { createdAt: "desc" },
      include: {
        restaurant: {
          select: {
            id: true,
            name: true,
          },
        },
        order: {
          select: {
            id: true,
            createdAt: true,
            user: {
              select: {
                name: true,
                email: true,
              },
            },
          },
        },
      },
    }),
    prisma.commission.count({ where }),
  ]);

  res.status(200).json(
    new ApiResponse(
      200,
      {
        commissions,
        pagination: {
          total,
          page: parseInt(page),
          limit: parseInt(limit),
          totalPages: Math.ceil(total / parseInt(limit)),
        },
      },
      "Commissions fetched successfully"
    )
  );
});

/**
 * @route GET /api/superadmin/commissions/summary
 * @desc Get commission summary (total, pending, settled)
 * @access SuperAdmin
 */
export const getCommissionSummary = asyncHandler(async (req, res) => {
  const { restaurantId, startDate, endDate } = req.query;

  const where = {};

  if (restaurantId) {
    where.restaurantId = parseInt(restaurantId);
  }

  if (startDate || endDate) {
    where.createdAt = {};
    if (startDate) where.createdAt.gte = new Date(startDate);
    if (endDate) where.createdAt.lte = new Date(endDate);
  }

  const [total, pending, settled, failed] = await Promise.all([
    prisma.commission.aggregate({
      where,
      _sum: { commissionAmount: true },
      _count: true,
    }),
    prisma.commission.aggregate({
      where: { ...where, status: "pending" },
      _sum: { commissionAmount: true },
      _count: true,
    }),
    prisma.commission.aggregate({
      where: { ...where, status: "settled" },
      _sum: { commissionAmount: true },
      _count: true,
    }),
    prisma.commission.aggregate({
      where: { ...where, status: "failed" },
      _sum: { commissionAmount: true },
      _count: true,
    }),
  ]);

  const restaurantBreakdown = await prisma.commission.groupBy({
    by: ["restaurantId"],
    where: { ...where, status: "pending" },
    _sum: {
      commissionAmount: true,
    },
    _count: true,
  });

  const restaurantDetails = await Promise.all(
    restaurantBreakdown.map(async (item) => {
      const restaurant = await prisma.restaurant.findUnique({
        where: { id: item.restaurantId },
        select: { id: true, name: true },
      });
      return {
        restaurant,
        pendingCommission: item._sum.commissionAmount || 0,
        pendingCount: item._count,
      };
    })
  );

  res.status(200).json(
    new ApiResponse(
      200,
      {
        summary: {
          total: {
            amount: total._sum.commissionAmount || 0,
            count: total._count,
          },
          pending: {
            amount: pending._sum.commissionAmount || 0,
            count: pending._count,
          },
          settled: {
            amount: settled._sum.commissionAmount || 0,
            count: settled._count,
          },
          failed: {
            amount: failed._sum.commissionAmount || 0,
            count: failed._count,
          },
        },
        restaurantBreakdown: restaurantDetails,
      },
      "Commission summary fetched successfully"
    )
  );
});

export const settleCommissions = asyncHandler(async (req, res) => {
  const { commissionIds, restaurantId, settleAll } = req.body;

  let where = { status: "pending" };

  if (settleAll && restaurantId) {
    where.restaurantId = parseInt(restaurantId);
  } else if (commissionIds && Array.isArray(commissionIds)) {
    where.id = { in: commissionIds.map((id) => parseInt(id)) };
  } else {
    throw new ApiError(
      400,
      "Please provide either commissionIds or restaurantId with settleAll flag"
    );
  }

  const result = await prisma.commission.updateMany({
    where,
    data: {
      status: "settled",
      settledAt: new Date(),
    },
  });

  res
    .status(200)
    .json(
      new ApiResponse(
        200,
        { settledCount: result.count },
        `${result.count} commission(s) settled successfully`
      )
    );
});

export const updateCommissionStatus = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  const validStatuses = ["pending", "settled", "failed"];
  if (!validStatuses.includes(status)) {
    throw new ApiError(400, "Invalid commission status");
  }

  const commission = await prisma.commission.findUnique({
    where: { id: parseInt(id) },
  });

  if (!commission) {
    throw new ApiError(404, "Commission not found");
  }

  const updateData = { status };
  if (status === "settled") {
    updateData.settledAt = new Date();
  }

  const updatedCommission = await prisma.commission.update({
    where: { id: parseInt(id) },
    data: updateData,
    include: {
      restaurant: {
        select: {
          id: true,
          name: true,
        },
      },
    },
  });

  res
    .status(200)
    .json(
      new ApiResponse(
        200,
        updatedCommission,
        "Commission status updated successfully"
      )
    );
});

export const getPlatformAnalytics = asyncHandler(async (req, res) => {
  const { startDate, endDate } = req.query;

  const dateFilter = {};
  if (startDate || endDate) {
    if (startDate) dateFilter.gte = new Date(startDate);
    if (endDate) dateFilter.lte = new Date(endDate);
  }

  const whereClause =
    Object.keys(dateFilter).length > 0 ? { createdAt: dateFilter } : {};

  const [
    totalRestaurants,
    activeRestaurants,
    totalOrders,
    totalRevenue,
    totalCommission,
    pendingCommission,
    totalUsers,
    totalMenuItems,
  ] = await Promise.all([
    prisma.restaurant.count(),
    prisma.restaurant.count({ where: { isActive: true } }),
    prisma.order.count({
      where: { ...whereClause, paymentStatus: "paid" },
    }),
    prisma.order.aggregate({
      where: { ...whereClause, paymentStatus: "paid" },
      _sum: { totalAmount: true },
    }),
    prisma.commission.aggregate({
      where: whereClause,
      _sum: { commissionAmount: true },
    }),
    prisma.commission.aggregate({
      where: { ...whereClause, status: "pending" },
      _sum: { commissionAmount: true },
    }),
    prisma.user.count({ where: { role: "customer" } }),
    prisma.menuItem.count({ where: { isActive: true } }),
  ]);

  res.status(200).json(
    new ApiResponse(
      200,
      {
        restaurants: {
          total: totalRestaurants,
          active: activeRestaurants,
        },
        orders: {
          total: totalOrders,
        },
        revenue: {
          total: totalRevenue._sum.totalAmount || 0,
          platformCommission: totalCommission._sum.commissionAmount || 0,
          pendingCommission: pendingCommission._sum.commissionAmount || 0,
        },
        users: {
          totalCustomers: totalUsers,
        },
        menuItems: {
          total: totalMenuItems,
        },
      },
      "Platform analytics fetched successfully"
    )
  );
});
