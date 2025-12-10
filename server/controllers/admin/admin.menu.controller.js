import { prisma } from "../../lib/prisma.js";
import { asyncHandler } from "../../utils/errorHandler.js";
import { ApiResponse } from "../../utils/ApiResponse.js";
import { ApiError } from "../../utils/ApiError.js";
import { uploadOnCloudinary } from "../../utils/cloudinary.js";

export const addRestaurant = asyncHandler(async (req, res) => {
  const { name, description, address, contactNumber, imageUrl } = req.body;
  const restaurantId = req.user.restaurantId;

  if (!name) {
    throw new ApiError(400, "Restaurant name is required");
  }

  if (restaurantId) {
    const updatedRestaurant = await prisma.restaurant.update({
      where: { id: restaurantId },
      data: {
        name,
        ...(description !== undefined && { description }),
        ...(address !== undefined && { address }),
        ...(contactNumber !== undefined && { contactNumber }),
        ...(imageUrl !== undefined && { imageUrl }),
      },
    });

    return res
      .status(200)
      .json(
        new ApiResponse(
          200,
          updatedRestaurant,
          "Restaurant updated successfully"
        )
      );
  }

  throw new ApiError(403, "You already have a restaurant assigned");
});

export const getMenu = asyncHandler(async (req, res) => {
  const restaurantId = req.user.restaurantId;
  const {
    categoryId,
    isAvailable,
    isActive,
    search,
    page = 1,
    limit = 50,
  } = req.query;

  const skip = (parseInt(page) - 1) * parseInt(limit);
  const where = { restaurantId };

  if (categoryId) {
    where.categoryId = parseInt(categoryId);
  }

  if (isAvailable !== undefined) {
    where.isAvailable = isAvailable === "true";
  }

  if (isActive !== undefined) {
    where.isActive = isActive === "true";
  }

  if (search) {
    where.OR = [
      { name: { contains: search, mode: "insensitive" } },
      { description: { contains: search, mode: "insensitive" } },
    ];
  }

  const [items, total] = await Promise.all([
    prisma.menuItem.findMany({
      where,
      skip,
      take: parseInt(limit),
      orderBy: { name: "asc" },
      include: {
        category: {
          select: {
            id: true,
            name: true,
            imageUrl: true,
          },
        },
      },
    }),
    prisma.menuItem.count({ where }),
  ]);

  res.status(200).json(
    new ApiResponse(
      200,
      {
        items,
        pagination: {
          total,
          page: parseInt(page),
          limit: parseInt(limit),
          totalPages: Math.ceil(total / parseInt(limit)),
        },
      },
      "Menu items fetched successfully"
    )
  );
});

export const addMenuItems = asyncHandler(async (req, res) => {
  const restaurantId = req.user.restaurantId;
  const { name, description, price, categoryId, isVeg, waitingTime } = req.body;

  if (!name || !price) {
    throw new ApiError(400, "Name and price are required");
  }

  if (categoryId) {
    const category = await prisma.category.findFirst({
      where: {
        id: parseInt(categoryId),
        restaurantId: restaurantId,
      },
    });

    if (!category) {
      throw new ApiError(
        404,
        "Category not found or doesn't belong to your restaurant"
      );
    }
  }

  let imageUrl = null;
  if (req.file) {
    const localPath = req.file.path;
    const uploadedImage = await uploadOnCloudinary(localPath);

    if (!uploadedImage || !uploadedImage.secure_url) {
      throw new ApiError(500, "Failed to upload image");
    }

    imageUrl = uploadedImage.secure_url;
  }

  const newItem = await prisma.menuItem.create({
    data: {
      restaurantId,
      name,
      description: description || null,
      price: parseFloat(price),
      categoryId: categoryId ? parseInt(categoryId) : null,
      imageUrl,
      isVeg: isVeg === "true" || isVeg === true,
      isAvailable: true,
      isActive: true,
      waitingTime: waitingTime ? parseInt(waitingTime) : 15,
    },
    include: {
      category: {
        select: {
          id: true,
          name: true,
          imageUrl: true,
        },
      },
    },
  });

  res
    .status(201)
    .json(new ApiResponse(201, newItem, "Menu item added successfully"));
});

export const updateItem = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const restaurantId = req.user.restaurantId;
  const {
    name,
    description,
    price,
    categoryId,
    isAvailable,
    isActive,
    isVeg,
    waitingTime,
  } = req.body;

  const existingItem = await prisma.menuItem.findFirst({
    where: {
      id: parseInt(id),
      restaurantId: restaurantId,
    },
  });

  if (!existingItem) {
    throw new ApiError(404, "Menu item not found");
  }

  if (categoryId) {
    const category = await prisma.category.findFirst({
      where: {
        id: parseInt(categoryId),
        restaurantId: restaurantId,
      },
    });

    if (!category) {
      throw new ApiError(404, "Category not found");
    }
  }

  let imageUrl = existingItem.imageUrl;
  if (req.file) {
    const localPath = req.file.path;
    const uploadedImage = await uploadOnCloudinary(localPath);

    if (uploadedImage && uploadedImage.secure_url) {
      imageUrl = uploadedImage.secure_url;
    }
  }

  const updatedItem = await prisma.menuItem.update({
    where: { id: parseInt(id) },
    data: {
      ...(name && { name }),
      ...(description !== undefined && { description }),
      ...(price && { price: parseFloat(price) }),
      ...(categoryId !== undefined && {
        categoryId: categoryId ? parseInt(categoryId) : null,
      }),
      ...(imageUrl && { imageUrl }),
      ...(isAvailable !== undefined && {
        isAvailable: isAvailable === "true" || isAvailable === true,
      }),
      ...(isActive !== undefined && {
        isActive: isActive === "true" || isActive === true,
      }),
      ...(isVeg !== undefined && { isVeg: isVeg === "true" || isVeg === true }),
      ...(waitingTime && { waitingTime: parseInt(waitingTime) }),
    },
    include: {
      category: {
        select: {
          id: true,
          name: true,
          imageUrl: true,
        },
      },
    },
  });

  res
    .status(200)
    .json(new ApiResponse(200, updatedItem, "Menu item updated successfully"));
});

