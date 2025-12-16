import crypto from "crypto";

export class PaymentService {
  static MERCHANT_ID = process.env.PHONEPE_MERCHANT_ID;
  static SALT_KEY = process.env.PHONEPE_SALT_KEY;
  static SALT_INDEX = process.env.PHONEPE_SALT_INDEX || "1";
  static BASE_URL = process.env.NODE_ENV === "production"
    ? "https://api.phonepe.com/apis/hermes"
    : "https://api-preprod.phonepe.com/apis/pg-sandbox";

  static async createPhonePeOrder({ orderId, amount, customerInfo }) {
    try {
      const merchantTransactionId = `TXN_${orderId}_${Date.now()}`;

      const payload = {
        merchantId: this.MERCHANT_ID,
        merchantTransactionId: merchantTransactionId,
        merchantUserId: customerInfo.customerId.toString(),
        amount: Math.round(amount * 100), // Convert to paise
        redirectUrl: `${process.env.NEXT_PUBLIC_API_URL}/client/payment/callback`,
        redirectMode: "POST",
        callbackUrl: `${process.env.NEXT_PUBLIC_API_URL}/client/payment/callback`,
        mobileNumber: customerInfo.customerPhone,
        paymentInstrument: {
          type: "PAY_PAGE",
        },
      };

      const base64Payload = Buffer.from(JSON.stringify(payload)).toString("base64");
      const checksum = this.generateChecksum(base64Payload);

      const response = await fetch(
        `${this.BASE_URL}/pg/v1/pay`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-VERIFY": checksum,
          },
          body: JSON.stringify({ request: base64Payload }),
        }
      );

      const data = await response.json();

      if (data.success) {
        return {
          success: true,
          orderId: merchantTransactionId,
          paymentUrl: data.data.instrumentResponse.redirectInfo.url,
          amount: amount,
        };
      } else {
        throw new Error(data.message || "Failed to create payment");
      }
    } catch (error) {
      console.error("Error creating PhonePe order:", error);
      throw new Error(error.message || "Failed to create payment order");
    }
  }

  static async verifyPhonePePayment(merchantTransactionId) {
    try {
      const checksum = this.generateChecksum(`/pg/v1/status/${this.MERCHANT_ID}/${merchantTransactionId}`);

      const response = await fetch(
        `${this.BASE_URL}/pg/v1/status/${this.MERCHANT_ID}/${merchantTransactionId}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            "X-VERIFY": checksum,
            "X-MERCHANT-ID": this.MERCHANT_ID,
          },
        }
      );

      const data = await response.json();

      if (data.success && data.code === "PAYMENT_SUCCESS") {
        return {
          success: true,
          data: data.data,
          transactionId: data.data.transactionId,
          amount: data.data.amount / 100, // Convert from paise to rupees
          status: "paid"
        };
      } else {
        return {
          success: false,
          data: data.data,
          message: data.message,
          status: "failed"
        };
      }
    } catch (error) {
      console.error("Error verifying PhonePe payment:", error);
      return { 
        success: false, 
        error: error.message,
        status: "failed"
      };
    }
  }

  static generateChecksum(payload) {
    const string = payload + this.SALT_KEY;
    const sha256 = crypto.createHash("sha256").update(string).digest("hex");
    return sha256 + "###" + this.SALT_INDEX;
  }

  static verifyPhonePeChecksum(base64Response, receivedChecksum) {
    try {
      const expectedChecksum = this.generateChecksum(base64Response);
      return expectedChecksum === receivedChecksum;
    } catch (error) {
      console.error("Error verifying checksum:", error);
      return false;
    }
  }
}
