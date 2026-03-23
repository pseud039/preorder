"use client";
import { useState, useEffect, useCallback } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Loader2, CreditCard, ArrowLeft, AlertCircle, ShoppingBag, Store, MapPin, Clock } from "lucide-react";
import { toast } from "sonner";

interface MenuItem {
  name: string;
  price: number;
  isVeg?: boolean;
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
}

interface TimeSlot {
  slotStart: string;
  slotEnd: string;
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
}

interface PaytmConfig {
  orderId: string;
  txnToken: string;
  amount: number;
  mid: string;
  environment: "PROD" | "STAGING";
}

export default function PaymentPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const orderId = searchParams.get('orderId');

  const [loading, setLoading] = useState<boolean>(true);
  const [processing, setProcessing] = useState<boolean>(false);
  const [orderDetails, setOrderDetails] = useState<OrderDetails | null>(null);
  const [error, setError] = useState<string>("");

  const fetchOrderDetails = useCallback(async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("accessToken");

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/client/orders/${orderId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to fetch order");
      }

      // Handle nested order structure
      const order = data.data?.order || data.data;
      console.log("Fetched order:", order);
      setOrderDetails(order);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to load order";
      console.error("Error:", err);
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [orderId]);

  useEffect(() => {
    if (orderId) {
      fetchOrderDetails();
    } else {
      setError("Order ID not found");
      setLoading(false);
    }
  }, [orderId, fetchOrderDetails]);

  const formatTime = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  };

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
    });
  };

  const initiatePayment = async (): Promise<void> => {
    if (!orderDetails?.id) {
      toast.error("Order details not found");
      return;
    }

    try {
      setProcessing(true);
      const token = localStorage.getItem("accessToken");

      console.log("Initiating payment for order:", orderDetails.id);

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/client/payment/create-order`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ orderId: orderDetails.id }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to create payment");
      }

      const paytmConfig: PaytmConfig = data.data.paytmConfig;
      
      // Create and submit form dynamically
      const form = document.createElement('form');
      form.method = 'POST';
      form.action = `${
        paytmConfig.environment === "PROD"
          ? "https://securegw.paytm.in"
          : "https://securegw-stage.paytm.in"
      }/theia/api/v1/showPaymentPage?mid=${paytmConfig.mid}&orderId=${paytmConfig.orderId}`;

      const fields: Record<string, string> = {
        mid: paytmConfig.mid,
        orderId: paytmConfig.orderId,
        txnToken: paytmConfig.txnToken
      };

      Object.keys(fields).forEach(key => {
        const input = document.createElement('input');
        input.type = 'hidden';
        input.name = key;
        input.value = fields[key];
        form.appendChild(input);
      });

      document.body.appendChild(form);
      form.submit();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to initiate payment";
      console.error("Payment error:", err);
      setError(errorMessage);
      toast.error(errorMessage);
      setProcessing(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-orange-50 to-white">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-orange-500 animate-spin mx-auto mb-4" />
          <p className="text-gray-600 font-medium">Loading order details...</p>
        </div>
      </div>
    );
  }

  if (error || !orderDetails) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-red-50 to-white p-4">
        <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Unable to Process Payment
          </h2>
          <p className="text-gray-600 mb-6">{error || "Order not found"}</p>
          <button
            onClick={() => router.back()}
            className="w-full bg-orange-500 text-white py-3 rounded-lg hover:bg-orange-600 flex items-center justify-center gap-2 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-orange-50 via-white to-gray-50 py-8 px-4">
      <div className="max-w-3xl mx-auto space-y-6">
        <button
          onClick={() => router.back()}
          className="mb-4 flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </button>

        {/* Payment Amount Card */}
        <div className="bg-white rounded-lg shadow-lg overflow-hidden border border-orange-200">
          <div className="bg-primary text-center p-3 text-white">
            <p className="text-orange-100 text-xl font-semibold">Order #{orderDetails.id}</p>
          </div>
          <div className="p-6">
            <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-xl p-6 text-center border border-orange-200">
              <p className="text-orange-700 text-sm font-medium mb-2">
                Amount to Pay
              </p>
              <p className="text-5xl font-bold text-primary">
                ₹{(orderDetails.priceBreakdown?.grandTotal ?? orderDetails.totalAmount)}
              </p>
            </div>
          </div>
        </div>

        {/* Order Details Card */}
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
            <ShoppingBag className="w-5 h-5 text-orange-500" />
            Order Details
          </h2>

          {/* Restaurant Info */}
          {orderDetails.restaurant && (
            <div className="flex items-start gap-3 p-4 bg-gray-50 rounded-lg mb-4">
              <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center flex-shrink-0">
                <Store className="w-5 h-5 text-orange-600" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-gray-900 truncate">
                  {orderDetails.restaurant.name}
                </p>
                {orderDetails.restaurant.address && (
                  <p className="text-sm text-gray-600 flex items-start gap-1 mt-1">
                    <MapPin className="w-3 h-3 mt-0.5 flex-shrink-0" />
                    <span className="line-clamp-2">
                      {orderDetails.restaurant.address}
                    </span>
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Time Slot */}
          {orderDetails.timeSlot && (
            <div className="flex items-start gap-3 p-4 bg-orange-50 rounded-lg border border-orange-200 mb-4">
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

          {/* Order Items */}
          {orderDetails.orderItems && orderDetails.orderItems.length > 0 && (
            <div>
              <h3 className="font-semibold text-gray-900 mb-3">
                Items ({orderDetails.orderItems.length})
              </h3>
              <div className="space-y-2 mb-4">
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

              <div className="border-t pt-4 space-y-2">
                <div className="flex justify-between items-center text-gray-600">
                  <span>Subtotal</span>
                  <span>
                    ₹{(orderDetails.priceBreakdown?.itemsTotal ?? orderDetails.subtotal ?? orderDetails.totalAmount)}
                  </span>
                </div>
                <div className="flex justify-between items-center text-gray-600">
                  <span>{orderDetails.priceBreakdown?.taxLabel ?? `GST (${orderDetails.taxPercentage ?? 5}%)`}</span>
                  <span>
                    ₹{(orderDetails.priceBreakdown?.taxAmount ?? orderDetails.tax ?? 0)}
                  </span>
                </div>
                <div className="flex justify-between items-center text-gray-600">
                  <span>{orderDetails.priceBreakdown?.platformFeeLabel ?? "Platform Fee"}</span>
                  <span>
                    ₹{(orderDetails.priceBreakdown?.platformFeeAmount ?? orderDetails.platformFee ?? 0)}
                  </span>
                </div>
                <div className="flex justify-between items-center text-lg pt-2 border-t">
                  <span className="font-semibold text-gray-900">Total</span>
                  <span className="font-bold text-orange-600">
                    ₹{(orderDetails.priceBreakdown?.grandTotal ?? orderDetails.totalAmount)}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Payment Button Card */}
        <div className="bg-white rounded-lg shadow-lg p-6 border border-orange-200">
          <button
            onClick={initiatePayment}
            disabled={processing}
            className="w-full bg-primary text-white py-4 rounded-lg font-semibold text-lg flex items-center justify-center gap-2 hover:from-orange-600 hover:to-orange-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg hover:shadow-xl"
          >
            {processing ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Redirecting to Paytm...
              </>
            ) : (
              <>
                <CreditCard className="w-5 h-5" />
                Pay ₹{(orderDetails.priceBreakdown?.grandTotal ?? orderDetails.totalAmount)} with Paytm
              </>
            )}
          </button>
          <p className="text-xs text-gray-500 text-center mt-3">
            Secured by Paytm Payment Gateway
          </p>
        </div>
      </div>
    </div>
  );
}

// "use client";
// import { useState, useEffect, useCallback } from "react";
// import { useSearchParams, useRouter } from "next/navigation";
// import { Loader2, CreditCard, ArrowLeft, AlertCircle, ShoppingBag, Store, MapPin, Clock } from "lucide-react";
// import { toast } from "sonner";
// import { fetchWithAuth } from "@/lib/auth";

// interface MenuItem {
//   name: string;
//   price: number;
//   isVeg?: boolean;
// }

// interface OrderItem {
//   menuItem: MenuItem;
//   quantity: number;
//   price: number;
// }

// interface Restaurant {
//   id: number;
//   name: string;
//   address?: string;
// }

// interface TimeSlot {
//   slotStart: string;
//   slotEnd: string;
// }

// interface OrderDetails {
//   id: number;
//   totalAmount: number;
//   restaurantId: number;
//   timeSlotId?: number;
//   notes?: string;
//   restaurant?: Restaurant;
//   timeSlot?: TimeSlot;
//   orderItems?: OrderItem[];
//   restaurantStatus?: string;
//   paymentStatus?: string;
// }

// interface RazorpayConfig {
//   orderId: string;
//   amount: number;
//   currency: string;
//   key: string;
//   name: string;
//   description: string;
//   prefill: {
//     name: string;
//     email: string;
//     contact: string;
//   };
// }

// declare global {
//   interface Window {
//     Razorpay: any;
//   }
// }

// export default function PaymentPage() {
//   const router = useRouter();
//   const searchParams = useSearchParams();
//   const orderId = searchParams.get('orderId');

//   const [loading, setLoading] = useState<boolean>(true);
//   const [processing, setProcessing] = useState<boolean>(false);
//   const [orderDetails, setOrderDetails] = useState<OrderDetails | null>(null);
//   const [error, setError] = useState<string>("");

//   const fetchOrderDetails = useCallback(async () => {
//     try {
//       setLoading(true);
//       const token = localStorage.getItem("accessToken");

//       const response = await fetchWithAuth(
//         `${process.env.NEXT_PUBLIC_API_URL}/client/orders/${orderId}`,
//         {
//           headers: {
//             Authorization: `Bearer ${token}`,
//           },
//         }
//       );

//       const data = await response.json();

//       if (!response.ok) {
//         throw new Error(data.message || "Failed to fetch order");
//       }

//       const order = data.data?.order || data.data;
//       console.log("Fetched order:", order);
      
//       // Validate order status before allowing payment
//       if (order.paymentStatus === "paid") {
//         setError("This order has already been paid");
//         toast.error("This order has already been paid");
//         return;
//       }
      
//       if (order.restaurantStatus !== "Accepted") {
//         let errorMessage = "Cannot process payment for this order";
//         if (order.restaurantStatus === "Rejected") {
//           errorMessage = "This order was rejected by the restaurant";
//         } else if (order.restaurantStatus === "Cancelled") {
//           errorMessage = "This order has been cancelled";
//         } else if (order.restaurantStatus === "Pending") {
//           errorMessage = "Order is still pending restaurant approval. Please wait for confirmation.";
//         }
//         setError(errorMessage);
//         toast.error(errorMessage);
//         return;
//       }
      
//       setOrderDetails(order);
//     } catch (err) {
//       const errorMessage = err instanceof Error ? err.message : "Failed to load order";
//       console.error("Error:", err);
//       setError(errorMessage);
//       toast.error(errorMessage);
//     } finally {
//       setLoading(false);
//     }
//   }, [orderId]);

//   useEffect(() => {
//     if (orderId) {
//       fetchOrderDetails();
//     } else {
//       setError("Order ID not found");
//       setLoading(false);
//     }
//   }, [orderId, fetchOrderDetails]);

//   const loadRazorpayScript = (): Promise<boolean> => {
//     return new Promise((resolve) => {
//       if (window.Razorpay) {
//         resolve(true);
//         return;
//       }

//       const script = document.createElement("script");
//       script.src = "https://checkout.razorpay.com/v1/checkout.js";
//       script.onload = () => resolve(true);
//       script.onerror = () => resolve(false);
//       document.body.appendChild(script);
//     });
//   };

//   const formatTime = (dateString: string): string => {
//     const date = new Date(dateString);
//     return date.toLocaleTimeString("en-US", {
//       hour: "numeric",
//       minute: "2-digit",
//       hour12: true,
//     });
//   };

//   const formatDate = (dateString: string): string => {
//     const date = new Date(dateString);
//     return date.toLocaleDateString("en-US", {
//       weekday: "short",
//       month: "short",
//       day: "numeric",
//     });
//   };

//   const verifyPayment = async (paymentData: any): Promise<void> => {
//     try {
//       const token = localStorage.getItem("accessToken");

//       const response = await fetchWithAuth(
//         `${process.env.NEXT_PUBLIC_API_URL}/client/payment/verify`,
//         {
//           method: "POST",
//           headers: {
//             Authorization: `Bearer ${token}`,
//             "Content-Type": "application/json",
//           },
//           body: JSON.stringify({
//             orderId: orderDetails?.id,
//             razorpay_order_id: paymentData.razorpay_order_id,
//             razorpay_payment_id: paymentData.razorpay_payment_id,
//             razorpay_signature: paymentData.razorpay_signature,
//           }),
//         }
//       );

//       const data = await response.json();

//       if (!response.ok) {
//         throw new Error(data.message || "Payment verification failed");
//       }

//       toast.success("Payment successful!");
//       router.push(`/order-history/${orderDetails?.id}`);
//     } catch (err) {
//       const errorMessage = err instanceof Error ? err.message : "Payment verification failed";
//       console.error("Verification error:", err);
//       toast.error(errorMessage);
//       router.push(`/order-history/${orderDetails?.id}?payment=failed`);
//     }
//   };

//   const initiatePayment = async (): Promise<void> => {
//     if (!orderDetails?.id) {
//       toast.error("Order details not found");
//       return;
//     }

//     try {
//       setProcessing(true);

//       // Load Razorpay script
//       const loaded = await loadRazorpayScript();
//       if (!loaded) {
//         throw new Error("Failed to load Razorpay SDK. Please check your internet connection.");
//       }

//       const token = localStorage.getItem("accessToken");

//       console.log("Creating payment order for:", orderDetails.id);

//       // Create payment order
//       const response = await fetchWithAuth(
//         `${process.env.NEXT_PUBLIC_API_URL}/client/payment/create-order`,
//         {
//           method: "POST",
//           headers: {
//             Authorization: `Bearer ${token}`,
//             "Content-Type": "application/json",
//           },
//           body: JSON.stringify({ orderId: orderDetails.id }),
//         }
//       );

//       const data = await response.json();

//       if (!response.ok) {
//         throw new Error(data.message || "Failed to create payment order");
//       }

//       const razorpayConfig: RazorpayConfig = data.data.razorpayConfig;

//       // Razorpay payment options
//       const options = {
//         key: razorpayConfig.key,
//         amount: razorpayConfig.amount * 100, // Convert to paise
//         currency: razorpayConfig.currency,
//         name: razorpayConfig.name,
//         description: razorpayConfig.description,
//         order_id: razorpayConfig.orderId,
//         prefill: razorpayConfig.prefill,
//         handler: async function (response: any) {
//           console.log("Payment successful:", response);
//           await verifyPayment(response);
//         },
//         modal: {
//           ondismiss: function () {
//             setProcessing(false);
//             toast.error("Payment cancelled");
//           },
//         },
//         theme: {
//           color: "#f97316", // Orange color
//         },
//         retry: {
//           enabled: true,
//           max_count: 3,
//         },
//       };

//       // Open Razorpay checkout
//       const paymentObject = new window.Razorpay(options);
      
//       paymentObject.on("payment.failed", function (response: any) {
//         console.error("Payment failed:", response.error);
//         toast.error(response.error.description || "Payment failed");
//         setProcessing(false);
//       });

//       paymentObject.open();
//     } catch (err) {
//       const errorMessage = err instanceof Error ? err.message : "Failed to initiate payment";
//       console.error("Payment error:", err);
//       setError(errorMessage);
//       toast.error(errorMessage);
//       setProcessing(false);
//     }
//   };

//   if (loading) {
//     return (
//       <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-orange-50 to-white">
//         <div className="text-center">
//           <Loader2 className="w-12 h-12 text-orange-500 animate-spin mx-auto mb-4" />
//           <p className="text-gray-600 font-medium">Loading order details...</p>
//         </div>
//       </div>
//     );
//   }

//   if (error || !orderDetails) {
//     return (
//       <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-red-50 to-white p-4">
//         <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
//           <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
//           <h2 className="text-2xl font-bold text-gray-900 mb-2">
//             Unable to Process Payment
//           </h2>
//           <p className="text-gray-600 mb-6">{error || "Order not found"}</p>
//           <button
//             onClick={() => router.back()}
//             className="w-full bg-orange-500 text-white py-3 rounded-lg hover:bg-orange-600 flex items-center justify-center gap-2 transition-colors"
//           >
//             <ArrowLeft className="w-4 h-4" />
//             Go Back
//           </button>
//         </div>
//       </div>
//     );
//   }

//   return (
//     <div className="min-h-screen bg-gradient-to-b from-orange-50 via-white to-gray-50 py-8 px-4">
//       <div className="max-w-3xl mx-auto space-y-6">
//         <button
//           onClick={() => router.back()}
//           className="mb-4 flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
//         >
//           <ArrowLeft className="w-4 h-4" />
//           Back
//         </button>

//         {/* Payment Amount Card */}
//         <div className="bg-white rounded-lg shadow-lg overflow-hidden border border-orange-200">
//           <div className="bg-primary text-center p-2 text-white">
//             <p className="text-orange-100 font-semibold text-xl">Order #{orderDetails.id}</p>
//           </div>
//           <div className="p-3">
//             <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-xl p-6 text-center border border-orange-200">
//               <p className="text-orange-700 text-sm font-medium mb-2">
//                 Amount to Pay
//               </p>
//               <p className="text-5xl font-bold text-orange-600">
//                 ₹{orderDetails.totalAmount}
//               </p>
//             </div>
//           </div>
//         </div>

//         {/* Order Details Card */}
//         <div className="bg-white rounded-lg shadow-lg p-6">
//           <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
//             <ShoppingBag className="w-5 h-5 text-orange-500" />
//             Order Details
//           </h2>

//           {/* Restaurant Info */}
//           {orderDetails.restaurant && (
//             <div className="flex items-start gap-3 p-4 bg-gray-50 rounded-lg mb-4">
//               <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center flex-shrink-0">
//                 <Store className="w-5 h-5 text-orange-600" />
//               </div>
//               <div className="flex-1 min-w-0">
//                 <p className="font-semibold text-gray-900 truncate">
//                   {orderDetails.restaurant.name}
//                 </p>
//                 {orderDetails.restaurant.address && (
//                   <p className="text-sm text-gray-600 flex items-start gap-1 mt-1">
//                     <MapPin className="w-3 h-3 mt-0.5 flex-shrink-0" />
//                     <span className="line-clamp-2">
//                       {orderDetails.restaurant.address}
//                     </span>
//                   </p>
//                 )}
//               </div>
//             </div>
//           )}

//           {/* Time Slot */}
//           {orderDetails.timeSlot && (
//             <div className="flex items-start gap-3 p-4 bg-orange-50 rounded-lg border border-orange-200 mb-4">
//               <div className="w-10 h-10 bg-orange-500 rounded-full flex items-center justify-center flex-shrink-0">
//                 <Clock className="w-5 h-5 text-white" />
//               </div>
//               <div>
//                 <p className="font-semibold text-gray-900">Pickup Time</p>
//                 <p className="text-sm text-gray-600">
//                   {formatDate(orderDetails.timeSlot.slotStart)}
//                 </p>
//                 <p className="text-sm font-medium text-orange-600">
//                   {formatTime(orderDetails.timeSlot.slotStart)} -{" "}
//                   {formatTime(orderDetails.timeSlot.slotEnd)}
//                 </p>
//               </div>
//             </div>
//           )}

//           {/* Order Items */}
//           {orderDetails.orderItems && orderDetails.orderItems.length > 0 && (
//             <div>
//               <h3 className="font-semibold text-gray-900 mb-3">
//                 Items ({orderDetails.orderItems.length})
//               </h3>
//               <div className="space-y-2 mb-4">
//                 {orderDetails.orderItems.map((item, index) => (
//                   <div
//                     key={index}
//                     className="flex justify-between items-start p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
//                   >
//                     <div className="flex items-start gap-3 flex-1">
//                       <div className="w-8 h-8 bg-orange-100 rounded flex items-center justify-center flex-shrink-0 font-semibold text-orange-600 text-sm">
//                         {item.quantity}×
//                       </div>
//                       <div className="flex-1 min-w-0">
//                         <div className="flex items-center gap-2">
//                           <p className="font-medium text-gray-900 truncate">
//                             {item.menuItem.name}
//                           </p>
//                           {item.menuItem.isVeg !== undefined && (
//                             <span
//                               className={`w-4 h-4 border-2 flex items-center justify-center ${
//                                 item.menuItem.isVeg
//                                   ? "border-green-600"
//                                   : "border-red-600"
//                               }`}
//                             >
//                               <span
//                                 className={`w-2 h-2 rounded-full ${
//                                   item.menuItem.isVeg
//                                     ? "bg-green-600"
//                                     : "bg-red-600"
//                                 }`}
//                               />
//                             </span>
//                           )}
//                         </div>
//                         <p className="text-xs text-gray-500">
//                           ₹{item.menuItem.price} each
//                         </p>
//                       </div>
//                     </div>
//                     <p className="font-semibold text-gray-900 ml-4">
//                       ₹{item.price * item.quantity}
//                     </p>
//                   </div>
//                 ))}
//               </div>

//               <div className="border-t pt-4">
//                 <div className="flex justify-between items-center text-lg">
//                   <span className="font-semibold text-gray-900">Total</span>
//                   <span className="font-bold text-orange-600">
//                     ₹{orderDetails.totalAmount}
//                   </span>
//                 </div>
//               </div>
//             </div>
//           )}
//         </div>

//         {/* Payment Button Card */}
//         <div className="bg-white rounded-lg shadow-lg p-6 border border-orange-200">
//           <button
//             onClick={initiatePayment}
//             disabled={processing}
//             className="w-full bg-primary text-white py-4 rounded-lg font-semibold text-lg flex items-center justify-center gap-2 hover:from-orange-600 hover:to-orange-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg hover:shadow-xl"
//           >
//             {processing ? (
//               <>
//                 <Loader2 className="w-5 h-5 animate-spin" />
//                 Processing Payment...
//               </>
//             ) : (
//               <>
//                 <CreditCard className="w-5 h-5" />
//                 Pay ₹{orderDetails.totalAmount} Securely
//               </>
//             )}
//           </button>
//           <p className="text-xs text-gray-500 text-center mt-3">
//             🔒 Secured by Razorpay Payment Gateway
//           </p>
//           <div className="flex items-center justify-center gap-2 mt-2 text-xs text-gray-400">
//             <span>Accepts UPI, Cards, Netbanking & More</span>
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// }