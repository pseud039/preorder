import { prisma } from "../../lib/prisma.js";
import { asyncHandler } from "../../utils/errorHandler.js";
import { ApiResponse } from "../../utils/ApiResponse.js";
import { ApiError } from "../../utils/ApiError.js";
import Razorpay from 'razorpay';

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});


const getCart = asyncHandler(async (req, res) => {
    const userId = req.user.id;

    const cart = await prisma.cart.findUnique({
      where: { userId },
      include: {
        items: {
          include: {
            menuItem: {
              select: {
                id: true,
                name: true,
                description: true,
                price: true,
                imageUrl: true,
                isAvailable: true,
                isActive: true,
                isVeg: true,
                category: true,
              },
            },
          },
        },
      },
    });

    if (!cart) {
     throw new ApiError(404, "Cart not found");
    }

    // Calculate total
    const totalAmount = cart.items.reduce(
      (sum, item) => sum + Number(item.price) * item.quantity,
      0
    );

    const itemCount = cart.items.reduce((sum, item) => sum + item.quantity, 0);

    res.json(new ApiResponse(200, "Cart fetched successfully", {
      cart: {
        ...cart,
        totalAmount,
        itemCount,
      },
    }));
});

const addToCart = asyncHandler(async (req, res) => {

    const userId = req.user.id;
    const { menuItemId, quantity = 1 } = req.body;

    if (!menuItemId || quantity < 1) {
      throw new ApiError(400, "Invalid menu item or quantity");
    }

    const menuItem = await prisma.menuItem.findUnique({
      where: { id: menuItemId },
      include: { restaurant: true },
    });

    if (!menuItem || !menuItem.isActive || !menuItem.isAvailable) {
     throw new ApiError(404, "Menu item not found or unavailable");
    }

    if (!menuItem.restaurant.isActive) {
      throw new ApiError(400, "Cannot add items from an inactive restaurant");
    }

    let cart = await prisma.cart.findUnique({
      where: { userId },
      include: { items: true },
    });

    if (cart && cart.restaurantId !== menuItem.restaurantId) {
      await prisma.cartItem.deleteMany({
        where: { cartId: cart.id },
      });
      await prisma.cart.update({
        where: { id: cart.id },
        data: { restaurantId: menuItem.restaurantId },
      });
    }

    if (!cart) {
      cart = await prisma.cart.create({
        data: {
          userId,
          restaurantId: menuItem.restaurantId,
        },
      });
    }

    const existingItem = await prisma.cartItem.findUnique({
      where: {
        cartId_menuItemId: {
          cartId: cart.id,
          menuItemId,
        },
      },
    });

    if (existingItem) {
      const updatedItem = await prisma.cartItem.update({
        where: { id: existingItem.id },
        data: { quantity: existingItem.quantity + quantity },
        include: { menuItem: true },
      });

      return res.json({
        success: true,
        message: 'Cart updated',
        data: updatedItem,
      });
    }

    const cartItem = await prisma.cartItem.create({
      data: {
        cartId: cart.id,
        menuItemId,
        quantity,
        price: menuItem.price,
      },
      include: { menuItem: true },
    });

    res.json(new ApiResponse(200, "Item added to cart", {
      success: true,
      message: 'Item added to cart',
      data: cartItem,
    }));
});

const updateCartItem = asyncHandler(async (req, res) => {
     const userId = req.user.id;
    const { cartItemId, quantity } = req.body;

    if (!cartItemId || quantity < 0) {
     throw new ApiError(400, "Invalid cart item or quantity");
    }

    // Verify cart item belongs to user
    const cartItem = await prisma.cartItem.findFirst({
      where: {
        id: cartItemId,
        cart: { userId },
      },
    });

    if (!cartItem) {
      throw new ApiError(404, "Cart item not found");
    }

    // If quantity is 0, delete the item
    if (quantity === 0) {
      await prisma.cartItem.delete({
        where: { id: cartItemId },
      });

      return res.json(new ApiResponse(200, "Item removed from cart"));
    }

    // Update quantity
    const updatedItem = await prisma.cartItem.update({
      where: { id: cartItemId },
      data: { quantity },
      include: { menuItem: true },
    });

    res.json(new ApiResponse(200, "Cart item updated", updatedItem));
});

