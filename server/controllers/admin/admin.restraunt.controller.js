// controllers/restaurant.controller.js (PUBLIC ROUTES)
import { prisma } from "../../lib/prisma.js";
import { asyncHandler } from "../../utils/errorHandler.js";
import { ApiError } from "../../utils/ApiError.js";
import { ApiResponse } from "../../utils/ApiResponse.js";

export const getRestaurants = asyncHandler(async (req, res) => {
  const {
    search,
    isActive,
    page = 1,
    limit = 20,
    sortBy = "createdAt",
    sortOrder = "desc",
  } = req.query;

  const skip = (parseInt(page) - 1) * parseInt(limit);

  const where = {};

  // Filter: Only active restaurants for public view
  if (isActive !== undefined) {
    where.isActive = isActive === "true";
  } else {
    where.isActive = true; // Default: only active
  }

  // Search by name or description
  if (search) {
    where.OR = [
      { name: { contains: search, mode: "insensitive" } },
      { description: { contains: search, mode: "insensitive" } },
    ];
  }

  const [restaurants, total] = await Promise.all([
    prisma.restaurant.findMany({
      where,
      skip,
      take: parseInt(limit),
      orderBy: { [sortBy]: sortOrder },
      select: {
        id: true,
        name: true,
        description: true,
        image: true,
        address: true,
        contactNumber: true,
        commissionRate: true,
        isActive: true,
        baseWaitingTimeMultiplier: true,
        fixedAdditionalTime: true,
        createdAt: true,
        _count: {
          select: {
            menuItems: {
              where: { isAvailable: true },
            },
          },
        },
      },
    }),
    prisma.restaurant.count({ where }),
  ]);

  res.status(200).json(
    new ApiResponse(
      200,
      {
        restaurants,
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

export const getRestaurantById = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const restaurant = await prisma.restaurant.findUnique({
    where: { id: parseInt(id) },
    include: {
      categories: {
        where: { isActive: true },
        select: {
          id: true,
          name: true,
          image: true,
          isActive: true,
          _count: {
            select: {
              menuItems: {
                where: { isAvailable: true },
              },
            },
          },
        },
      },
      _count: {
        select: {
          menuItems: {
            where: { isAvailable: true },
          },
        },
      },
    },
  });

  if (!restaurant) {
    throw new ApiError(404, "Restaurant not found");
  }

  if (!restaurant.isActive) {
    throw new ApiError(403, "Restaurant is currently unavailable");
  }

  res
    .status(200)
    .json(
      new ApiResponse(200, { restaurant }, "Restaurant fetched successfully")
    );
});

export const getRestaurantMenu = asyncHandler(async (req, res) => {
  const { restaurantId } = req.params;
  const {
    categoryId,
    search,
    isVeg,
    isAvailable = true,
    sortBy = "name",
    sortOrder = "asc",
  } = req.query;

  const where = {
    restaurantId: parseInt(restaurantId),
    isAvailable: isAvailable === "true",
  };

  if (categoryId) {
    where.categoryId = parseInt(categoryId);
  }

  if (search) {
    where.OR = [
      { name: { contains: search, mode: "insensitive" } },
      { description: { contains: search, mode: "insensitive" } },
    ];
  }

  if (isVeg !== undefined) {
    where.isVeg = isVeg === "true";
  }

  const menuItems = await prisma.menuItem.findMany({
    where,
    orderBy: { [sortBy]: sortOrder },
    include: {
      category: {
        select: {
          id: true,
          name: true,
          image: true,
        },
      },
    },
  });

  // Calculate actual waiting time for each item
  const restaurant = await prisma.restaurant.findUnique({
    where: { id: parseInt(restaurantId) },
    select: {
      baseWaitingTimeMultiplier: true,
      fixedAdditionalTime: true,
    },
  });

  const menuWithWaitingTime = menuItems.map((item) => ({
    ...item,
    actualWaitingTime: Math.round(
      item.waitingTime * restaurant.baseWaitingTimeMultiplier +
        restaurant.fixedAdditionalTime
    ),
  }));

  res.status(200).json(
    new ApiResponse(
      200,
      {
        menuItems: menuWithWaitingTime,
        restaurant: {
          baseWaitingTimeMultiplier: restaurant.baseWaitingTimeMultiplier,
          fixedAdditionalTime: restaurant.fixedAdditionalTime,
        },
      },
      "Menu fetched successfully"
    )
  );
});

export const getMenuItemById = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const menuItem = await prisma.menuItem.findUnique({
    where: { id: parseInt(id) },
    include: {
      category: {
        select: {
          id: true,
          name: true,
          image: true,
        },
      },
      restaurant: {
        select: {
          id: true,
          name: true,
          baseWaitingTimeMultiplier: true,
          fixedAdditionalTime: true,
          isActive: true,
        },
      },
    },
  });

  if (!menuItem) {
    throw new ApiError(404, "Menu item not found");
  }

  if (!menuItem.isAvailable) {
    throw new ApiError(403, "Menu item is currently unavailable");
  }

  if (!menuItem.restaurant.isActive) {
    throw new ApiError(403, "Restaurant is currently unavailable");
  }

  // Calculate actual waiting time
  const actualWaitingTime = Math.round(
    menuItem.waitingTime * menuItem.restaurant.baseWaitingTimeMultiplier +
      menuItem.restaurant.fixedAdditionalTime
  );

  res.status(200).json(
    new ApiResponse(
      200,
      {
        ...menuItem,
        actualWaitingTime,
      },
      "Menu item fetched successfully"
    )
  );
});

export const getCategories = asyncHandler(async (req, res) => {
  const restaurantId = 3;

  const categories = await prisma.category.findMany({
    where: {
      restaurantId: parseInt(restaurantId),
      isActive: true,
    },
    include: {
      _count: {
        select: {
          menuItems: {
            where: { isAvailable: true },
          },
        },
      },
    },
    orderBy: { name: "asc" },
  });
  console.log(categories);
  res
    .status(200)
    .json(
      new ApiResponse(200, { categories }, "Categories fetched successfully")
    );
});

export const searchMenuItems = asyncHandler(async (req, res) => {
  const { search, isVeg, minPrice, maxPrice, page = 1, limit = 20 } = req.query;

  if (!search || search.trim().length < 2) {
    throw new ApiError(400, "Search query must be at least 2 characters");
  }

  const skip = (parseInt(page) - 1) * parseInt(limit);

  const where = {
    isAvailable: true,
    restaurant: { isActive: true },
    OR: [
      { name: { contains: search, mode: "insensitive" } },
      { description: { contains: search, mode: "insensitive" } },
    ],
  };

  if (isVeg !== undefined) {
    where.isVeg = isVeg === "true";
  }

  if (minPrice || maxPrice) {
    where.price = {};
    if (minPrice) where.price.gte = parseFloat(minPrice);
    if (maxPrice) where.price.lte = parseFloat(maxPrice);
  }

  const [menuItems, total] = await Promise.all([
    prisma.menuItem.findMany({
      where,
      skip,
      take: parseInt(limit),
      include: {
        restaurant: {
          select: {
            id: true,
            name: true,
            image: true,
            baseWaitingTimeMultiplier: true,
            fixedAdditionalTime: true,
          },
        },
        category: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: { name: "asc" },
    }),
    prisma.menuItem.count({ where }),
  ]);

  res.status(200).json(
    new ApiResponse(
      200,
      {
        menuItems,
        pagination: {
          total,
          page: parseInt(page),
          limit: parseInt(limit),
          totalPages: Math.ceil(total / parseInt(limit)),
        },
      },
      "Search results fetched successfully"
    )
  );
});
