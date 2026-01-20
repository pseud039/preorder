"use client";
import { useState, useEffect } from "react";
import {
  Package,
  Clock,
  MapPin,
  ChevronRight,
  Loader2,
  CheckCircle,
  XCircle,
  ChefHat,
  CreditCard,
  Calendar,
  AlertTriangle,
} from "lucide-react";
import { fetchWithAuth } from "@/lib/auth";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { io, Socket } from "socket.io-client";
import { Button } from "./ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Textarea } from "@/components/ui/textarea";

interface MenuItem {
  id: number;
  name: string;
  imageUrl: string | null;
  isVeg: boolean;
}

interface OrderItem {
  id: number;
  quantity: number;
  price: string;
  menuItem: MenuItem;
}

interface Restaurant {
  id: number;
  name: string;
  imageUrl: string | null;
  contactNumber: string | null;
}

interface TimeSlot {
  id: number;
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

interface Order {
  id: number;
  status: string;
  restaurantStatus: string;
  paymentStatus: string;
  totalAmount: string;
  subtotal?: number;
  tax?: number;
  taxPercentage?: number;
  platformFee?: number;
  priceBreakdown?: PriceBreakdown;
  notes: string | null;
  estimatedWaitingTime: number | null;
  estimatedReadyTime: string | null;
  createdAt: string;
  isEditedByRestaurant?: boolean; // NEW: Flag to check if edited
  orderItems: OrderItem[];
  restaurant: Restaurant;
  timeSlot: TimeSlot | null;
}

interface OrderDetailsProps {
  orderId: string;
}

export default function OrderDetails({ orderId }: OrderDetailsProps) {
  const router = useRouter();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [socket, setSocket] = useState<Socket | null>(null);
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [cancelReason, setCancelReason] = useState("");
  const [cancelling, setCancelling] = useState(false);

  // Setup Socket.IO for real-time order updates
  useEffect(() => {
    const accessToken = localStorage.getItem("accessToken");
    const userId = localStorage.getItem("userId");

    if (!accessToken || !userId) return;

    // Connect to Socket.IO
    const newSocket = io(
      process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000",
      {
        auth: {
          token: accessToken,
        },
      }
    );

    // Join user's room
    newSocket.emit("join", userId);

    // Listen for order-related notifications
    newSocket.on("notification", (notification) => {
      console.log("🔔 Order notification received:", notification);

      const orderRelatedTypes = [
        "ORDER_ACCEPTED",
        "ORDER_REJECTED",
        "ORDER_PREPARING",
        "ORDER_READY",
        "ORDER_COMPLETED",
        "ORDER_EXPIRED",
        "PAYMENT_EXPIRED",
        "ORDER_UPDATED", // NEW: Listen for order updates
      ];

      // Auto-refresh order when status changes
      if (orderRelatedTypes.includes(notification.type)) {
        fetchOrder();

        // Show toast notification
        toast.success(notification.title, {
          description: notification.message,
        });
      }
    });

    setSocket(newSocket);

    return () => {
      newSocket.close();
    };
  }, []);

  useEffect(() => {
    fetchOrder();
  }, [orderId]);

  const fetchOrder = async () => {
    try {
      setLoading(true);
      const response = await fetchWithAuth(
        `${process.env.NEXT_PUBLIC_API_URL}/client/orders/${orderId}`
      );
      const data = await response.json();

      if (data.success) {
        setOrder(data.data.order);
      } else {
        toast.error(data.message || "Failed to fetch order");
      }
    } catch (error) {
      console.error("Error fetching order:", error);
      toast.error("Failed to fetch order");
    } finally {
      setLoading(false);
    }
  };

  const handleCancelOrder = async () => {
    if (!order) return;

    try {
      setCancelling(true);
      const response = await fetchWithAuth(
        `${process.env.NEXT_PUBLIC_API_URL}/client/orders/${orderId}/cancel`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            reason: cancelReason || "Did not agree with order modifications",
          }),
        }
      );

      const data = await response.json();

