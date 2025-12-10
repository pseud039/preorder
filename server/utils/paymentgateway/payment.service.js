import PaytmChecksum from "paytmchecksum";

export class PaymentService {
  static MID = process.env.PAYTM_MID;
  static MERCHANT_KEY = process.env.PAYTM_MERCHANT_KEY;
  static WEBSITE = process.env.PAYTM_WEBSITE || "WEBSTAGING";
  static BASE_URL = process.env.NODE_ENV === "production"
    ? "https://securegw.paytm.in"
    : "https://securegw-stage.paytm.in";

  static async createPaytmOrder({ orderId, amount, customerInfo }) {
    try {
      const paytmOrderId = `ORD_${orderId}_${Date.now()}`;

      const paytmParams = {
        body: {
          requestType: "Payment",
          mid: this.MID,
          websiteName: this.WEBSITE,
          orderId: paytmOrderId,
          callbackUrl: `${process.env.NEXT_PUBLIC_API_URL}/client/payment/callback`,
          txnAmount: {
            value: amount.toString(),
            currency: "INR",
          },
          userInfo: {
            custId: customerInfo.customerId,
            email: customerInfo.customerEmail,
            mobile: customerInfo.customerPhone,
          },
        },
      };

      const checksum = await PaytmChecksum.generateSignature(
        JSON.stringify(paytmParams.body),
        this.MERCHANT_KEY
      );

      paytmParams.head = { signature: checksum };

      const response = await fetch(
        `${this.BASE_URL}/theia/api/v1/initiateTransaction?mid=${this.MID}&orderId=${paytmOrderId}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(paytmParams)
        }
      );

      const data = await response.json();

      if (data.body.resultInfo.resultStatus === "S") {
        return {
          success: true,
          orderId: paytmOrderId,
          txnToken: data.body.txnToken,
          amount: amount,
        };
      } else {
        throw new Error(data.body.resultInfo.resultMsg || "Failed to create payment");
      }
    } catch (error) {
      console.error("Error creating Paytm order:", error);
      throw new Error(error.message || "Failed to create payment order");
    }
  }

  static async verifyPaytmPayment(orderId) {
    try {
      const paytmParams = {
        body: {
          mid: this.MID,
          orderId: orderId,
        },
      };

      const checksum = await PaytmChecksum.generateSignature(
        JSON.stringify(paytmParams.body),
        this.MERCHANT_KEY
      );

      paytmParams.head = { signature: checksum };

      const response = await fetch(
        `${this.BASE_URL}/v3/order/status`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(paytmParams)
        }
      );

      const data = await response.json();
      const resultInfo = data.body.resultInfo;

      if (resultInfo.resultStatus === "TXN_SUCCESS") {
        return {
          success: true,
          data: data.body,
          transactionId: data.body.txnId,
          amount: data.body.txnAmount,
          status: "paid"
        };
      } else {
        return {
          success: false,
          data: data.body,
          message: resultInfo.resultMsg,
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

  static verifyPaytmChecksum(params, checksum) {
    try {
      // Remove checksum from params before verification
      const paramsWithoutChecksum = { ...params };
      delete paramsWithoutChecksum.CHECKSUMHASH;
      
      return PaytmChecksum.verifySignature(
        paramsWithoutChecksum, 
        this.MERCHANT_KEY, 
        checksum
      );
    } catch (error) {
      console.error("Error verifying checksum:", error);
      return false;
    }
  }
}
