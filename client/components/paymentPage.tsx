"use client";
import { useState, useEffect, useCallback } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import {
  Loader2,
  CreditCard,
  ArrowLeft,
  AlertCircle,
  Store,
  MapPin,
  Clock,
  CheckCircle,
  Lock,
} from "lucide-react";
import { toast } from "sonner";
import Script from "next/script";

interface MenuItem {
  name: string;
  price: number;
  isVeg?: boolean;
  imageUrl?: string;
}

interface OrderItem {
  menuItem: MenuItem;
  quantity: number;
  price: number;
}

interface Restaurant {
  id: number;
  name: string;
  address?: string;
  contactNumber?: string;
}

interface TimeSlot {
  id: number;
  startTime?: string;
  endTime?: string;
  slotStart?: string;
  slotEnd?: string;
  dayOfWeek?: number;
}

interface PriceBreakdown {
  itemsTotal: number;
  taxAmount: number;
  taxLabel: string;
  platformFeeAmount: number;
  platformFeeLabel: string;
  grandTotal: number;
}

interface OrderDetails {
  id: number;
  totalAmount: number;
  subtotal?: number;
  tax?: number;
  taxPercentage?: number;
  platformFee?: number;
  priceBreakdown?: PriceBreakdown;
  restaurantId: number;
  timeSlotId?: number;
  notes?: string;
  restaurant?: Restaurant;
  timeSlot?: TimeSlot;
  orderItems?: OrderItem[];
  restaurantStatus?: string;
  estimatedWaitingTime?: number;
}

interface PaytmConfig {
  orderId: string;
  txnToken: string;
  amount: number;
  mid: string;
  environment: "PROD" | "STAGING";
}

const DAY_NAMES = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];

