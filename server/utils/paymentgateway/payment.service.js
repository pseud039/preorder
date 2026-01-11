import PaytmChecksum from "paytmchecksum";

export class PaymentService {
  static MERCHANT_ID = process.env.PAYTM_MERCHANT_ID;
  static MERCHANT_KEY = process.env.PAYTM_MERCHANT_KEY;
  static WEBSITE = process.env.PAYTM_WEBSITE || "WEBSTAGING";
  static INDUSTRY_TYPE = process.env.PAYTM_INDUSTRY_TYPE || "Retail";
  static CHANNEL_ID = process.env.PAYTM_CHANNEL_ID || "WEB";
  static BASE_URL = process.env.NODE_ENV === "production"
    ? "https://securegw.paytm.in"
    : "https://securegw-stage.paytm.in";

  static async createPaytmOrder({ orderId, amount, customerInfo }) {
    try {
      const paytmOrderId = `ORDER_${orderId}_${Date.now()}`;

      const paytmParams = {
        body: {
          requestType: "Payment",
          mid: this.MERCHANT_ID,
          websiteName: this.WEBSITE,
          orderId: paytmOrderId,
          callbackUrl: `${process.env.NEXT_PUBLIC_API_URL}/client/payment/callback`,
          txnAmount: {
            value: amount.toFixed(2),
            currency: "INR",
          },
          userInfo: {
            custId: customerInfo.customerId.toString(),
            email: customerInfo.customerEmail,
            mobile: customerInfo.customerPhone,
          },
        },
      };

      // Generate checksum for the body
      const checksum = await PaytmChecksum.generateSignature(
        JSON.stringify(paytmParams.body),
        this.MERCHANT_KEY
      );

      paytmParams.head = {
        signature: checksum,
      };

      // Initiate transaction to get txnToken
      const response = await fetch(
        `${this.BASE_URL}/theia/api/v1/initiateTransaction?mid=${this.MERCHANT_ID}&orderId=${paytmOrderId}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(paytmParams),
        }
      );

      const data = await response.json();

      if (data.body.resultInfo.resultStatus === "S") {
        return {
          success: true,
          orderId: paytmOrderId,
          txnToken: data.body.txnToken,
          amount: amount,
          mid: this.MERCHANT_ID,
          callbackUrl: `${process.env.NEXT_PUBLIC_API_URL}/client/payment/callback`,
        };
      } else {
        throw new Error(data.body.resultInfo.resultMsg || "Failed to create payment");
      }
    } catch (error) {
      console.error("Error creating Paytm order:", error);
      throw new Error(error.message || "Failed to create payment order");
    }
  }

  static async verifyPaytmPayment(paytmOrderId) {
    try {
      const paytmParams = {
        body: {
          mid: this.MERCHANT_ID,
          orderId: paytmOrderId,
        },
      };

      // Generate checksum
      const checksum = await PaytmChecksum.generateSignature(
        JSON.stringify(paytmParams.body),
        this.MERCHANT_KEY
      );

      paytmParams.head = {
        signature: checksum,
      };

      const response = await fetch(
        `${this.BASE_URL}/v3/order/status`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(paytmParams),
        }
      );

      const data = await response.json();

      if (data.body.resultInfo.resultStatus === "TXN_SUCCESS") {
        return {
          success: true,
          data: data.body,
          transactionId: data.body.txnId,
          amount: parseFloat(data.body.txnAmount),
          status: "paid"
        };
      } else if (data.body.resultInfo.resultStatus === "PENDING") {
        return {
          success: false,
          data: data.body,
          message: "Payment pending",
          status: "pending"
        };
      } else {
        return {
          success: false,
          data: data.body,
          message: data.body.resultInfo.resultMsg,
          status: "failed"
        };
      }
    } catch (error) {
      console.error("Error verifying Paytm payment:", error);
      return { 
        success: false, 
        error: error.message,
        status: "failed"
      };
    }
  }

  static async verifyPaytmChecksum(paytmParams) {
    try {
      const receivedChecksum = paytmParams.CHECKSUMHASH;
      delete paytmParams.CHECKSUMHASH;
      
      const isValid = await PaytmChecksum.verifySignature(
        paytmParams,
        this.MERCHANT_KEY,
        receivedChecksum
      );
      
      return isValid;
    } catch (error) {
      console.error("Error verifying checksum:", error);
      return false;
    }
  }

  static async initiateRefund({ orderId, txnId, refundAmount, refundId }) {
    try {
      const paytmParams = {
        body: {
          mid: this.MERCHANT_ID,
          txnType: "REFUND",
          orderId: orderId,
          txnId: txnId,
          refId: refundId || `REFUND_${orderId}_${Date.now()}`,
          refundAmount: refundAmount.toFixed(2),
        },
      };

      const checksum = await PaytmChecksum.generateSignature(
        JSON.stringify(paytmParams.body),
        this.MERCHANT_KEY
      );

      paytmParams.head = {
        signature: checksum,
      };

      const response = await fetch(
        `${this.BASE_URL}/refund/apply`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(paytmParams),
        }
      );

      const data = await response.json();

      if (data.body.resultInfo.resultStatus === "TXN_SUCCESS" || 
          data.body.resultInfo.resultStatus === "PENDING") {
        return {
          success: true,
          refundId: data.body.refundId,
          status: data.body.resultInfo.resultStatus,
        };
      } else {
        return {
          success: false,
          message: data.body.resultInfo.resultMsg,
        };
      }
    } catch (error) {
      console.error("Error initiating refund:", error);
      return {
        success: false,
        error: error.message,
      };
    }
  }
}

// import Razorpay from "razorpay";
// import crypto from "crypto";

// export class PaymentService {
//   static razorpayInstance = new Razorpay({
//     key_id: process.env.RAZORPAY_KEY_ID,
//     key_secret: process.env.RAZORPAY_KEY_SECRET,
//   });

//   static async createRazorpayOrder({ orderId, amount, customerInfo }) {
//     try {
//       const options = {
//         amount: Math.round(amount * 100), // Amount in paise
//         currency: "INR",
//         receipt: `order_${orderId}`,
//         notes: {
//           orderId: orderId.toString(),
//           customerId: customerInfo.customerId.toString(),
//           customerEmail: customerInfo.customerEmail,
//           customerPhone: customerInfo.customerPhone,
//         },
//       };

//       const razorpayOrder = await this.razorpayInstance.orders.create(options);

//       return {
//         success: true,
//         orderId: razorpayOrder.id,
//         amount: amount,
//         currency: razorpayOrder.currency,
//         receipt: razorpayOrder.receipt,
//       };
//     } catch (error) {
//       console.error("Error creating Razorpay order:", error);
//       throw new Error(error.message || "Failed to create payment order");
//     }
//   }

//   static async verifyRazorpayPayment({
//     razorpayOrderId,
//     razorpayPaymentId,
//     razorpaySignature,
//   }) {
//     try {
//       const sign = razorpayOrderId + "|" + razorpayPaymentId;
//       const expectedSign = crypto
//         .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
//         .update(sign.toString())
//         .digest("hex");

//       if (razorpaySignature === expectedSign) {
//         return {
//           success: true,
//           verified: true,
//           paymentId: razorpayPaymentId,
//         };
//       } else {
//         return {
//           success: false,
//           verified: false,
//           message: "Invalid signature",
//         };
//       }
//     } catch (error) {
//       console.error("Error verifying Razorpay payment:", error);
//       return {
//         success: false,
//         verified: false,
//         error: error.message,
//       };
//     }
//   }

//   static async fetchPaymentDetails(paymentId) {
//     try {
//       const payment = await this.razorpayInstance.payments.fetch(paymentId);
      
//       return {
//         success: true,
//         data: payment,
//         status: payment.status === "captured" ? "paid" : payment.status,
//       };
//     } catch (error) {
//       console.error("Error fetching payment details:", error);
//       return {
//         success: false,
//         error: error.message,
//         status: "failed",
//       };
//     }
//   }

//   static async initiateRefund({ paymentId, refundAmount, notes }) {
//     try {
//       const refund = await this.razorpayInstance.payments.refund(paymentId, {
//         amount: Math.round(refundAmount * 100), // Amount in paise
//         notes: notes || {},
//       });

//       return {
//         success: true,
//         refundId: refund.id,
//         status: refund.status,
//         amount: refund.amount / 100,
//       };
//     } catch (error) {
//       console.error("Error initiating refund:", error);
//       return {
//         success: false,
//         error: error.message,
//       };
//     }
//   }

//   static async capturePayment(paymentId, amount) {
//     try {
//       const payment = await this.razorpayInstance.payments.capture(
//         paymentId,
//         Math.round(amount * 100), // Amount in paise
//         "INR"
//       );

//       return {
//         success: true,
//         payment,
//         status: payment.status,
//       };
//     } catch (error) {
//       console.error("Error capturing payment:", error);
//       return {
//         success: false,
//         error: error.message,
//       };
//     }
//   }

//   static verifyWebhookSignature(webhookBody, webhookSignature) {
//     try {
//       const expectedSignature = crypto
//         .createHmac("sha256", process.env.RAZORPAY_WEBHOOK_SECRET || "")
//         .update(JSON.stringify(webhookBody))
//         .digest("hex");

//       return webhookSignature === expectedSignature;
//     } catch (error) {
//       console.error("Error verifying webhook signature:", error);
//       return false;
//     }
//   }
// }