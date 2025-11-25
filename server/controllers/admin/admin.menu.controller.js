import { prisma } from "../../lib/prisma.js";
import { asyncHandler } from "../../utils/errorHandler.js";
import { ApiResponse } from "../../utils/ApiResponse.js";
import { ApiError } from "../../utils/ApiError.js";
import { uploadOnCloudinary } from "../../utils/cloudinary.js";

const addRestraunt = asyncHandler(async (req, res) => {
  const { name, description, address, contactNumber, imageUrl, isActive } =
    req.body;
  if (!name) {
    throw new ApiError(404, "Invalid fields ");
  }
  try {
    const newItem = await prisma.restaurant.create({
      data: {
        name,
        description,
        address,
        contactNumber,
        imageUrl: "",
        isActive: true,
      },
    });
    res.status(201).json(new ApiResponse(200, "ItemAdded"));
  } catch {
    throw new ApiError(400, "Error creating menu!");
  }

});
const addMenuItems = asyncHandler(async (req, res) => {
  const { name, description, price, category, restaurantId, isVeg } = req.body;

  if (!name || !price || !restaurantId) {
    throw new ApiError(400, "Name, price, and restaurantId are required");
  }

  const localPath = req.file.path;
  if (!localPath) {
    throw new ApiError(400, "Image file is required");
  }

  const image = await uploadOnCloudinary(localPath);
  if (!image || !image.secure_url) {
    throw new ApiError(409, "Cloudinary upload failed");
  }

  try {
    const newItem = await prisma.menuItem.create({
      data: {
        name,
        description: description || null,
        price: parseFloat(price), 
        category: category || null,
        restaurantId: parseInt(restaurantId),
        isActive: true,
        isAvailable: true,
        isVeg: isVeg === "true" || isVeg === true, 
        imageUrl: image.secure_url,
      },
    });

    res
      .status(201)
      .json(new ApiResponse(201, "Item added successfully", newItem));
  } catch (error) {
    console.error("Menu item creation error:", error);
    throw new ApiError(400, "Error creating menu item!");
  }
});

const deleteItem = asyncHandler(async (req, res) => {
  const { id } = req.params;
  try {
    const deletedItem = await prisma.menuItem.update({
      where: { id: parseInt(id) },
      data: { isActive: false },
    });
    res.status(200).json(new ApiResponse(200, "Item Deleted"));
  } catch {
    throw new ApiError(400, "Error deleting menu item!");
  }
});

const updateItem = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { name, description, price, category, isAvailable, isVeg, imageUrl } =
    req.body;
  try {
    const menuItem = await prisma.menuItem.update({
      where: { id: parseInt(id) },
      data: {
        ...(name && { name }),
        ...(description !== undefined && { description }),
        ...(price && { price }),
        ...(imageUrl !== undefined && { imageUrl }),
        ...(category !== undefined && { category }),
        ...(isAvailable !== undefined && { isAvailable }),
        ...(isActive !== undefined && { isActive }),
        ...(isVeg !== undefined && { isVeg }),
      },
      include: {
        restaurant: true,
      },
    });
    return res.status(200).json(new ApiResponse(200, "Item Updated", menuItem));
  } catch {
    throw new ApiError(400, "Error updating menu item!");
  }
});

export { addRestraunt, deleteItem, updateItem, addMenuItems };