function formatSlotTime(timeStr: string): string {
  // handles "HH:mm" plain strings
  if (!timeStr) return "";
  if (timeStr.includes("T") || timeStr.includes("-")) {
    const d = new Date(timeStr);
    return d.toLocaleTimeString("en-IN", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  }
  const [h, m] = timeStr.split(":").map(Number);
  const d = new Date();
  d.setHours(h, m, 0, 0);
  return d.toLocaleTimeString("en-IN", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

function formatSlotDay(dayOfWeek?: number): string {
  if (dayOfWeek === undefined) return "";
  return DAY_NAMES[dayOfWeek] ?? "";
}

export default function PaymentPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const orderId = searchParams.get("orderId");

  const [loading, setLoading] = useState<boolean>(true);
  const [processing, setProcessing] = useState<boolean>(false);
  const [orderDetails, setOrderDetails] = useState<OrderDetails | null>(null);
  const [priceBreakdown, setPriceBreakdown] = useState<PriceBreakdown | null>(
    null,
  );
  const [error, setError] = useState<string>("");
  const [scriptLoaded, setScriptLoaded] = useState(false);

  const fetchOrderDetails = useCallback(async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("accessToken");

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/client/orders/${orderId}`,
        { headers: { Authorization: `Bearer ${token}` } },
      );

      const data = await response.json();
      if (!response.ok)
        throw new Error(data.message || "Failed to fetch order");

      const order = data.data?.order || data.data;
      const breakdown =
        data.data?.priceBreakdown || order.priceBreakdown || null;

      setOrderDetails(order);
      if (breakdown) setPriceBreakdown(breakdown);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to load order";
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  }, [orderId]);

  useEffect(() => {
    if (orderId) fetchOrderDetails();
    else {
      setError("Order ID not found");
      setLoading(false);
    }
  }, [orderId, fetchOrderDetails]);

  const grandTotal = priceBreakdown?.grandTotal ?? orderDetails?.totalAmount;

  const initiatePayment = async (): Promise<void> => {
    if (!scriptLoaded || !window.Paytm?.CheckoutJS) {
      toast.error("Payment gateway is still loading, please wait.");
      return;
    }
    if (!orderDetails?.id) {
      toast.error("Order details not found");
      return;
    }

    try {
      setProcessing(true);
      const token = localStorage.getItem("accessToken");

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/client/payment/create-order`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ orderId: orderDetails.id }),
        },
      );

      const data = await response.json();
      if (!response.ok)
        throw new Error(data.message || "Failed to create payment");

      const paytmConfig: PaytmConfig = data.data.paytmConfig;

      window.Paytm.CheckoutJS.init({
        data: {
          orderId: paytmConfig.orderId,
          amount: paytmConfig.amount,
          tokenType: "TXN_TOKEN",
          token: paytmConfig.txnToken,
        },
        handler: {
          transactionStatus: function (paymentData: any) {
            if (paymentData.STATUS === "TXN_SUCCESS") {
              toast.success("Payment successful!");
              router.push(`/order-history/${orderDetails.id}`);
            } else {
              toast.error("Payment failed. Please try again.");
              setProcessing(false);
            }
          },
          notifyMerchant: function (eventName: string, data: any) {
            if (eventName === "APP_CLOSED") {
              toast.error("Payment cancelled.");
              setProcessing(false);
            }
            if (eventName === "SESSION_EXPIRED") {
              toast.error("Payment session expired. Please try again.");
              setProcessing(false);
            }
          },
        },
      });

      window.Paytm.CheckoutJS.invoke();
    } catch (err) {
      const msg =
        err instanceof Error ? err.message : "Failed to initiate payment";
      toast.error(msg);
      setProcessing(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <Loader2 className="w-10 h-10 text-orange-500 animate-spin mx-auto mb-3" />
          <p className="text-sm text-gray-500">Loading order details...</p>
        </div>
      </div>
    );
  }

  if (error || !orderDetails) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <div className="max-w-sm w-full bg-white rounded-xl border border-gray-200 p-8 text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-lg font-semibold text-gray-900 mb-2">
            Unable to load order
          </h2>
          <p className="text-sm text-gray-500 mb-6">
            {error || "Order not found"}
          </p>
          <button
            onClick={() => router.back()}
            className="w-full bg-orange-500 text-white py-2.5 rounded-lg text-sm font-medium hover:bg-orange-600 flex items-center justify-center gap-2 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Go back
          </button>
        </div>
      </div>
    );
  }

  const slot = orderDetails.timeSlot;
  const startTime = slot?.startTime ?? slot?.slotStart ?? "";
  const endTime = slot?.endTime ?? slot?.slotEnd ?? "";

  return (
    <>
      <Script
        src={`${process.env.NODE_ENV === "production" ? "https://secure.paytmpayments.com" : "https://securestaging.paytmpayments.com"}/merchantpgpui/checkoutjs/merchants/${process.env.NEXT_PUBLIC_PAYTM_MERCHANT_ID}.js`}
        strategy="afterInteractive"
        onLoad={() => setScriptLoaded(true)}
      />

      <div className="min-h-screen bg-gray-50 py-8 px-4">
        <div className="max-w-5xl mx-auto pt-5">
          {/* Back button */}
          <button
            onClick={() => router.back()}
            className="mb-6 flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </button>

          <div className="grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-5">
            {/* LEFT — Review info */}
            <div className="space-y-4">
              <div>
                <h1 className="text-xl font-semibold text-gray-900">
                  Complete your payment
                </h1>
                <p className="text-sm text-gray-500 mt-1">
                  Review the details below before paying.
                </p>
              </div>

              <div className="bg-white rounded-xl border border-gray-200 divide-y divide-gray-100">
                {/* Restaurant */}
                {orderDetails.restaurant && (
                  <div className="flex items-start gap-3 p-4">
                    <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center flex-shrink-0">
                      <Store className="w-4 h-4 text-gray-500" />
                    </div>
                    <div>
                      <p className="text-xs text-gray-400 uppercase tracking-wide mb-0.5">
                        Restaurant
                      </p>
                      <p className="text-sm font-medium text-gray-900">
                        {orderDetails.restaurant.name}
                      </p>
                      {orderDetails.restaurant.address && (
                        <p className="text-xs text-gray-500 flex items-center gap-1 mt-0.5">
                          <MapPin className="w-3 h-3 flex-shrink-0" />
                          {orderDetails.restaurant.address}
                        </p>
                      )}
                    </div>
                  </div>
                )}

                {/* Pickup slot */}
                {slot && (
                  <div className="flex items-start gap-3 p-4">
                    <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center flex-shrink-0">
                      <Clock className="w-4 h-4 text-gray-500" />
                    </div>
                    <div>
                      <p className="text-xs text-gray-400 uppercase tracking-wide mb-0.5">
                        Pickup slot
                      </p>
                      <p className="text-sm font-medium text-gray-900">
                        {formatSlotDay(slot.dayOfWeek)}
                        {slot.dayOfWeek !== undefined ? ", " : ""}
                        {formatSlotTime(startTime)}-{formatSlotTime(endTime)}
                      </p>
                      {orderDetails.estimatedWaitingTime && (
                        <p className="text-xs text-gray-500 mt-0.5">
                          Est. ready in ~{orderDetails.estimatedWaitingTime} min
                        </p>
                      )}
                    </div>
                  </div>
                )}

                {/* Order status */}
                <div className="flex items-start gap-3 p-4">
                  <div className="w-8 h-8 rounded-lg bg-green-50 flex items-center justify-center flex-shrink-0">
                    <CheckCircle className="w-4 h-4 text-green-600" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-400 uppercase tracking-wide mb-0.5">
                      Order status
                    </p>
                    <p className="text-sm font-medium text-gray-900">
                      {orderDetails.restaurantStatus ?? "Accepted"} by
                      restaurant
                    </p>
                    <p className="text-xs text-gray-500 mt-0.5">
                      Order #{orderDetails.id}
                    </p>
                  </div>
                </div>

                {/* Payment method */}
                <div className=" md:flex items-start gap-3 p-4 hidden ">
                  <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center flex-shrink-0">
                    <CreditCard className="w-4 h-4 text-gray-500" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-400 uppercase tracking-wide mb-0.5">
                      Payment via
                    </p>
                    <p className="text-sm font-medium text-gray-900">Paytm</p>
                    <p className="text-xs text-gray-500 mt-0.5">
                      UPI · Cards · Netbanking · Wallets
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* RIGHT — Order summary + pay */}
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden self-start">
              {/* Header */}
              <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
                <span className="text-sm font-medium text-gray-900">
                  Order summary
                </span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-green-50 text-green-700 border border-green-100">
                  {orderDetails.restaurantStatus ?? "Accepted"}
                </span>
              </div>

              {/* Items */}
              {orderDetails.orderItems &&
                orderDetails.orderItems.length > 0 && (
                  <div className="divide-y divide-gray-50">
                    {orderDetails.orderItems.map((item, index) => (
                      <div
                        key={index}
                        className="flex items-center gap-3 px-4 py-3"
                      >
                        {item.menuItem.imageUrl ? (
                          <img
                            src={item.menuItem.imageUrl}
                            alt={item.menuItem.name}
                            className="w-10 h-10 rounded-lg object-cover flex-shrink-0 bg-gray-100"
                          />
                        ) : (
                          <div className="w-10 h-10 rounded-lg bg-gray-100 flex-shrink-0" />
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 truncate flex items-center gap-1.5">
                            {/* {item.menuItem.isVeg !== undefined && (
                            <span
                              className={`inline-block w-2 h-2 rounded-full flex-shrink-0 ${
                                item.menuItem.isVeg ? "bg-green-500" : "bg-red-500"
                              }`}
                            />
                          )} */}
                            {item.menuItem.name}
                          </p>
                          <p className="text-xs text-gray-400 mt-0.5">
                            ₹{item.menuItem.price} × {item.quantity}
                          </p>
                        </div>
                        <p className="text-sm font-medium text-gray-900 ml-2">
                          ₹{Number(item.price) * item.quantity}
                        </p>
                      </div>
                    ))}
                  </div>
                )}

              {/* Price breakdown */}
              <div className="px-4 py-3 border-t border-gray-100 space-y-1.5">
                <div className="flex justify-between text-xs text-gray-500">
                  <span>Subtotal</span>
                  <span>
                    ₹
                    {priceBreakdown?.itemsTotal ??
                      orderDetails.subtotal ??
                      orderDetails.totalAmount}
                  </span>
                </div>
                <div className="flex justify-between text-xs text-gray-500">
                  <span>
                    {priceBreakdown?.taxLabel ??
                      `GST (${orderDetails.taxPercentage ?? 5}%)`}
                  </span>
                  <span>
                    ₹{priceBreakdown?.taxAmount ?? orderDetails.tax ?? 0}
                  </span>
                </div>
                <div className="flex justify-between text-xs text-gray-500">
                  <span>
                    {priceBreakdown?.platformFeeLabel ?? "Platform fee"}
                  </span>
                  <span>
                    ₹
                    {priceBreakdown?.platformFeeAmount ??
                      orderDetails.platformFee ??
                      0}
                  </span>
                </div>
              </div>

              {/* Total */}
              <div className="flex justify-between items-center px-4 py-3 border-t border-gray-200">
                <span className="text-sm font-medium text-gray-900">Total</span>
                <span className="text-base font-semibold text-orange-600">
                  ₹{grandTotal}
                </span>
              </div>

              {/* Pay button */}
              <div className="px-4 pb-4 pt-1">
                <button
                  onClick={initiatePayment}
                  disabled={processing || !scriptLoaded}
                  className="w-full bg-orange-500 hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed text-white py-3 rounded-lg text-sm font-medium flex items-center justify-center gap-2 transition-colors"
                >
                  {processing ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Redirecting to Paytm...
                    </>
                  ) : !scriptLoaded ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Setting up payment...
                    </>
                  ) : (
                    <>
                      <CreditCard className="w-4 h-4" />
                      Pay ₹{grandTotal} with Paytm
                    </>
                  )}
                </button>
                <p className="flex items-center justify-center gap-1 text-xs text-gray-400 mt-2">
                  <Lock className="w-3 h-3" />
                  Secured by Paytm · 256-bit encryption
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
