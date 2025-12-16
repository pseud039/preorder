import { asyncHandler } from "../../utils/errorHandler.js";
import { ApiError } from "../../utils/ApiError.js";
import { ApiResponse } from "../../utils/ApiResponse.js";
import { PaymentService } from "../../utils/paymentgateway/payment.service.js";
import { prisma } from "../../lib/prisma.js";

// 1. CREATE PAYMENT ORDER
export const createPaymentOrder = asyncHandler(async (req, res) => {
  const { orderId } = req.body;
  const userId = req.user.id;

  if (!orderId) {
    throw new ApiError(400, "Order ID is required");
  }

  const order = await prisma.order.findUnique({
    where: { id: parseInt(orderId) },
    include: {
      restaurant: { select: { id: true, name: true, commissionRate: true } },
      user: { select: { id: true, name: true, email: true, phone: true } }
    }
  });

  if (!order) {
    throw new ApiError(404, "Order not found");
  }

  if (order.userId !== userId) {
    throw new ApiError(403, "Unauthorized to pay for this order");
  }

  if (order.paymentStatus === "paid") {
    throw new ApiError(400, "Order is already paid");
  }

  // Check if payment already exists
  const existingPayment = await prisma.payment.findUnique({
    where: { orderId: order.id }
  });

  if (existingPayment && existingPayment.status === "paid") {
    throw new ApiError(400, "Payment already completed");
  }

  // Create PhonePe payment order
  const phonePeOrder = await PaymentService.createPhonePeOrder({
    orderId: order.id,
    amount: parseFloat(order.totalAmount),
    customerInfo: {
      customerId: order.userId.toString(),
      customerEmail: order.user.email || `user${order.userId}@example.com`,
      customerPhone: order.user.phone || "9999999999"
    }
  });

  // Create or update payment record
  const payment = existingPayment
    ? await prisma.payment.update({
        where: { id: existingPayment.id },
        data: {
          razorpayOrderId: phonePeOrder.orderId,
          status: "pending",
          paymentGateway: "phonepe"
        }
      })
    : await prisma.payment.create({
        data: {
          orderId: order.id,
          razorpayOrderId: phonePeOrder.orderId,
          amount: order.totalAmount,
          status: "pending",
          paymentGateway: "phonepe"
        }
      });

  // Update order with payment order ID
  await prisma.order.update({
    where: { id: order.id },
    data: { 
      razorpayOrderId: phonePeOrder.orderId,
      paymentExpiresAt: new Date(Date.now() + 10 * 60 * 1000) // 10 minutes
    }
  });

  res.status(200).json(
    new ApiResponse(200, {
      payment,
      phonePeConfig: {
        orderId: phonePeOrder.orderId,
        paymentUrl: phonePeOrder.paymentUrl,
        amount: parseFloat(order.totalAmount),
        merchantId: process.env.PHONEPE_MERCHANT_ID
      }
    }, "Payment order created successfully")
  );
});

