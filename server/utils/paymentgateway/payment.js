import { prisma } from '../../lib/prisma.js';
import Razorpay from 'razorpay';
import crypto from 'crypto';
import { asyncHandler } from '../errorHandler.js';
import { ApiResponse } from '../ApiResponse.js';
import { ApiError } from '../ApiError.js';

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

const verifyPayment = asyncHandler(async (req, res) => {
  try {
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
    } = req.body;

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      throw new ApiError(400, 'Missing payment details');
    }

    // Verify signature
    const body = razorpay_order_id + '|' + razorpay_payment_id;
    const expectedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(body.toString())
      .digest('hex');

    const isValidSignature = expectedSignature === razorpay_signature;

    if (!isValidSignature) {
      // Mark payment as failed
      await prisma.$transaction(async (tx) => {
        const order = await tx.order.findFirst({
          where: { razorpayOrderId: razorpay_order_id },
        });

        if (order) {
          await tx.order.update({
            where: { id: order.id },
            data: { paymentStatus: 'failed' },
          });

          await tx.payment.update({
            where: { orderId: order.id },
            data: {
              status: 'failed',
              failureReason: 'Invalid signature',
            },
          });
        }
      });

    throw new ApiError(400, 'Invalid payment signature');
    }

    const result = await prisma.$transaction(async (tx) => {
        const order = await tx.order.findFirst({
        where: { razorpayOrderId: razorpay_order_id },
        include: {
          payment: true,
          orderItems: {
            include: { menuItem: true },
          },
          restaurant: true,
        },
      });

      if (!order) {
        throw new ApiError(404, 'Order not found');
      }

      // Update order payment status
      const updatedOrder = await tx.order.update({
        where: { id: order.id },
        data: { paymentStatus: 'paid' },
        include: {
          orderItems: {
            include: { menuItem: true },
          },
          restaurant: true,
          timeSlot: true,
        },
      });

      await tx.payment.update({
        where: { orderId: order.id },
        data: {
          status: 'paid',
          razorpayPaymentId: razorpay_payment_id,
          razorpaySignature: razorpay_signature,
        },
      });

      return updatedOrder;
    });

    res.json(new ApiResponse(200, 'Payment verified successfully', result));
  } catch (error) {
    console.error('Payment verification error:', error);
    throw new ApiError(500, 'Payment verification failed');
  }
});

// const handleWebhook =asyncHandler(async (req, res) => {
//   try {
//     // Verify webhook signature
//     const webhookSignature = req.headers['x-razorpay-signature'];
//     const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;

//     if (!webhookSignature || !webhookSecret) {
//       throw new ApiError(400, 'Missing webhook signature or secret');
//     }

//     const body = JSON.stringify(req.body);
//     const expectedSignature = crypto
//       .createHmac('sha256', webhookSecret)
//       .update(body)
//       .digest('hex');

//     if (expectedSignature !== webhookSignature) {
//       throw new ApiError(400, 'Invalid webhook signature');
//     }

//     const event = req.body.event;
//     const payload = req.body.payload;

//     console.log('Webhook received:', event);

//     switch (event) {
//       case 'payment.authorized':
//       case 'payment.captured':
//         await handlePaymentSuccess(payload.payment.entity);
//         break;

//       case 'payment.failed':
//         await handlePaymentFailure(payload.payment.entity);
//         break;

//       case 'order.paid':
//         await handleOrderPaid(payload.order.entity);
//         break;

//       default:
//         console.log('Unhandled webhook event:', event);
//     }

//     res.json(new ApiResponse(200, 'Webhook processed successfully'));
//   } catch (error) {
//     console.error('Webhook error:', error);
//    throw new ApiError(500, 'Webhook processing failed');
//   }
// });

// Helper: Handle successful payment

