import { prisma } from "../../lib/prisma.js";
import { asyncHandler } from "../../utils/errorHandler.js";
import { ApiResponse } from "../../utils/ApiResponse.js";
import { ApiError } from "../../utils/ApiError.js";
import { NotificationService } from "../../utils/notification/notification.service.js";
import { calculateOrderTotals } from "../../utils/order.service.js";
import crypto from "crypto";
import Restraunt_ID from "../../utils/constant.js";

async function getCartWithDetails(cartId) {
  return prisma.cart.findUnique({
    where: { id: cartId },
    include: {
      items: {
        include: {
          menuItem: {
            select: {
              id: true,
              name: true,
              description: true,
              imageUrl: true, 
              price: true,
              isVeg: true,
              isAvailable: true,
              waitingTime: true,
              restaurant: {
                select: {
                  id: true,
                  name: true,
                  imageUrl: true,
                  baseWaitingTimeMultiplier: true,
                  fixedAdditionalTime: true,
                },
              },
            },
          },
        },
      },
    },
  });
}

const getCart = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const restaurantId = Restraunt_ID;
  
  let cart = await prisma.cart.findFirst({
    where: { 
      userId,
      restaurantId 
    },
    include: {
      items: {
        include: {
          menuItem: {
            select: {
              id: true,
              name: true,
              description: true,
              imageUrl: true,
              price: true,
              isVeg: true,
              isAvailable: true,
              waitingTime: true,
              restaurant: {
                select: {
                  id: true,
                  name: true,
                  imageUrl: true,
                  isActive: true,
                  baseWaitingTimeMultiplier: true,
                  fixedAdditionalTime: true,
                },
              },
            },
          },
        },
      },
    },
  });

  if (!cart) {
    cart = await prisma.cart.create({
      data: { 
        userId,
        restaurantId 
      },
      include: {
        items: true,
      },
    });
  }

  const restaurant =
    cart.items.length > 0 ? cart.items[0].menuItem.restaurant : null;

  const unavailableItems = cart.items.filter(
    (item) => !item.menuItem.isAvailable
  );

  const subtotal = cart.items.reduce(
    (sum, item) => sum + parseFloat(item.price) * item.quantity,
    0
  );

  const itemCount = cart.items.reduce((sum, item) => sum + item.quantity, 0);

  // Get restaurant tax rate for price calculation
  const restaurantData = await prisma.restaurant.findUnique({
    where: { id: cart.restaurantId },
    select: { taxRate: true },
  });
  const taxRate = restaurantData?.taxRate || 0.05;

  // Calculate full price breakdown including tax and platform fee
  const priceBreakdown = await calculateOrderTotals(cart.items, cart.restaurantId);

  const maxWaitingTime = cart.items.reduce((max, item) => {
    const actualWaitingTime = restaurant
      ? item.menuItem.waitingTime *
          parseFloat(restaurant.baseWaitingTimeMultiplier) +
        restaurant.fixedAdditionalTime
      : item.menuItem.waitingTime;
    return Math.max(max, actualWaitingTime);
  }, 0);

  const cartWithTotals = {
    ...cart,
    subtotal: priceBreakdown.subtotal,
    tax: priceBreakdown.tax,
    taxPercentage: priceBreakdown.taxPercentage,
    platformFee: priceBreakdown.platformFee,
    totalAmount: priceBreakdown.totalAmount,
    priceBreakdown: priceBreakdown.breakdown,
    itemCount,
    estimatedWaitingTime: Math.round(maxWaitingTime),
  };

  res.status(200).json(
    new ApiResponse(
      200,
      {
        cart: cartWithTotals,
        restaurant,
        unavailableItems: unavailableItems.map((item) => ({
          id: item.id,
          menuItemId: item.menuItemId,
          name: item.menuItem.name,
        })),
        warnings:
          unavailableItems.length > 0
            ? ["Some items in your cart are no longer available"]
            : [],
        restaurantClosed: restaurant && !restaurant.isActive,
      },
      "Cart fetched successfully"
    )
  );
});

