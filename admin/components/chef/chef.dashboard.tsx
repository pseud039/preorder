"use client";
import React, { useEffect, useState } from "react";
import {
  ShoppingBag,
  Clock,
  CheckCircle2,
  TrendingUp,
} from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

interface User {
  id: number;
  name: string;
  phone: string;
}

interface MenuItem {
  id: number;
  name: string;
  isVeg: boolean;
}

interface OrderItem {
  id: number;
  quantity: number;
  price: string;
  menuItem: MenuItem;
}

interface Order {
  id: number;
  totalAmount: string;
  restaurantStatus: string;
  estimatedWaitingTime: number | null;
  createdAt: string;
  user: User;
  orderItems: OrderItem[];
}

interface ChefDashboardStats {
  stats: {
    pendingOrders: number;
    preparingOrders: number;
    readyOrders: number;
    todayCompletedOrders: number;
    totalActiveOrders: number;
  };
  activeOrders: Order[];
}

export default function ChefDashboard() {
  const [stats, setStats] = useState<ChefDashboardStats["stats"] | null>(null);
  const [activeOrders, setActiveOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingOrderId, setUpdatingOrderId] = useState<number | null>(null);

  useEffect(() => {
    fetchDashboardData();
    const interval = setInterval(fetchDashboardData, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchDashboardData = async () => {
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/admin/chef/dashboard`,
        {
          method: "GET",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
        }
      );

      if (response.status === 401) {
        toast.error("Session expired. Please login again.");
        window.location.href = "/login";
        return;
      }

      const data = await response.json();

      if (data.success) {
        setStats(data.data.stats);
        setActiveOrders(data.data.activeOrders || []);
      } else {
        toast.error("Failed to fetch dashboard data");
      }
    } catch (error) {
      console.error("Error fetching dashboard:", error);
      toast.error("Error loading dashboard");
    } finally {
      setLoading(false);
    }
  };

  const updateOrderStatus = async (orderId: number, status: string) => {
    try {
      setUpdatingOrderId(orderId);

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/admin/chef/orders/${orderId}/status`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ restaurantStatus: status }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to update order");
      }

      toast.success(`Order marked as ${status}`);
      fetchDashboardData();
    } catch (error: any) {
      console.error("Error updating order:", error);
      toast.error(error.message || "Failed to update order");
    } finally {
      setUpdatingOrderId(null);
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, string> = {
      Accepted: "bg-blue-100 text-blue-800 border-blue-200",
      Preparing: "bg-purple-100 text-purple-800 border-purple-200",
      Ready: "bg-green-100 text-green-800 border-green-200",
    };

    return (
      <Badge
        variant="outline"
        className={variants[status] || "bg-gray-100 text-gray-800"}
      >
        {status}
      </Badge>
    );
  };

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleString("en-IN", {
      hour: "2-digit",
      minute: "2-digit",
      day: "2-digit",
      month: "short",
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600"></div>
      </div>
    );
  }

  const statCards = [
    {
      label: "Pending Orders",
      value: stats?.pendingOrders || 0,
      icon: Clock,
      color: "bg-yellow-100 text-yellow-800",
      iconBg: "bg-yellow-50",
      iconColor: "text-yellow-600",
    },
    {
      label: "Preparing",
      value: stats?.preparingOrders || 0,
      icon: TrendingUp,
      color: "bg-purple-100 text-purple-800",
      iconBg: "bg-purple-50",
      iconColor: "text-purple-600",
    },
    {
      label: "Ready for Pickup",
      value: stats?.readyOrders || 0,
      icon: CheckCircle2,
      color: "bg-green-100 text-green-800",
      iconBg: "bg-green-50",
      iconColor: "text-green-600",
    },
    {
      label: "Today Completed",
      value: stats?.todayCompletedOrders || 0,
      icon: ShoppingBag,
      color: "bg-blue-100 text-blue-800",
      iconBg: "bg-blue-50",
      iconColor: "text-blue-600",
    },
  ];

  return (
    <div className="space-y-6 w-full p-6 bg-gray-50">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((card, index) => {
          const Icon = card.icon;
          return (
            <div
              key={index}
              className="bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow duration-200 p-5"
            >
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <p className="text-sm text-gray-600 mb-1">{card.label}</p>
                  <p className="text-2xl font-bold text-gray-800">
                    {card.value}
                  </p>
                </div>
                <div className={`p-3 rounded-lg ${card.iconBg}`}>
                  <Icon className={`w-6 h-6 ${card.iconColor}`} />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Active Orders */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-xl font-semibold text-gray-800">
              Active Orders ({activeOrders.length})
            </h2>
            <p className="text-sm text-gray-600">
              Orders waiting for your action
            </p>
          </div>
          <Button
            onClick={fetchDashboardData}
            variant="outline"
            size="sm"
          >
            <Clock className="w-4 h-4 mr-2" />
            Refresh
          </Button>
        </div>

        {activeOrders.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <Clock className="w-16 h-16 mx-auto mb-4 text-gray-300" />
            <p>No active orders at the moment</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {activeOrders.map((order) => (
              <div
                key={order.id}
                className="border rounded-lg p-4 hover:shadow-md transition-shadow"
              >
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h3 className="font-semibold text-lg">Order #{order.id}</h3>
                    <p className="text-sm text-gray-500">
                      {formatTime(order.createdAt)}
                    </p>
                  </div>
                  {getStatusBadge(order.restaurantStatus)}
                </div>

                <div className="space-y-2 mb-3">
                  <div className="flex items-center gap-2 text-sm">
                    <span className="text-gray-600">Customer:</span>
                    <span className="font-medium">{order.user.name}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <span className="text-gray-600">Phone:</span>
                    <span>{order.user.phone}</span>
                  </div>
                  {order.estimatedWaitingTime && (
                    <div className="flex items-center gap-2 text-sm">
                      <Clock className="w-4 h-4 text-gray-400" />
                      <span>{order.estimatedWaitingTime} mins</span>
                    </div>
                  )}
                </div>

                <div className="border-t pt-3 mb-3">
                  <div className="space-y-1">
                    {order.orderItems.map((item) => (
                      <div
                        key={item.id}
                        className="flex justify-between text-sm"
                      >
                        <span className="flex items-center gap-2">
                          <span
                            className={`w-2 h-2 rounded-full ${
                              item.menuItem.isVeg
                                ? "bg-green-500"
                                : "bg-red-500"
                            }`}
                          />
                          {item.menuItem.name} x{item.quantity}
                        </span>
                        <span className="font-medium">
                          ₹{(Number(item.price) * item.quantity)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex justify-between items-center border-t pt-3">
                  <span className="font-semibold">
                    Total: ₹{Number(order.totalAmount)}
                  </span>

                  {order.restaurantStatus === "Accepted" && (
                    <Button
                      onClick={() => updateOrderStatus(order.id, "Preparing")}
                      disabled={updatingOrderId === order.id}
                      size="sm"
                      className="bg-purple-600 hover:bg-purple-700"
                    >
                      {updatingOrderId === order.id ? (
                        "Updating..."
                      ) : (
                        "Start Preparing"
                      )}
                    </Button>
                  )}

                  {order.restaurantStatus === "Preparing" && (
                    <Button
                      onClick={() => updateOrderStatus(order.id, "Ready")}
                      disabled={updatingOrderId === order.id}
                      size="sm"
                      className="bg-green-600 hover:bg-green-700"
                    >
                      {updatingOrderId === order.id ? "Updating..." : "Mark Ready"}
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Summary */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">
          Today's Summary
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center p-4 bg-yellow-50 rounded-lg">
            <p className="text-2xl font-bold text-yellow-600">
              {stats?.pendingOrders || 0}
            </p>
            <p className="text-sm text-gray-600">Waiting</p>
          </div>
          <div className="text-center p-4 bg-purple-50 rounded-lg">
            <p className="text-2xl font-bold text-purple-600">
              {stats?.preparingOrders || 0}
            </p>
            <p className="text-sm text-gray-600">In Progress</p>
          </div>
          <div className="text-center p-4 bg-green-50 rounded-lg">
            <p className="text-2xl font-bold text-green-600">
              {stats?.readyOrders || 0}
            </p>
            <p className="text-sm text-gray-600">Ready</p>
          </div>
          <div className="text-center p-4 bg-blue-50 rounded-lg">
            <p className="text-2xl font-bold text-blue-600">
              {stats?.todayCompletedOrders || 0}
            </p>
            <p className="text-sm text-gray-600">Completed</p>
          </div>
        </div>
      </div>
    </div>
  );
}