async function handlePaymentSuccess(paymentEntity) {
  try {
    const razorpayOrderId = paymentEntity.order_id;
    const razorpayPaymentId = paymentEntity.id;

    await prisma.$transaction(async (tx) => {
      const order = await tx.order.findFirst({
        where: { razorpayOrderId },
      });

      if (order && order.paymentStatus !== 'paid') {
        await tx.order.update({
          where: { id: order.id },
          data: { paymentStatus: 'paid' },
        });

        await tx.payment.update({
          where: { orderId: order.id },
          data: {
            status: 'paid',
            razorpayPaymentId,
          },
        });

        console.log(`Order ${order.id} marked as paid`);
      }
    });
  } catch (error) {
    console.error('Handle payment success error:', error);
  }
}

// Helper: Handle failed payment
async function handlePaymentFailure(paymentEntity) {
  try {
    const razorpayOrderId = paymentEntity.order_id;
    const failureReason = paymentEntity.error_description || 'Payment failed';

    await prisma.$transaction(async (tx) => {
      const order = await tx.order.findFirst({
        where: { razorpayOrderId },
      });

      if (order) {
        await tx.order.update({
          where: { id: order.id },
          data: { paymentStatus: 'failed' },
        });

        await tx.payment.update({
          where: { orderId: order.id },
          data: {
            status: 'failed',
            failureReason,
          },
        });

        console.log(`Order ${order.id} marked as failed`);
      }
    });
  } catch (error) {
    console.error('Handle payment failure error:', error);
  }
}

// Helper: Handle order paid event
async function handleOrderPaid(orderEntity) {
  try {
    const razorpayOrderId = orderEntity.id;

    await prisma.$transaction(async (tx) => {
      const order = await tx.order.findFirst({
        where: { razorpayOrderId },
      });

      if (order && order.paymentStatus !== 'paid') {
        await tx.order.update({
          where: { id: order.id },
          data: { paymentStatus: 'paid' },
        });

        await tx.payment.update({
          where: { orderId: order.id },
          data: { status: 'paid' },
        });

        console.log(`Order ${order.id} marked as paid via order.paid event`);
      }
    });
  } catch (error) {
    console.error('Handle order paid error:', error);
  }
}

const getPaymentStatus = asyncHandler(async (req, res) => {
  try {
    const { orderId } = req.params;
    const userId = req.user.id;

    const order = await prisma.order.findFirst({
      where: {
        id: parseInt(orderId),
        userId,
      },
      include: {
        payment: true,
      },
    });

    if (!order) {
      throw new ApiError(404, 'Order not found');
    }

    res.json(new ApiResponse(200, 'Payment status fetched successfully', {
      orderId: order.id,
      paymentStatus: order.paymentStatus,
      paymentDetails: order.payment,
    }));
  } catch (error) {
    console.error('Get payment status error:', error);
    throw new ApiError(500, 'Failed to get payment status');
    }
});

const retryPayment = asyncHandler(async (req, res) => {
  try {
    const { orderId } = req.params;
    const userId = req.user.id;

    const order = await prisma.order.findFirst({
      where: {
        id: parseInt(orderId),
        userId,
      },
      include: {
        payment: true,
      },
    });

    if (!order) {
     throw new ApiError(404, 'Order not found');
    }

    if (order.paymentStatus === 'paid') {
     throw new ApiError(400, 'Order is already paid');
    }

    // Create new Razorpay order
    const razorpayOrder = await razorpay.orders.create({
      amount: Math.round(Number(order.totalAmount) * 100),
      currency: 'INR',
      receipt: `retry_${order.id}_${Date.now()}`,
      notes: {
        orderId: order.id.toString(),
        retry: 'true',
      },
    });

    // Update order with new Razorpay order ID
    await prisma.order.update({
      where: { id: order.id },
      data: {
        razorpayOrderId: razorpayOrder.id,
        paymentStatus: 'pending',
      },
    });

    res.json(new ApiResponse(200, 'Payment retry initiated', {
      razorpayOrderId: razorpayOrder.id,
      amount: razorpayOrder.amount,
      currency: razorpayOrder.currency,
    }));
  } catch (error) {
    console.error('Retry payment error:', error);
    throw new ApiError(500, 'Failed to retry payment');
  }
});

export {
  verifyPayment,
  getPaymentStatus,
  retryPayment,
};
