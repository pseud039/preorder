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

 if (order.restaurantStatus !== "Accepted") {
    if (order.restaurantStatus === "Rejected") {
      throw new ApiError(400, "Cannot pay for a rejected order");
    }else if(order.restaurantStatus === "Updated"){
      throw new ApiError(400, "Order details have been updated. Please review your order before proceeding to payment.");
    } else if (order.restaurantStatus === "Cancelled") {
      throw new ApiError(400, "Cannot pay for a cancelled order");
    } else if (order.restaurantStatus === "Pending") {
      throw new ApiError(400, "Order is still pending restaurant approval. Please wait for confirmation.");
    } else {
      throw new ApiError(400, `Cannot initiate payment for order with status: ${order.restaurantStatus}`);
    }
  }

  // Check if payment already exists
  const existingPayment = await prisma.payment.findUnique({
    where: { orderId: order.id }
  });

  if (existingPayment && existingPayment.status === "paid") {
    throw new ApiError(400, "Payment already completed");
  }

  // Create Paytm payment order
  const paytmOrder = await PaymentService.createPaytmOrder({
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
          gatewayOrderId: paytmOrder.orderId,
          status: "pending",
          paymentGateway: "paytm"
        }
      })
    : await prisma.payment.create({
        data: {
          orderId: order.id,
          gatewayOrderId: paytmOrder.orderId,
          amount: order.totalAmount,
          status: "pending",
          paymentGateway: "paytm"
        }
      });

  // Update order with payment order ID
  await prisma.order.update({
    where: { id: order.id },
    data: { 
      paymentOrderId: paytmOrder.orderId,
      paymentExpiresAt: new Date(Date.now() + 10 * 60 * 1000) // 10 minutes
    }
  });

  res.status(200).json(
    new ApiResponse(200, {
      payment,
      paytmConfig: {
        orderId: paytmOrder.orderId,
        txnToken: paytmOrder.txnToken,
        amount: parseFloat(order.totalAmount),
        mid: paytmOrder.mid,
        callbackUrl: paytmOrder.callbackUrl,
        isProduction: process.env.NODE_ENV === "production"
      }
    }, "Payment order created successfully")
  );
});

// 2. PAYMENT CALLBACK (Paytm redirects here)
export const handlePaymentCallback = asyncHandler(async (req, res) => {
  const paytmParams = req.body;

  if (!paytmParams || !paytmParams.ORDERID) {
    console.error("No response in callback");
    return res.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL}/payment/failed?reason=no_response`
    );
  }

  const { ORDERID, TXNID, TXNAMOUNT, STATUS, RESPMSG } = paytmParams;

  console.log("Payment callback received:", { 
    orderId: ORDERID,
    txnId: TXNID,
    status: STATUS,
    amount: TXNAMOUNT
  });

  // Verify checksum
  const isValidChecksum = await PaymentService.verifyPaytmChecksum(paytmParams);

  if (!isValidChecksum) {
    console.error("Invalid checksum for transaction:", ORDERID);
    return res.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL}/payment/failed?reason=invalid_checksum`
    );
  }

  // Find payment
  const payment = await prisma.payment.findFirst({
    where: { gatewayOrderId: ORDERID },
    include: {
      order: {
        include: { 
          restaurant: { select: { commissionRate: true } }
        }
      }
    }
  });

  if (!payment) {
    console.error("Payment not found for transaction:", ORDERID);
    return res.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL}/payment/failed?reason=order_not_found`
    );
  }

  if (STATUS === "TXN_SUCCESS") {
    try {
      await prisma.$transaction(async (tx) => {
        // Update payment
        await tx.payment.update({
          where: { id: payment.id },
          data: {
            status: "paid",
            gatewayPaymentId: TXNID,
            gatewayResponse: paytmParams
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
        `${process.env.FRONTEND_URL}/order-history/${payment.orderId}?payment=success`
      );
    } catch (error) {
      console.error("Error processing payment:", error);
      
      // Rollback payment status
      await prisma.payment.update({
        where: { id: payment.id },
        data: { status: "failed", failureReason: "Processing error" }
      });

      return res.redirect(
        `${process.env.FRONTEND_URL}/payment/failed?reason=processing_error`
      );
    }
  } else {
    // Payment failed
    await prisma.payment.update({
      where: { id: payment.id },
      data: {
        status: "failed",
        failureReason: RESPMSG || STATUS,
        gatewayResponse: paytmParams
      }
    });

    await prisma.order.update({
      where: { id: payment.orderId },
      data: { paymentStatus: "failed" }
    });

    console.log("Payment failed for transaction:", ORDERID, "Reason:", RESPMSG);
    return res.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL}/payment/failed?reason=${encodeURIComponent(RESPMSG || STATUS)}`
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

  // Verify with Paytm
  const verificationResult = await PaymentService.verifyPaytmPayment(
    payment.gatewayOrderId
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
