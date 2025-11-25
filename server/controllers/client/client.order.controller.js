import { prisma } from "../../lib/prisma.js";
import { asyncHandler } from "../../utils/errorHandler.js";
import { ApiResponse } from "../../utils/ApiResponse.js";
import { ApiError } from "../../utils/ApiError.js";
import Razorpay from "razorpay";
import crypto from "crypto";

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

const getCart = asyncHandler(async (req, res) => {
  const userId = req.userId;

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

  res.json(
    new ApiResponse(
      200,
      "Cart fetched successfully",
      {
        cart: {
          ...cart,
          totalAmount,
          itemCount,
        },
      },
      "Cart fetched!"
    )
  );
});

const addToCart = asyncHandler(async (req, res) => {
  const userId = req.userId;
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
      message: "Cart updated",
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

  res.json(
    new ApiResponse(200, "Item added to cart", {
      success: true,
      message: "Item added to cart",
      data: cartItem,
    })
  );
});

const updateCartItem = asyncHandler(async (req, res) => {
  const userId = req.userId;
  const { cartItemId, quantity } = req.body;

  if (!cartItemId || quantity < 0) {
    throw new ApiError(400, "Invalid cart item or quantity");
  }

  const cartItem = await prisma.cartItem.findFirst({
    where: {
      id: cartItemId,
      cart: { userId },
    },
  });

  if (!cartItem) {
    throw new ApiError(404, "Cart item not found");
  }

  if (quantity === 0) {
    await prisma.cartItem.delete({
      where: { id: cartItemId },
    });

    return res.json(new ApiResponse(200, "Item removed from cart"));
  }

  const updatedItem = await prisma.cartItem.update({
    where: { id: cartItemId },
    data: { quantity },
    include: { menuItem: true },
  });

  res.json(new ApiResponse(200, "Cart item updated", updatedItem));
});