const addToCart = asyncHandler(async (req, res) => {
  const { menuItemId, quantity = 1 } = req.body;
  const userId = req.user.id;

  if (!menuItemId) {
    throw new ApiError(400, "Menu item ID is required");
  }

  if (quantity < 1) {
    throw new ApiError(400, "Quantity must be at least 1");
  }

  const menuItem = await prisma.menuItem.findUnique({
    where: { id: parseInt(menuItemId) },
    include: {
      restaurant: {
        select: {
          id: true,
          name: true,
          isActive: true,
        },
      },
    },
  });

  if (!menuItem) {
    throw new ApiError(404, "Menu item not found");
  }

  if (!menuItem.isAvailable) {
    throw new ApiError(400, "This item is currently unavailable");
  }

  if (!menuItem.restaurant.isActive) {
    throw new ApiError(400, "Restaurant is currently closed");
  }

  const restaurantId = Restraunt_ID;

  let cart = await prisma.cart.findFirst({
    where: {
      userId,
      restaurantId,
    },
  });

  if (!cart) {
    cart = await prisma.cart.create({
      data: {
        userId,
        restaurantId,
      },
    });
  }

  const existingCartItem = await prisma.cartItem.findFirst({
    where: {
      cartId: cart.id,
      menuItemId: parseInt(menuItemId),
    },
  });

  let cartItem;
  if (existingCartItem) {
    cartItem = await prisma.cartItem.update({
      where: { id: existingCartItem.id },
      data: {
        quantity: existingCartItem.quantity + parseInt(quantity),
        price: menuItem.price,
      },
    });
  } else {
    cartItem = await prisma.cartItem.create({
      data: {
        cartId: cart.id,
        menuItemId: parseInt(menuItemId),
        quantity: parseInt(quantity),
        price: menuItem.price,
      },
    });
  }

  const updatedCart = await getCartWithDetails(cart.id);

  const subtotal = updatedCart.items.reduce(
    (sum, item) => sum + parseFloat(item.price) * item.quantity,
    0
  );

  // Get restaurant tax rate
  const restaurantData = await prisma.restaurant.findUnique({
    where: { id: menuItem.restaurant.id },
    select: { taxRate: true },
  });
  const taxRate = restaurantData?.taxRate || 0.05;

  const priceBreakdown = await calculateOrderTotals(updatedCart.items, updatedCart.restaurantId);

  res.status(200).json(
    new ApiResponse(
      200,
      {
        cart: updatedCart,
        subtotal: priceBreakdown.subtotal,
        tax: priceBreakdown.tax,
        platformFee: priceBreakdown.platformFee,
        totalAmount: priceBreakdown.totalAmount,
        priceBreakdown: priceBreakdown.breakdown,
        itemCount: updatedCart.items.reduce(
          (sum, item) => sum + item.quantity,
          0
        ),
      },
      "Item added to cart successfully"
    )
  );
});

const updateCartItem = asyncHandler(async (req, res) => {
  const { cartItemId, quantity } = req.body;
  const userId = req.user.id;

  if (!cartItemId || quantity === undefined) {
    throw new ApiError(400, "Cart item ID and quantity are required");
  }

  if (quantity < 0) {
    throw new ApiError(400, "Quantity cannot be negative");
  }

  const cartItem = await prisma.cartItem.findUnique({
    where: { id: parseInt(cartItemId) },
    include: {
      cart: true,
      menuItem: {
        select: {
          isAvailable: true,
          price: true,
        },
      },
    },
  });

  if (!cartItem) {
    throw new ApiError(404, "Cart item not found");
  }

  if (cartItem.cart.userId !== userId) {
    throw new ApiError(403, "Unauthorized to modify this cart");
  }

  if (quantity === 0) {
    await prisma.cartItem.delete({
      where: { id: parseInt(cartItemId) },
    });

    const remainingItems = await prisma.cartItem.count({
      where: { cartId: cartItem.cartId },
    });

    if (remainingItems === 0) {
      await prisma.cart.update({
        where: { id: cartItem.cartId },
        data: { restaurantId: null },
      });
    }

    const updatedCart = await getCartWithDetails(cartItem.cartId);
    const subtotal = updatedCart.items.reduce(
      (sum, item) => sum + parseFloat(item.price) * item.quantity,
      0
    );

    // Get restaurant tax rate
    const restaurantData = updatedCart.items.length > 0 
      ? await prisma.restaurant.findUnique({
          where: { id: updatedCart.restaurantId },
          select: { taxRate: true },
        })
      : null;
    const taxRate = restaurantData?.taxRate || 0.05;
    const priceBreakdown = await calculateOrderTotals(updatedCart.items, updatedCart.restaurantId);

    return res.status(200).json(
      new ApiResponse(
        200,
        {
          cart: updatedCart,
          subtotal: priceBreakdown.subtotal,
          tax: priceBreakdown.tax,
          platformFee: priceBreakdown.platformFee,
          totalAmount: priceBreakdown.totalAmount,
          priceBreakdown: priceBreakdown.breakdown,
          itemCount: updatedCart.items.reduce(
            (sum, item) => sum + item.quantity,
            0
          ),
        },
        "Item removed from cart"
      )
    );
  }

  await prisma.cartItem.update({
    where: { id: parseInt(cartItemId) },
    data: {
      quantity: parseInt(quantity),
      price: cartItem.menuItem.price,
    },
  });

  const updatedCart = await getCartWithDetails(cartItem.cartId);
  const subtotal = updatedCart.items.reduce(
    (sum, item) => sum + parseFloat(item.price) * item.quantity,
    0
  );

  // Get restaurant tax rate
  const restaurantData = await prisma.restaurant.findUnique({
    where: { id: updatedCart.restaurantId },
    select: { taxRate: true },
  });
  const taxRate = restaurantData?.taxRate || 0.05;
  const priceBreakdown = await calculateOrderTotals(updatedCart.items, updatedCart.restaurantId);

  res.status(200).json(
    new ApiResponse(
      200,
      {
        cart: updatedCart,
        subtotal: priceBreakdown.subtotal,
        tax: priceBreakdown.tax,
        platformFee: priceBreakdown.platformFee,
        totalAmount: priceBreakdown.totalAmount,
        priceBreakdown: priceBreakdown.breakdown,
        itemCount: updatedCart.items.reduce(
          (sum, item) => sum + item.quantity,
          0
        ),
      },
      "Cart updated successfully"
    )
  );
});

