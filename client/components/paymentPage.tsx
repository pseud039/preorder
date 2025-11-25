"use client";
import { useState, useEffect, Suspense, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Loader2,
  ShoppingBag,
  Clock,
  MapPin,
  CreditCard,
  CheckCircle,
  AlertCircle,
  Store,
  ArrowLeft,
} from "lucide-react";
import { toast } from "sonner";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";

interface RazorpayResponse {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
}

interface RazorpayOptions {
  key: string | undefined;
  amount: number;
  currency: string;
  name: string;
  description: string;
  order_id: string;
  handler: (response: RazorpayResponse) => Promise<void>;
  prefill: {
    name: string;
    email: string;
    contact: string;
  };
  theme: {
    color: string;
  };
  modal: {
    ondismiss: () => void;
  };
}

declare global {
  interface Window {
    Razorpay: new (options: RazorpayOptions) => {
      open: () => void;
    };
  }
}

interface OrderDetails {
  id: number;
  totalAmount: number;
  restaurantId: number;
  timeSlotId: number;
  notes?: string;
  razorpayOrderId?: string;
  restaurant?: {
    name: string;
    address: string;
  };
  timeSlot?: {
    slotStart: string;
    slotEnd: string;
  };
  orderItems?: Array<{
    menuItem: {
      name: string;
      price: number;
      isVeg?: boolean;
    };
    quantity: number;
    price: number;
  }>;
}

interface RazorpayOrder {
  id: string;
  amount: number;
  currency: string;
}

function PaymentPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const orderId = searchParams.get("orderId");

  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [orderDetails, setOrderDetails] = useState<OrderDetails | null>(null);
  const [razorpayOrder, setRazorpayOrder] = useState<RazorpayOrder | null>(
    null
  );
  const [error, setError] = useState("");
  const [razorpayLoaded, setRazorpayLoaded] = useState(false);

  useEffect(() => {
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    script.onload = () => setRazorpayLoaded(true);
    script.onerror = () => {
      setError("Failed to load payment gateway");
      toast.error("Failed to load payment gateway");
    };
    document.body.appendChild(script);

    return () => {
      document.body.removeChild(script);
    };
  }, []);

  const fetchOrderDetails = useCallback(async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("auth_token");

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/client/orders/${orderId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          credentials: "include",
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to fetch order");
      }

      setOrderDetails(data.data);

      if (data.data.razorpayOrderId) {
        setRazorpayOrder({
          id: data.data.razorpayOrderId,
          amount: data.data.totalAmount * 100,
          currency: "INR",
        });
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to load order details";
      console.error("Error fetching order:", err);
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [orderId]);

  useEffect(() => {
    if (orderId) {
      fetchOrderDetails();
    }
  }, [orderId, fetchOrderDetails]);

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
    });
  };

  const verifyPayment = async (response: RazorpayResponse) => {
    try {
      const token = localStorage.getItem("auth_token");

      const verifyResponse = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/client/verify-payment`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          credentials: "include",
          body: JSON.stringify({
            orderId: orderDetails?.id,
            razorpayOrderId: response.razorpay_order_id,
            razorpayPaymentId: response.razorpay_payment_id,
            razorpaySignature: response.razorpay_signature,
          }),
        }
      );

      const data = await verifyResponse.json();

      if (!verifyResponse.ok) {
        throw new Error(data.message || "Payment verification failed");
      }

      toast.success("Payment successful!");
      router.push(`/orders/${orderDetails?.id}?payment=success`);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Payment verification failed";
      console.error("Verification error:", err);
      toast.error(errorMessage);
      setProcessing(false);
    }
  };

  const handlePayment = async () => {
    if (!razorpayLoaded) {
      toast.error("Payment gateway not loaded. Please refresh the page.");
      return;
    }

    if (!razorpayOrder || !orderDetails) {
      toast.error("Order details not found");
      return;
    }

    setProcessing(true);

    try {
      const token = localStorage.getItem("auth_token");

      const userResponse = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/client/profile`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
          credentials: "include",
        }
      );

      const userData = await userResponse.json();
      const user = userData.data;

      const options: RazorpayOptions = {
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
        amount: razorpayOrder.amount,
        currency: razorpayOrder.currency,
        name: orderDetails.restaurant?.name || "Restaurant",
        description: `Order #${orderDetails.id}`,
        order_id: razorpayOrder.id,
        handler: async function (response: RazorpayResponse) {
          await verifyPayment(response);
        },
        prefill: {
          name: user.name || "",
          email: user.email || "",
          contact: user.phone || "",
        },
        theme: {
          color: "#f97316",
        },
        modal: {
          ondismiss: function () {
            setProcessing(false);
            toast.info("Payment cancelled");
          },
        },
      };

      const razorpay = new window.Razorpay(options);
      razorpay.open();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to initiate payment";
      console.error("Payment error:", err);
      toast.error(errorMessage);
      setProcessing(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-orange-50 to-white flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Loader2 className="w-12 h-12 text-orange-500 animate-spin mb-4" />
            <p className="text-gray-600 font-medium">
              Loading order details...
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error || !orderDetails || !razorpayOrder) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-red-50 to-white flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
              <AlertCircle className="w-8 h-8 text-red-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2 text-center">
              Unable to Process Payment
            </h2>
            <p className="text-gray-600 text-center mb-6">
              {error || "Order not found"}
            </p>
            <Button
              onClick={() => router.push("/cart")}
              className="w-full bg-orange-500 hover:bg-orange-600"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Go to Cart
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-orange-50 via-white to-gray-50 py-8 px-4">
      <div className="max-w-3xl mx-auto space-y-6">
        <Button
          variant="ghost"
          onClick={() => router.back()}
          className="mb-4 hover:bg-orange-50"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>

        <Card className="border-orange-200 shadow-lg flex ">
          <CardHeader className="text-orange-500 rounded-t-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div>
                  <CardTitle className="text-2xl">Complete Payment</CardTitle>
                  <CardDescription className="text-orange-500">
                    Order #{orderDetails.id}
                  </CardDescription>
                </div>
              </div>
              <Badge
                variant="secondary"
                className="bg-orange-20 text-orange border-orange-300"
              >
                Pending
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="">
            <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-xl p-6 text-center border border-orange-200">
              <p className="text-orange-700 text-sm font-medium mb-2">
                Amount to Pay
              </p>
              <p className="text-5xl font-bold text-orange-600">
                ₹{orderDetails.totalAmount}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ShoppingBag className="w-5 h-5 text-orange-500" />
              Order Details
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {orderDetails.restaurant && (
              <div className="flex items-start gap-3 p-4 bg-gray-50 rounded-lg">
                <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <Store className="w-5 h-5 text-orange-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-gray-900 truncate">
                    {orderDetails.restaurant.name}
                  </p>
                  <p className="text-sm text-gray-600 flex items-start gap-1">
                    <MapPin className="w-3 h-3 mt-0.5 flex-shrink-0" />
                    <span className="line-clamp-2">
                      {orderDetails.restaurant.address}
                    </span>
                  </p>
                </div>
              </div>
            )}

            {orderDetails.timeSlot && (
              <div className="flex items-start gap-3 p-4 bg-orange-50 rounded-lg border border-orange-200">
                <div className="w-10 h-10 bg-orange-500 rounded-full flex items-center justify-center flex-shrink-0">
                  <Clock className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="font-semibold text-gray-900">Pickup Time</p>
                  <p className="text-sm text-gray-600">
                    {formatDate(orderDetails.timeSlot.slotStart)}
                  </p>
                  <p className="text-sm font-medium text-orange-600">
                    {formatTime(orderDetails.timeSlot.slotStart)} -{" "}
                    {formatTime(orderDetails.timeSlot.slotEnd)}
                  </p>
                </div>
              </div>
            )}

            <Separator />

            {orderDetails.orderItems && orderDetails.orderItems.length > 0 && (
              <div>
                <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <ShoppingBag className="w-4 h-4 text-orange-500" />
                  Items ({orderDetails.orderItems.length})
                </h3>
                <div className="space-y-3">
                  {orderDetails.orderItems.map((item, index) => (
                    <div
                      key={index}
                      className="flex justify-between items-start p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                    >
                      <div className="flex items-start gap-3 flex-1">
                        <div className="w-8 h-8 bg-orange-100 rounded flex items-center justify-center flex-shrink-0 font-semibold text-orange-600 text-sm">
                          {item.quantity}×
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="font-medium text-gray-900 truncate">
                              {item.menuItem.name}
                            </p>
                            {item.menuItem.isVeg !== undefined && (
                              <span
                                className={`w-4 h-4 border-2 flex items-center justify-center ${
                                  item.menuItem.isVeg
                                    ? "border-green-600"
                                    : "border-red-600"
                                }`}
                              >
                                <span
                                  className={`w-2 h-2 rounded-full ${
                                    item.menuItem.isVeg
                                      ? "bg-green-600"
                                      : "bg-red-600"
                                  }`}
                                />
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-gray-500">
                            ₹{item.menuItem.price} each
                          </p>
                        </div>
                      </div>
                      <p className="font-semibold text-gray-900 ml-4">
                        ₹{item.price * item.quantity}
                      </p>
                    </div>
                  ))}
                </div>

                <Separator className="my-4" />

                <div className="flex justify-between items-center text-lg">
                  <span className="font-semibold text-gray-900">Total</span>
                  <span className="font-bold text-orange-600">
                    ₹{orderDetails.totalAmount}
                  </span>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="shadow-lg border-orange-200">
          <CardContent className="pt-6">
            <Button
              onClick={handlePayment}
              disabled={processing || !razorpayLoaded}
              className="w-full h-14 text-lg font-semibold bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 shadow-lg"
              size="lg"
            >
              {processing ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  Processing Payment...
                </>
              ) : !razorpayLoaded ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  Loading Gateway...
                </>
              ) : (
                <>
                  <CreditCard className="w-5 h-5 mr-2" />
                  Pay ₹{orderDetails.totalAmount}
                </>
              )}
            </Button>

            <Alert className="mt-4 border-green-200 bg-green-50">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-sm text-green-800">
                🔒 Your payment is secured with 256-bit SSL encryption
              </AlertDescription>
            </Alert>

            <p className="text-xs text-gray-500 text-center mt-3">
              By proceeding, you agree to our terms and conditions
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default function PaymentPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-gradient-to-b from-orange-50 to-white flex items-center justify-center">
          <Loader2 className="w-12 h-12 text-orange-500 animate-spin" />
        </div>
      }
    >
      <PaymentPageContent />
    </Suspense>
  );
}