const removeFromCart = async (req, res) => {

    const userId = req.user.id;
    const { cartItemId } = req.params;

    const cartItem = await prisma.cartItem.findFirst({
      where: {
        id: parseInt(cartItemId),
        cart: { userId },
      },
    });

    if (!cartItem) {
  throw new ApiError(404, "Cart item not found");
    }

    await prisma.cartItem.delete({
      where: { id: parseInt(cartItemId) },
    });

    res.json(new ApiResponse(200, "Item removed from cart"));
};

 const clearCart = async (req, res) => {
    const userId = req.user.id;

    const cart = await prisma.cart.findUnique({
      where: { userId },
    });

    if (!cart) {
     return res.json(new ApiResponse(200, "Cart is already empty"));
    }

    await prisma.cartItem.deleteMany({
      where: { cartId: cart.id },
    });

    res.json(new ApiResponse(200, "Cart cleared successfully"));
};

const createOrder = asyncHandler(async (req, res) => {

    const userId = req.user.id;
    const { timeSlotId, notes } = req.body;

    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user.name || !user.phone) {
      return res.status(400).json({
        success: false,
        message: 'Please complete your profile before ordering',
        redirectTo: '/profile',
      });
    }

    const cart = await prisma.cart.findUnique({
      where: { userId },
      include: {
        items: {
          include: {
            menuItem: true,
          },
        },
      },
    });

    if (!cart || cart.items.length === 0) {
     throw new ApiError(400, "Cart is empty");
    }

    for (const item of cart.items) {
      if (!item.menuItem.isAvailable || !item.menuItem.isActive) {
        throw new ApiError(400, `${item.menuItem.name} is no longer available`);
      }
    }

    if (timeSlotId) {
      const timeSlot = await prisma.timeSlot.findUnique({
        where: { id: timeSlotId },
      });

      if (!timeSlot || !timeSlot.isAvailable) {
       throw new ApiError(400, "Selected time slot is not available");
      }
    }

    const totalAmount = cart.items.reduce(
      (sum, item) => sum + Number(item.price) * item.quantity,
      0
    );

    const razorpayOrder = await razorpay.orders.create({
      amount: Math.round(totalAmount * 100), // Convert to paise
      currency: 'INR',
      receipt: `order_${Date.now()}`,
      notes: {
        userId: userId.toString(),
        restaurantId: cart.restaurantId.toString(),
      },
    });

    const order = await prisma.$transaction(async (tx) => {
      const newOrder = await tx.order.create({
        data: {
          userId,
          restaurantId: cart.restaurantId,
          totalAmount,
          timeSlotId,
          notes,
          razorpayOrderId: razorpayOrder.id,
          status: 'Waiting',
          paymentStatus: 'pending',
          orderItems: {
            create: cart.items.map((item) => ({
              menuItemId: item.menuItemId,
              quantity: item.quantity,
              price: item.price,
            })),
          },
        },
        include: {
          orderItems: {
            include: {
              menuItem: true,
            },
          },
          restaurant: true,
          timeSlot: true,
        },
      });

      await tx.payment.create({
        data: {
          orderId: newOrder.id,
          razorpayOrderId: razorpayOrder.id,
          amount: totalAmount,
          status: 'pending',
        },
      });

      await tx.cartItem.deleteMany({
        where: { cartId: cart.id },
      });

      return newOrder;
    });

    res.json(new ApiResponse(200, "Order created successfully", {
      data: {
        order,
        razorpayOrder: {
          id: razorpayOrder.id,
          amount: razorpayOrder.amount,
          currency: razorpayOrder.currency,
        },
      },
    }));
});

const getMyOrders = asyncHandler(async (req, res) => {
  
    const userId = req.user.id;
    const { status, page = 1, limit = 10 } = req.query;

    const skip = (page - 1) * limit;

    const where = { userId };
    if (status) {
      where.status = status;
    }

    const [orders, total] = await Promise.all([
      prisma.order.findMany({
        where,
        include: {
          orderItems: {
            include: {
              menuItem: true,
            },
          },
          restaurant: true,
          timeSlot: true,
          payment: true,
        },
        orderBy: { createdAt: 'desc' },
        skip: parseInt(skip),
        take: parseInt(limit),
      }),
      prisma.order.count({ where }),
    ]);

    res.json(new ApiResponse(200, "Orders fetched successfully", {
      data: {
        orders,
        pagination: {
          total,
          page: parseInt(page),
          limit: parseInt(limit),
          totalPages: Math.ceil(total / limit),
        },
      },
    }));
});

const getOrderById = asyncHandler(async (req, res) => {
  
    const userId = req.user.id;
    const { orderId } = req.params;

    const order = await prisma.order.findFirst({
      where: {
        id: parseInt(orderId),
        userId,
      },
      include: {
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

    res.json(new ApiResponse(200, "Order fetched successfully", order));
  
});

export {
  getCart,
  addToCart,
  removeFromCart,
  clearCart,
  updateCartItem,
  createOrder,
  getMyOrders,
  getOrderById,
};