const removeFromCart = asyncHandler(async (req, res) => {
  const { cartItemId } = req.body;
  const userId = req.user.id;
  const cartItem = await prisma.cartItem.findUnique({
    where: { id: parseInt(cartItemId) },
    include: {
      cart: true,
    },
  });

  if (!cartItem) {
    throw new ApiError(404, "Cart item not found");
  }

  if (cartItem.cart.userId !== userId) {
    throw new ApiError(403, "Unauthorized to modify this cart");
  }

  await prisma.cartItem.delete({
    where: { id: parseInt(cartItemId) },
  });

  const remainingItems = await prisma.cartItem.count({
    where: { cartId: cartItem.cartId },
  });

  if (remainingItems === 0) {
    await prisma.cart.update({
      where: { id: cartItem.cartId },
      data: { restaurantId: Restraunt_ID },
    });
  }

  const updatedCart = await getCartWithDetails(cartItem.cartId);
  const subtotal = updatedCart.items.reduce(
    (sum, item) => sum + parseFloat(item.price) * item.quantity,
    0
  );

  // Get restaurant tax rate
  const restaurantData = updatedCart.items.length > 0 
    ? await prisma.restaurant.findUnique({
        where: { id: updatedCart.restaurantId },
        select: { taxRate: true },
      })
    : null;
  const taxRate = restaurantData?.taxRate || 0.05;
  const priceBreakdown = await calculateOrderTotals(updatedCart.items, updatedCart.restaurantId);

  res.status(200).json(
    new ApiResponse(
      200,
      {
        cart: updatedCart,
        subtotal: priceBreakdown.subtotal,
        tax: priceBreakdown.tax,
        platformFee: priceBreakdown.platformFee,
        totalAmount: priceBreakdown.totalAmount,
        priceBreakdown: priceBreakdown.breakdown,
        itemCount: updatedCart.items.reduce(
          (sum, item) => sum + item.quantity,
          0
        ),
      },
      "Item removed from cart"
    )
  );
});

const clearCart = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const restaurantId = Restraunt_ID;

  const cart = await prisma.cart.findFirst({
    where: { 
      userId,
      restaurantId 
    },
  });

  if (!cart) {
    throw new ApiError(404, "Cart not found");
  }

  await prisma.cartItem.deleteMany({
    where: { cartId: cart.id },
  });

  res.status(200).json(new ApiResponse(200, null, "Cart cleared successfully"));
});