      if (data.success) {
        toast.success("Order cancelled successfully");
        setShowCancelDialog(false);
        fetchOrder(); // Refresh order data
      } else {
        toast.error(data.message || "Failed to cancel order");
      }
    } catch (error) {
      console.error("Error cancelling order:", error);
      toast.error("Failed to cancel order");
    } finally {
      setCancelling(false);
    }
  };

  const getStatusColor = (status: string) => {
    const statusColors: { [key: string]: string } = {
      Pending: "bg-yellow-100 text-yellow-800",
      Accepted: "bg-blue-100 text-blue-800",
      Preparing: "bg-purple-100 text-purple-800",
      Ready: "bg-green-100 text-green-800",
      Completed: "bg-gray-100 text-gray-800",
      Rejected: "bg-red-100 text-red-800",
      Cancelled: "bg-red-100 text-red-800",
    };
    return statusColors[status] || "bg-gray-100 text-gray-800";
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "Completed":
        return <CheckCircle className="w-5 h-5 text-green-600" />;
      case "Rejected":
      case "Cancelled":
        return <XCircle className="w-5 h-5 text-red-600" />;
      case "Ready":
        return <Package className="w-5 h-5 text-green-600" />;
      case "Preparing":
        return <ChefHat className="w-5 h-5 text-purple-600" />;
      default:
        return <Clock className="w-5 h-5 text-yellow-600" />;
    }
  };

  const getPaymentStatusColor = (status: string) => {
    return status === "paid"
      ? "bg-green-100 text-green-800"
      : "bg-orange-100 text-orange-800";
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const handlePayment = () => {
    router.push(`/checkout/payment?orderId=${orderId}`);
  };

  const canPay =
    order &&
    order.restaurantStatus === "Accepted" &&
    order.paymentStatus !== "paid";

  const canCancel =
    order &&
    order.status !== "Cancelled" &&
    order.paymentStatus !== "paid" &&
    !["Preparing", "Ready", "Completed"].includes(order.restaurantStatus);

  // NEW: Check if order was edited by restaurant and user hasn't paid yet
  const showEditWarning =
    order &&
    order.isEditedByRestaurant &&
    order.paymentStatus !== "paid" &&
    order.status !== "Cancelled";

  if (loading) {
    return (
      <div className="max-w-md mx-auto min-h-screen flex items-center justify-center bg-gray-50">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!order) {
    return (
      <div className="max-w-md mx-auto min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Order Not Found
          </h3>
          <Button onClick={() => router.push("/order-history")}>
            Go to Order History
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto min-h-screen bg-accent/10 relative overflow-hidden font-[inter] pb-24">
      {/* Order Details View */}
      <div className="shadow-xs top-0">
        <div className="px-6 py-4 flex items-center gap-4">
          <button
            onClick={() => router.push("/order-history")}
            className="p-2 hover:bg-gray-100 rounded-full"
          >
            <ChevronRight className="w-5 h-5 rotate-180" />
          </button>
          <div>
            <h1 className="text-xl font-bold text-gray-900">Order Details</h1>
            <p className="text-sm text-gray-500">Order #{order.id}</p>
          </div>
        </div>
      </div>

      <div className="p-6 space-y-4">
        {/* NEW: Edit Warning Banner */}
        {showEditWarning && (
          <div className="bg-orange-50 border-l-4 border-orange-500 p-4 rounded-lg">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-orange-500 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <h4 className="font-semibold text-orange-900 mb-1">
                  Order Modified by Restaurant
                </h4>
                <p className="text-sm text-orange-800">
                  The restaurant has made changes to your order. Please review
                  the updated items and total amount. You can proceed to payment
                  if you agree, or cancel the order.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Status Card */}
        <div className="bg-white rounded-3xl shadow-md p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              {getStatusIcon(order.restaurantStatus)}
              <div>
                <p className="text-sm text-gray-500">Order Status</p>
                <p className="text-lg font-bold text-gray-900">
                  {order.restaurantStatus}
                </p>
              </div>
            </div>
            <span
              className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(
                order.restaurantStatus
              )}`}
            >
              {order.restaurantStatus}
            </span>
          </div>

          <div className="flex items-center justify-between pt-4 border-t border-gray-100">
            <div className="flex items-center gap-2">
              <CreditCard className="w-4 h-4 text-gray-500" />
              <span className="text-sm text-gray-500">Payment</span>
            </div>
            {canPay ? (
              <div className="text-primary text-sm">Pay Now</div>
            ) : (
              <span
                className={`px-3 py-1 rounded-full text-xs font-semibold ${getPaymentStatusColor(
                  order.paymentStatus
                )}`}
              >
                {order.paymentStatus === "paid" ? "Paid" : "Pending"}
              </span>
            )}
          </div>
        </div>

        {/* Restaurant Info */}
        <div className="bg-white rounded-3xl shadow-md p-6">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-2xl flex items-center justify-center">
              <MapPin className="w-8 h-8 text-primary" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Restaurant</p>
              <p className="text-lg font-bold text-gray-900">
                {order.restaurant.name}
              </p>
              {order.restaurant.contactNumber && (
                <p className="text-sm text-gray-600">
                  {order.restaurant.contactNumber}
                </p>
              )}
            </div>
          </div>

          {order.timeSlot && (
            <div className="mt-4 pt-4 border-t border-gray-100">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-gray-500" />
                <span className="text-sm text-gray-500">Pickup Time</span>
              </div>
              <p className="text-sm font-medium text-gray-900 mt-1">
                {formatTime(order.timeSlot.slotStart)} -{" "}
                {formatTime(order.timeSlot.slotEnd)}
              </p>
            </div>
          )}
        </div>

        {/* Order Items */}
        <div className="bg-white rounded-3xl shadow-md p-6">
          <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
            Order Items
            {showEditWarning && (
              <span className="text-xs bg-orange-100 text-orange-700 px-2 py-1 rounded-full">
                Modified
              </span>
            )}
          </h3>
          <div className="space-y-3">
            {order.orderItems.map((item) => (
              <div
                key={item.id}
                className="flex items-center gap-4 p-3 bg-gray-50 rounded-2xl"
              >
                {item.menuItem.imageUrl ? (
                  <img
                    src={item.menuItem.imageUrl}
                    alt={item.menuItem.name}
                    className="w-16 h-16 rounded-xl object-cover"
                  />
                ) : (
                  <div className="w-16 h-16 bg-gray-200 rounded-xl flex items-center justify-center">
                    <Package className="w-8 h-8 text-gray-400" />
                  </div>
                )}
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <p className="font-semibold text-gray-900">
                      {item.menuItem.name}
                    </p>
                    {item.menuItem.isVeg && (
                      <span className="w-4 h-4 border-2 border-green-600 flex items-center justify-center">
                        <span className="w-2 h-2 rounded-full bg-green-600"></span>
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-500">Qty: {item.quantity}</p>
                </div>
                <p className="font-bold text-gray-900">
                  ₹{(parseFloat(item.price) * item.quantity).toFixed(2)}
                </p>
              </div>
            ))}
          </div>

          <div className="mt-4 pt-4 border-t border-gray-200 space-y-2">
            <div className="flex items-center justify-between text-gray-600">
              <span>Subtotal</span>
              <span>
                ₹
                {(
                  order.priceBreakdown?.itemsTotal ??
                  order.subtotal ??
                  parseFloat(order.totalAmount)
                ).toFixed(2)}
              </span>
            </div>
            <div className="flex items-center justify-between text-gray-600">
              <span>
                {order.priceBreakdown?.taxLabel ??
                  `GST (${order.taxPercentage ?? 5}%)`}
              </span>
              <span>
                ₹
                {(order.priceBreakdown?.taxAmount ?? order.tax ?? 0).toFixed(
                  2
                )}
              </span>
            </div>
            <div className="flex items-center justify-between text-gray-600">
              <span>
                {order.priceBreakdown?.platformFeeLabel ?? "Platform Fee"}
              </span>
              <span>
                ₹
                {(
                  order.priceBreakdown?.platformFeeAmount ??
                  order.platformFee ??
                  0
                ).toFixed(2)}
              </span>
            </div>
            <div className="flex items-center justify-between pt-2 border-t border-gray-100">
              <span className="text-lg font-bold text-gray-900">Total</span>
              <span className="text-2xl font-bold text-primary">
                ₹
                {(
                  order.priceBreakdown?.grandTotal ??
                  parseFloat(order.totalAmount)
                ).toFixed(2)}
              </span>
            </div>
          </div>

          {order.notes && (
            <div className="mt-4 pt-4 border-t border-gray-100">
              <p className="text-sm text-gray-500 mb-1">Notes</p>
              <p className="text-sm text-gray-900">{order.notes}</p>
            </div>
          )}
        </div>

        {/* Order Info */}
        <div className="bg-white rounded-3xl shadow-md p-6">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-500">Order Date</span>
            <span className="text-sm font-medium text-gray-900">
              {formatDate(order.createdAt)} at {formatTime(order.createdAt)}
            </span>
          </div>
          {order.estimatedWaitingTime && (
            <div className="flex items-center justify-between mt-3">
              <span className="text-sm text-gray-500">Est. Waiting Time</span>
              <span className="text-sm font-medium text-gray-900">
                {order.estimatedWaitingTime} mins
              </span>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        {canPay && (
          <div className="space-y-3">
            <Button className="w-full" size="lg" onClick={handlePayment}>
              Proceed to Payment
            </Button>

            {/* NEW: Cancel Order Button when edited */}
            {showEditWarning && canCancel && (
              <Button
                className="w-full"
                size="lg"
                variant="outline"
                onClick={() => setShowCancelDialog(true)}
              >
                Cancel Order
              </Button>
            )}
          </div>
        )}
      </div>

      {/* NEW: Cancel Order Dialog */}
      <AlertDialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cancel Order?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to cancel this order? This action cannot be
              undone.
            </AlertDialogDescription>
          </AlertDialogHeader>

          <div className="my-4">
            <label className="text-sm font-medium text-gray-700 mb-2 block">
              Reason for cancellation (optional)
            </label>
            <Textarea
              placeholder="e.g., Did not agree with the modifications..."
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
              rows={3}
              className="resize-none"
            />
          </div>

          <AlertDialogFooter>
            <AlertDialogCancel disabled={cancelling}>
              Keep Order
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleCancelOrder}
              disabled={cancelling}
              className="bg-red-600 hover:bg-red-700"
            >
              {cancelling ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Cancelling...
                </>
              ) : (
                "Cancel Order"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}