const removeFromCart = async (req, res) => {
  const userId = req.userId;
  const { cartItemId } = req.body;

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
  const userId = req.userId;

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
  const userId = req.userId;
  const { timeSlotId, notes } = req.body;

  console.log("Creating order:", { userId, timeSlotId, notes });

  const user = await prisma.user.findUnique({
    where: { id: userId },
  });

  if (!user.name || !user.phone) {
    throw new ApiError(400, "Please complete your profile before ordering");
  }

  if (!user.phoneVerified) {
    throw new ApiError(400, "Please verify your phone number");
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

  console.log("Cart found:", cart);
  console.log("Cart items count:", cart?.items?.length || 0);

  if (!cart || cart.items.length === 0) {
    throw new ApiError(400, "Cart is empty");
  }

  for (const item of cart.items) {
    if (!item.menuItem.isAvailable || !item.menuItem.isActive) {
      throw new ApiError(400, `${item.menuItem.name} is no longer available`);
    }
  }

  // Verify time slot if provided
  if (!timeSlotId) {
    throw new ApiError(400, "Please select a pickup time slot");
  }

  const timeSlot = await prisma.timeSlot.findUnique({
    where: { id: parseInt(timeSlotId) },
  });

  if (!timeSlot || !timeSlot.isAvailable) {
    throw new ApiError(400, "Selected time slot is not available");
  }

  if (timeSlot.bookedCount >= timeSlot.capacity) {
    throw new ApiError(400, "Selected time slot is fully booked");
  }

  if (new Date() > timeSlot.slotStart) {
    throw new ApiError(400, "Cannot book past time slots");
  }

  const totalAmount = cart.items.reduce(
    (sum, item) => sum + Number(item.price) * item.quantity,
    0
  );

  console.log("Total amount:", totalAmount);

  // Create Razorpay order
  const razorpayOrder = await razorpay.orders.create({
    amount: Math.round(totalAmount * 100), // Convert to paise
    currency: "INR",
    receipt: `order_${Date.now()}`,
    notes: {
      userId: userId.toString(),
      restaurantId: cart.restaurantId.toString(),
      timeSlotId: timeSlotId.toString(),
    },
  });

  console.log("Razorpay order created:", razorpayOrder.id);

  // Create order in transaction
  const order = await prisma.$transaction(async (tx) => {
    // 1. Create order
    const newOrder = await tx.order.create({
      data: {
        userId,
        restaurantId: cart.restaurantId,
        totalAmount,
        timeSlotId: parseInt(timeSlotId),
        notes,
        razorpayOrderId: razorpayOrder.id,
        status: "Waiting",
        paymentStatus: "pending",
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

    // 2. Create payment record
    await tx.payment.create({
      data: {
        orderId: newOrder.id,
        razorpayOrderId: razorpayOrder.id,
        amount: totalAmount,
        status: "pending",
      },
    });

    await tx.timeSlot.update({
      where: { id: parseInt(timeSlotId) },
      data: {
        bookedCount: {
          increment: 1,
        },
      },
    });

    // 4. Clear cart items
    await tx.cartItem.deleteMany({
      where: { cartId: cart.id },
    });

    console.log("Order created successfully:", newOrder.id);

    return newOrder;
  });

  return res.json(
    new ApiResponse(
      200,
      {
        order,
        razorpayOrder: {
          id: razorpayOrder.id,
          amount: razorpayOrder.amount,
          currency: razorpayOrder.currency,
        },
      },
      "Order created successfully"
    )
  );
});

const verifyPayment = asyncHandler(async (req, res) => {
  const userId = req.userId;
  const { orderId, razorpayOrderId, razorpayPaymentId, razorpaySignature } =
    req.body;

  console.log("Verifying payment:", {
    orderId,
    razorpayOrderId,
    razorpayPaymentId,
  });

  const order = await prisma.order.findFirst({
    where: {
      id: parseInt(orderId),
      userId,
      razorpayOrderId,
    },
  });

  if (!order) {
    throw new ApiError(404, "Order not found");
  }

  const body = razorpayOrderId + "|" + razorpayPaymentId;
  const expectedSignature = crypto
    .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
    .update(body.toString())
    .digest("hex");

  const isAuthentic = expectedSignature === razorpaySignature;

  if (!isAuthentic) {
    await prisma.$transaction(async (tx) => {
      await tx.order.update({
        where: { id: order.id },
        data: {
          paymentStatus: "failed",
          status: "Cancelled",
        },
      });

      await tx.payment.updateMany({
        where: { orderId: order.id },
        data: {
          status: "failed",
        },
      });
    });

    throw new ApiError(400, "Invalid payment signature");
  }

  const updatedOrder = await prisma.$transaction(async (tx) => {
    const updated = await tx.order.update({
      where: { id: order.id },
      data: {
        paymentStatus: "completed",
        status: "Confirmed",
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

    await tx.payment.updateMany({
      where: { orderId: order.id },
      data: {
        razorpayPaymentId,
        status: "completed",
        paidAt: new Date(),
      },
    });

    return updated;
  });

  console.log("Payment verified successfully for order:", order.id);

  return res.json(
    new ApiResponse(200, updatedOrder, "Payment verified successfully")
  );
});

const handleOrderPaid = async (order) => {
  console.log("Order paid:", order.id);
};

const handlePaymentCaptured = async (payment) => {
  const orderId = payment.notes?.orderId;

  if (!orderId) return;

  await prisma.order.update({
    where: { id: parseInt(orderId) },
    data: {
      paymentStatus: "completed",
      status: "Confirmed",
    },
  });

  await prisma.payment.updateMany({
    where: { razorpayOrderId: payment.order_id },
    data: {
      razorpayPaymentId: payment.id,
      status: "completed",
      paidAt: new Date(),
    },
  });
};

const handlePaymentFailed = async (payment) => {
  await prisma.payment.updateMany({
    where: { razorpayOrderId: payment.order_id },
    data: {
      status: "failed",
    },
  });

  const paymentRecord = await prisma.payment.findFirst({
    where: { razorpayOrderId: payment.order_id },
  });

  if (paymentRecord) {
    await prisma.order.update({
      where: { id: paymentRecord.orderId },
      data: {
        paymentStatus: "failed",
        status: "Cancelled",
      },
    });
  }
};

const getMyOrders = asyncHandler(async (req, res) => {
  const userId = req.userId;
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

const getOrderById = asyncHandler(async (req, res) => {
  const userId = req.userId;
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
  console.log(order);

  res.json(new ApiResponse(200, order, "Order fetched successfully"));
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
  verifyPayment,
  handleOrderPaid,
  handlePaymentCaptured,
  handlePaymentFailed,
};