const createOrder = asyncHandler(async (req, res) => {
  const { timeSlotId, notes } = req.body;
  const userId = req.user.id;

  const cart = await prisma.cart.findFirst({
    where: {
      userId,
      // restaurantId: { not: null },
    },
    include: {
      items: {
        include: {
          menuItem: {
            include: {
              restaurant: true,
            },
          },
        },
      },
    },
  });

  if (!cart || cart.items.length === 0) {
    throw new ApiError(400, "Cart is empty");
  }

  const restaurant = cart.items[0].menuItem.restaurant;

  if (!restaurant.isActive) {
    throw new ApiError(400, "Restaurant is currently closed");
  }

  const unavailableItems = cart.items.filter(
    (item) => !item.menuItem.isAvailable
  );

  if (unavailableItems.length > 0) {
    throw new ApiError(
      400,
      `Following items are unavailable: ${unavailableItems
        .map((i) => i.menuItem.name)
        .join(", ")}`
    );
  }

  const subtotal = cart.items.reduce(
    (sum, item) => sum + parseFloat(item.price) * item.quantity,
    0
  );

  const taxRate = restaurant.taxRate || 0.05;
  const priceBreakdown = await calculateOrderTotals(cart.items, cart.restaurantId);
  const totalAmount = priceBreakdown.totalAmount;

  const maxWaitingTime = cart.items.reduce((max, item) => {
    const actualWaitingTime =
      item.menuItem.waitingTime *
        parseFloat(restaurant.baseWaitingTimeMultiplier) +
      restaurant.fixedAdditionalTime;
    return Math.max(max, actualWaitingTime);
  }, 0);

  const estimatedWaitingTime = Math.round(maxWaitingTime);

  const now = new Date();
  const expiresAt = new Date(now.getTime() + 2 * 60 * 1000); // 2 minutes

  const parsedTimeSlotId = timeSlotId ? parseInt(timeSlotId) : null;
  
  if (parsedTimeSlotId) {
    const slot = await prisma.timeSlot.findUnique({
      where: { id: parsedTimeSlotId },
    });
    
    if (!slot) {
      throw new ApiError(404, "Selected time slot not found");
    }
    
    if (!slot.isAvailable || slot.bookedCount >= 10) {
      throw new ApiError(400, "Selected time slot is no longer available");
    }
  }

  const order = await prisma.$transaction(async (tx) => {
    const newOrder = await tx.order.create({
      data: {
        userId,
        restaurantId: cart.restaurantId,
        totalAmount,
        estimatedWaitingTime,
        status: "Waiting",
        restaurantStatus: "Pending",
        paymentStatus: "pending",
        expiresAt,
        notes: notes || null,
        timeSlotId: parsedTimeSlotId,
      },
    });

    if (parsedTimeSlotId) {
      await tx.timeSlot.update({
        where: { id: parsedTimeSlotId },
        data: {
          bookedCount: { increment: 1 },
        },
      });
    }

    const orderItemsData = cart.items.map((item) => ({
      orderId: newOrder.id,
      menuItemId: item.menuItemId,
      quantity: item.quantity,
      price: item.price,
      waitingTime: item.menuItem.waitingTime, 
    }));

    await tx.orderItem.createMany({
      data: orderItemsData,
    });

    await tx.cartItem.deleteMany({
      where: { cartId: cart.id },
    });

    await tx.cart.update({
      where: { id: cart.id },
      data: { restaurantId: Restraunt_ID },
    });

    return newOrder;
  });

  const completeOrder = await prisma.order.findUnique({
    where: { id: order.id },
    include: {
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
      restaurant: {
        select: {
          id: true,
          name: true,
          imageUrl: true,
          contactNumber: true,
          address: true,
        },
      },
      timeSlot: true,
    },
  });

  try {
    const restaurantAdmin = await prisma.restaurantAdmin.findFirst({
      where: {
        restaurantId: cart.restaurantId,
        isActive: true,
      },
    });

    if (restaurantAdmin) {
      await NotificationService.send({
        userId: restaurantAdmin.userId,
        type: "ORDER_PLACED",
        title: "New Order Received!",
        message: `Order #${order.id} for ₹${totalAmount}. Accept within 2 minutes.`,
        data: {
          orderId: order.id,
          restaurantId: cart.restaurantId,
          totalAmount: totalAmount.toString(),
          expiresAt: expiresAt.toISOString(),
        },
      });
    }
    await NotificationService.sendToAdmin({
    restaurantId: Restraunt_ID,
    type: 'ORDER_PLACED',
    title: ' New Order Received!',
    message: `Order #${order.id} - ₹${order.totalAmount}`,
    data: {
      orderId: order.id,
      orderTotal: order.totalAmount,
      customerName: order.user.name,
      userId: order.userId
    }
  });
  } catch (notifError) {
    console.error("Failed to send notification:", notifError);
  }

  res
    .status(201)
    .json(
      new ApiResponse(
        201,
        { 
          order: completeOrder,
          priceBreakdown: priceBreakdown.breakdown,
        },
        "Order placed successfully. Waiting for restaurant confirmation."
      )
    );
});