export const deleteItem = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const restaurantId = req.user.restaurantId;

  const existingItem = await prisma.menuItem.findFirst({
    where: {
      id: parseInt(id),
      restaurantId: restaurantId,
    },
  });

  if (!existingItem) {
    throw new ApiError(404, "Menu item not found");
  }

  await prisma.menuItem.update({
    where: { id: parseInt(id) },
    data: {
      isActive: false,
      isAvailable: false,
    },
  });

  res
    .status(200)
    .json(new ApiResponse(200, null, "Menu item deleted successfully"));
});

export const getCategories = asyncHandler(async (req, res) => {
  const restaurantId = req.user.restaurantId;
  const { isActive } = req.query;

  const where = { restaurantId };

  if (isActive !== undefined) {
    where.isActive = isActive === "true";
  }

  const categories = await prisma.category.findMany({
    where,
    orderBy: [{ displayOrder: "asc" }, { name: "asc" }],
    include: {
      _count: {
        select: {
          menuItems: {
            where: {
              isActive: true,
              isAvailable: true,
            },
          },
        },
      },
    },
  });

  res
    .status(200)
    .json(new ApiResponse(200, categories, "Categories fetched successfully"));
});

export const createCategory = asyncHandler(async (req, res) => {
  const restaurantId = req.user.restaurantId;
  const { name, description, displayOrder } = req.body;

  if (!name) {
    throw new ApiError(400, "Category name is required");
  }

  const existingCategory = await prisma.category.findFirst({
    where: {
      restaurantId,
      name: name,
    },
  });

  if (existingCategory) {
    throw new ApiError(409, "Category with this name already exists");
  }

  let imageUrl = null;
  if (req.file) {
    const localPath = req.file.path;
    const uploadedImage = await uploadOnCloudinary(localPath);

    if (!uploadedImage || !uploadedImage.secure_url) {
      throw new ApiError(500, "Failed to upload image");
    }

    imageUrl = uploadedImage.secure_url;
  }

  const category = await prisma.category.create({
    data: {
      restaurantId,
      name,
      description: description || null,
      imageUrl,
      displayOrder: displayOrder ? parseInt(displayOrder) : 0,
      isActive: true,
    },
  });

  res
    .status(201)
    .json(new ApiResponse(201, category, "Category created successfully"));
});

export const updateCategory = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const restaurantId = req.user.restaurantId;
  const { name, description, displayOrder, isActive } = req.body;

  const existingCategory = await prisma.category.findFirst({
    where: {
      id: parseInt(id),
      restaurantId: restaurantId,
    },
  });

  if (!existingCategory) {
    throw new ApiError(404, "Category not found");
  }

  if (name && name !== existingCategory.name) {
    const duplicateCategory = await prisma.category.findFirst({
      where: {
        restaurantId,
        name,
        id: { not: parseInt(id) },
      },
    });

    if (duplicateCategory) {
      throw new ApiError(409, "Category with this name already exists");
    }
  }

  let imageUrl = existingCategory.imageUrl;
  if (req.file) {
    const localPath = req.file.path;
    const uploadedImage = await uploadOnCloudinary(localPath);

    if (uploadedImage && uploadedImage.secure_url) {
      imageUrl = uploadedImage.secure_url;
    }
  }

  const updatedCategory = await prisma.category.update({
    where: { id: parseInt(id) },
    data: {
      ...(name && { name }),
      ...(description !== undefined && { description }),
      ...(imageUrl && { imageUrl }),
      ...(displayOrder !== undefined && {
        displayOrder: parseInt(displayOrder),
      }),
      ...(isActive !== undefined && {
        isActive: isActive === "true" || isActive === true,
      }),
    },
  });

  res
    .status(200)
    .json(
      new ApiResponse(200, updatedCategory, "Category updated successfully")
    );
});

export const deleteCategory = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const restaurantId = req.user.restaurantId;

  const existingCategory = await prisma.category.findFirst({
    where: {
      id: parseInt(id),
      restaurantId: restaurantId,
    },
  });

  if (!existingCategory) {
    throw new ApiError(404, "Category not found");
  }

  await prisma.category.update({
    where: { id: parseInt(id) },
    data: { isActive: false },
  });

  await prisma.menuItem.updateMany({
    where: {
      categoryId: parseInt(id),
      restaurantId: restaurantId,
    },
    data: { categoryId: null },
  });

  res
    .status(200)
    .json(new ApiResponse(200, null, "Category deleted successfully"));
});