// 2. PAYMENT CALLBACK (PhonePe redirects here)
export const handlePaymentCallback = asyncHandler(async (req, res) => {
  const { response } = req.body;

  if (!response) {
    console.error("No response in callback");
    return res.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL}/payment/failed?reason=no_response`
    );
  }

  // Decode base64 response
  const decodedResponse = JSON.parse(
    Buffer.from(response, "base64").toString("utf-8")
  );

  const { transactionId, amount, code, merchantId, merchantTransactionId } = decodedResponse.data || {};

  console.log("Payment callback received:", { 
    merchantTransactionId,
    transactionId,
    code,
    amount
  });

  // Verify checksum
  const xVerifyHeader = req.headers["x-verify"];
  const isValidChecksum = PaymentService.verifyPhonePeChecksum(response, xVerifyHeader);

  if (!isValidChecksum) {
    console.error("Invalid checksum for transaction:", merchantTransactionId);
    return res.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL}/payment/failed?reason=invalid_checksum`
    );
  }

  // Find payment
  const payment = await prisma.payment.findFirst({
    where: { razorpayOrderId: merchantTransactionId },
    include: {
      order: {
        include: { 
          restaurant: { select: { commissionRate: true } }
        }
      }
    }
  });

  if (!payment) {
    console.error("Payment not found for transaction:", merchantTransactionId);
    return res.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL}/payment/failed?reason=order_not_found`
    );
  }

  if (code === "PAYMENT_SUCCESS") {
    try {
      await prisma.$transaction(async (tx) => {
        // Update payment
        await tx.payment.update({
          where: { id: payment.id },
          data: {
            status: "paid",
            razorpayPaymentId: transactionId,
            razorpaySignature: xVerifyHeader
          }
        });

        // Update order
        const estimatedReadyTime = payment.order.estimatedWaitingTime
          ? new Date(Date.now() + payment.order.estimatedWaitingTime * 60 * 1000)
          : null;

        await tx.order.update({
          where: { id: payment.orderId },
          data: {
            paymentStatus: "paid",
            status: "Waiting",
            estimatedReadyTime,
            expiresAt: new Date(Date.now() + 2 * 60 * 1000) // 2 minutes for restaurant to accept
          }
        });

        // Create commission
        const orderAmount = parseFloat(payment.amount);
        const commissionRate = parseFloat(payment.order.restaurant.commissionRate || 0);
        const commissionAmount = (orderAmount * commissionRate) / 100;
        const restaurantAmount = orderAmount - commissionAmount;

        await tx.commission.create({
          data: {
            orderId: payment.orderId,
            restaurantId: payment.order.restaurantId,
            orderAmount: payment.amount,
            commissionRate: payment.order.restaurant.commissionRate,
            commissionAmount: commissionAmount.toFixed(2),
            restaurantAmount: restaurantAmount.toFixed(2),
            status: "pending"
          }
        });
      });

      console.log("Payment successful for order:", payment.orderId);
      return res.redirect(
        `${process.env.NEXT_PUBLIC_APP_URL}/orders/${payment.orderId}?payment=success`
      );
    } catch (error) {
      console.error("Error processing payment:", error);
      
      // Rollback payment status
      await prisma.payment.update({
        where: { id: payment.id },
        data: { status: "failed", failureReason: "Processing error" }
      });

      return res.redirect(
        `${process.env.NEXT_PUBLIC_APP_URL}/payment/failed?reason=processing_error`
      );
    }
  } else {
    // Payment failed
    await prisma.payment.update({
      where: { id: payment.id },
      data: {
        status: "failed",
        failureReason: decodedResponse.message || code
      }
    });

    await prisma.order.update({
      where: { id: payment.orderId },
      data: { paymentStatus: "failed" }
    });

    console.log("Payment failed for transaction:", merchantTransactionId, "Reason:", decodedResponse.message);
    return res.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL}/payment/failed?reason=${encodeURIComponent(decodedResponse.message || code)}`
    );
  }
});

// 3. VERIFY PAYMENT STATUS
export const verifyPaymentStatus = asyncHandler(async (req, res) => {
  const { orderId } = req.body;
  const userId = req.user.id;

  if (!orderId) {
    throw new ApiError(400, "Order ID is required");
  }

  const payment = await prisma.payment.findFirst({
    where: { orderId: parseInt(orderId) },
    include: {
      order: { select: { userId: true } }
    }
  });

  if (!payment) {
    throw new ApiError(404, "Payment not found");
  }

  if (payment.order.userId !== userId) {
    throw new ApiError(403, "Unauthorized");
  }

  // Verify with PhonePe
  const verificationResult = await PaymentService.verifyPhonePePayment(
    payment.razorpayOrderId
  );

  // Update payment status if verification returns different status
  if (verificationResult.success && verificationResult.status !== payment.status) {
    await prisma.payment.update({
      where: { id: payment.id },
      data: {
        status: verificationResult.status,
        gatewayPaymentId: verificationResult.transactionId
      }
    });
  }

  res.status(200).json(
    new ApiResponse(200, {
      payment: {
        status: verificationResult.status || payment.status,
        amount: payment.amount,
        gatewayPaymentId: payment.gatewayPaymentId
      },
      verification: verificationResult
    }, "Payment status verified successfully")
  );
});

// 4. GET PAYMENT STATUS
export const getPaymentStatus = asyncHandler(async (req, res) => {
  const { orderId } = req.params;
  const userId = req.user.id;

  const payment = await prisma.payment.findFirst({
    where: { orderId: parseInt(orderId) },
    include: {
      order: { 
        select: { 
          userId: true, 
          totalAmount: true,
          paymentStatus: true
        } 
      }
    }
  });

  if (!payment) {
    throw new ApiError(404, "Payment not found");
  }

  if (payment.order.userId !== userId) {
    throw new ApiError(403, "Unauthorized");
  }

  res.status(200).json(
    new ApiResponse(200, {
      payment: {
        id: payment.id,
        status: payment.status,
        amount: payment.amount,
        paymentGateway: payment.paymentGateway,
        gatewayPaymentId: payment.gatewayPaymentId,
        createdAt: payment.createdAt
      }
    }, "Payment status fetched successfully")
  );
});