const verifyPayment = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const { orderId, paytmOrderId, paytmTxnId, paytmParams } =
    req.body;

  const order = await prisma.order.findFirst({
    where: {
      id: parseInt(orderId),
      userId,
      paymentOrderId: paytmOrderId, 
    },
  });

  if (!order) {
    throw new ApiError(404, "Order not found");
  }

  // Verify checksum using PaytmChecksum
  const PaytmChecksum = (await import("paytmchecksum")).default;
  const isAuthentic = await PaytmChecksum.verifySignature(
    paytmParams,
    process.env.PAYTM_MERCHANT_KEY,
    paytmParams.CHECKSUMHASH
  );

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
        paymentStatus: "paid",
        status: "Finished",
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
        gatewayPaymentId: paytmTxnId,
        status: "paid",
      },
    });

    return updated;
  });

  return res.json(
    new ApiResponse(200, updatedOrder, "Payment verified successfully")
  );
});

const getMyOrders = asyncHandler(async (req, res) => {
  const {
    status,
    restaurantStatus,
    page = 1,
    limit = 20,
    sortBy = "createdAt",
    sortOrder = "desc",
  } = req.query;

  const userId = req.user.id;
  const skip = (parseInt(page) - 1) * parseInt(limit);

  const where = { userId };

  if (status) {
    where.status = status;
  }

  if (restaurantStatus) {
    where.restaurantStatus = restaurantStatus;
  }

  const [orders, total] = await Promise.all([
    prisma.order.findMany({
      where,
      skip,
      take: parseInt(limit),
      orderBy: { [sortBy]: sortOrder },
      include: {
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
        restaurant: {
          select: {
            id: true,
            name: true,
            imageUrl: true,
            contactNumber: true,
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

const getOrderById = asyncHandler(async (req, res) => {
  const { orderId } = req.params;
  // const {orderrr} = req.params;
  const userId = req.user.id;
  console.log(orderId, userId);
  const order = await prisma.order.findUnique({
    where: { id: parseInt(orderId) },
    include: {
      orderItems: {
        include: {
          menuItem: {
            select: {
              id: true,
              name: true,
              imageUrl: true,
              description: true,
              price: true,
              isVeg: true,
            },
          },
        },
      },
      restaurant: {
        select: {
          id: true,
          name: true,
          imageUrl: true,
          description: true,
          address: true,
          contactNumber: true,
          taxRate: true,
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

  if (order.userId !== userId) {
    throw new ApiError(403, "Unauthorized to view this order");
  }

  // Calculate price breakdown for order details
  const subtotal = order.orderItems.reduce(
    (sum, item) => sum + parseFloat(item.price) * item.quantity,
    0
  );
  const taxRate = order.restaurant.taxRate || 0.05;
  const priceBreakdown = await calculateOrderTotals(order.orderItems, order.restaurant.id);

  res
    .status(200)
    .json(new ApiResponse(200, { 
      order,
      priceBreakdown: priceBreakdown.breakdown,
    }, "Order fetched successfully"));
});

const getOrderStatus = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const userId = req.user.id;

  const order = await prisma.order.findUnique({
    where: { id: parseInt(id) },
    select: {
      id: true,
      userId: true,
      status: true,
      restaurantStatus: true,
      paymentStatus: true,
      estimatedReadyTime: true,
      expiresAt: true,
      paymentExpiresAt: true,
      rejectionReason: true,
      updatedAt: true,
    },
  });

  if (!order) {
    throw new ApiError(404, "Order not found");
  }

  if (order.userId !== userId) {
    throw new ApiError(403, "Unauthorized");
  }

  res
    .status(200)
    .json(
      new ApiResponse(200, { status: order }, "Status fetched successfully")
    );
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
  getOrderStatus,
};
