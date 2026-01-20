"use client";
"use client";
import { useState, useEffect } from "react";
import {
  Package,
  Clock,
  ChevronRight,
  Loader2,
  CheckCircle,
  XCircle,
  ChefHat,
} from "lucide-react";
import { fetchWithAuth } from "@/lib/auth";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { io, Socket } from "socket.io-client";

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
  orderItems: OrderItem[];
  restaurant: Restaurant;
  timeSlot: TimeSlot | null;
}

export default function OrderHistory() {
  const router = useRouter();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>("all");
  const [socket, setSocket] = useState<Socket | null>(null);

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
      console.log("📬 Order notification received:", notification);

      const orderRelatedTypes = [
        "ORDER_ACCEPTED",
        "ORDER_REJECTED",
        "ORDER_PREPARING",
        "ORDER_READY",
        "ORDER_COMPLETED",
        "ORDER_EXPIRED",
        "PAYMENT_EXPIRED",
      ];

      // Auto-refresh orders when status changes
      if (orderRelatedTypes.includes(notification.type)) {
        fetchOrders();
        
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
    fetchOrders();
  }, [filter]);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const queryParams = filter !== "all" ? `?restaurantStatus=${filter}` : "";
      const response = await fetchWithAuth(
        `${process.env.NEXT_PUBLIC_API_URL}/client/orders${queryParams}`
      );
      const data = await response.json();

      if (data.success) {
        setOrders(data.data.orders);
      } else {
        toast.error(data.message || "Failed to fetch orders");
      }
    } catch (error) {
      console.error("Error fetching orders:", error);
      toast.error("Failed to fetch orders");
    } finally {
      setLoading(false);
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

  if (loading) {
    return (
      <div className="max-w-md mx-auto min-h-screen flex items-center justify-center bg-gray-50">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    
    <div className="max-w-md mx-auto min-h-screen relative bg-accent/10 overflow-hidden font-[inter]">
      {/* <div className="absolute top-0 right-0 w-64 h-64 bg-primary/50 rounded-full blur-3xl opacity-30 -mr-32 -mt-32"></div>
      <div className="absolute top-40 left-0 w-64 h-64 bg-primary/30 rounded-full z-10 blur-3xl opacity-30 -ml-32 -mb-32"></div> */}
      
    <div className="max-w-md mx-auto min-h-screen  pb-24">
      {/* Header */}
      <div className=" shadow-sm sticky top-0 z-10">
        <div className="px-6 py-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">My Orders</h1>
          <p className="text-gray-600">Track your order history</p>
        </div>

        {/* Filter Tabs */}
        <div className="px-6 pb-6">
          <div className="flex gap-2 overflow-x-auto custom-scrollbar">
            {[
              { label: "All", value: "all" },
              { label: "Pending", value: "Pending" },
              { label: "Preparing", value: "Preparing" },
              { label: "Ready", value: "Ready" },
              { label: "Completed", value: "Completed" },
            ].map((tab) => (
              <button
                key={tab.value}
                onClick={() => setFilter(tab.value)}
                className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
                  filter === tab.value
                    ? "bg-primary text-white"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Orders List */}
      <div className="px-6 pt-4 space-y-4">
        {orders.length === 0 ? (
          <div className="bg-white rounded-3xl z-100 shadow-md p-12 text-center">
            <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              No Orders Yet
            </h3>
            <p className="text-gray-500 mb-6">
              Start ordering to see your order history here
            </p>
            <button
              onClick={() => router.push("/")}
              className="bg-primary text-white px-6 py-3 rounded-2xl font-medium hover:bg-orange-700 transition-colors"
            >
              Browse Menu
            </button>
          </div>
        ) : (
          orders.map((order) => (
            <div
              key={order.id}
              onClick={() => router.push(`/order-history/${order.id}`)}
              className="bg-white rounded-3xl shadow-md p-6 hover:shadow-lg transition-shadow cursor-pointer"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  {getStatusIcon(order.restaurantStatus)}
                  <div>
                    <p className="font-bold text-gray-900">
                      Order #{order.id}
                    </p>
                    <p className="text-sm text-gray-500">
                      {order.restaurant.name}
                    </p>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-gray-400" />
              </div>

              <div className="flex items-center justify-between mb-3">
                <span
                  className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(
                    order.restaurantStatus
                  )}`}
                >
                  {order.restaurantStatus}
                </span>
                <span
                  className={`px-3 py-1 rounded-full text-xs font-semibold ${getPaymentStatusColor(
                    order.paymentStatus
                  )}`}
                >
                  {order.paymentStatus === "paid" ? "Paid" : "Pending"}
                </span>
              </div>

              <div className="border-t border-gray-100 pt-3 flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm text-gray-500">
                  <Clock className="w-4 h-4" />
                  <span>{formatDate(order.createdAt)}</span>
                </div>
                <span className="text-lg font-bold text-primary">
                  ₹{(order.priceBreakdown?.grandTotal ?? parseFloat(order.totalAmount)).toFixed(2)}
                </span>
              </div>

              <div className="mt-3 flex items-center gap-2">
                <Package className="w-4 h-4 text-gray-400" />
                <span className="text-sm text-gray-600">
                  {order.orderItems.length} item
                  {order.orderItems.length !== 1 ? "s" : ""}
                </span>
              </div>
            </div>
          ))
        )}
      </div>
    </div></div>
  );
}
