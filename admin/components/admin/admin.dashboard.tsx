"use client";
import React, { useEffect, useState } from "react";
import {
  ShoppingBag,
  Clock,
  CheckCircle2,
  TrendingUp,
  DollarSign,
  Users,
} from "lucide-react";
import { toast } from "sonner";

interface DashboardStats {
  totalOrders: number;
  pendingOrders: number;
  acceptedOrders: number;
  preparingOrders: number;
  readyOrders: number;
  completedOrders: number;
  cancelledOrders: number;
  activeOrders: number;
  todayOrders: number;
  totalRevenue: number;
  paidRevenue: number;
  pendingRevenue: number;
}

export default function DashboardGrid() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardStats();
    const interval = setInterval(fetchDashboardStats, 60000);
    return () => clearInterval(interval);
  }, []);

  const fetchDashboardStats = async () => {
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/admin/dashboard`,
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
        setStats(data.data);
      } else {
        toast.error("Failed to fetch dashboard stats");
      }
    } catch (error) {
      console.error("Error fetching dashboard stats:", error);
      toast.error("Error loading dashboard");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="grid grid-cols-12 gap-4 w-full p-6 bg-gray-50">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div
            key={i}
            className="col-span-12 sm:col-span-6 lg:col-span-4 xl:col-span-2 bg-white rounded-xl shadow-sm p-5 animate-pulse"
          >
            <div className="h-20 bg-gray-200 rounded"></div>
          </div>
        ))}
      </div>
    );
  }

  const statCards = [
    {
      label: "Total Orders",
      value: stats?.totalOrders || 0,
      icon: ShoppingBag,
      color: "bg-blue-500",
      textColor: "text-blue-600",
      bgColor: "bg-blue-50",
    },
    {
      label: "Pending",
      value: stats?.pendingOrders || 0,
      icon: Clock,
      color: "bg-yellow-500",
      textColor: "text-yellow-600",
      bgColor: "bg-yellow-50",
    },
    {
      label: "Active Orders",
      value: stats?.activeOrders || 0,
      icon: TrendingUp,
      color: "bg-purple-500",
      textColor: "text-purple-600",
      bgColor: "bg-purple-50",
    },
    {
      label: "Completed",
      value: stats?.completedOrders || 0,
      icon: CheckCircle2,
      color: "bg-green-500",
      textColor: "text-green-600",
      bgColor: "bg-green-50",
    },
    {
      label: "Today's Orders",
      value: stats?.todayOrders || 0,
      icon: Users,
      color: "bg-indigo-500",
      textColor: "text-indigo-600",
      bgColor: "bg-indigo-50",
    },
    {
      label: "Total Revenue",
      value: `₹${ 0}`,
      icon: DollarSign,
      color: "bg-emerald-500",
      textColor: "text-emerald-600",
      bgColor: "bg-emerald-50",
    },
  ];

  return (
    <div className="space-y-6 w-full p-6 bg-gray-50">
      {/* Stats Grid */}
      <div className="grid grid-cols-12 gap-4">
        {statCards.map((card, index) => {
          const Icon = card.icon;
          return (
            <div
              key={index}
              className="col-span-12 sm:col-span-6 lg:col-span-4 xl:col-span-2 bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow duration-200 p-5"
            >
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <p className="text-sm text-gray-600 mb-1">{card.label}</p>
                  <p className="text-2xl font-bold text-gray-800">
                    {card.value}
                  </p>
                </div>
                <div className={`p-3 rounded-lg ${card.bgColor}`}>
                  <Icon className={`w-6 h-6 ${card.textColor}`} />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Additional Details */}
      <div className="grid grid-cols-12 gap-4">
        {/* Revenue Breakdown */}
        <div className="col-span-12 lg:col-span-6 bg-white rounded-xl shadow-sm p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">
            Revenue Breakdown
          </h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg">
              <div>
                <p className="text-sm text-gray-600">Paid Revenue</p>
                <p className="text-xl font-bold text-green-600">
                  ₹{stats?.paidRevenue || 0}
                </p>
              </div>
              <CheckCircle2 className="w-8 h-8 text-green-600" />
            </div>
            <div className="flex items-center justify-between p-4 bg-orange-50 rounded-lg">
              <div>
                <p className="text-sm text-gray-600">Pending Revenue</p>
                <p className="text-xl font-bold text-orange-600">
                  ₹{stats?.pendingRevenue|| 0}
                </p>
              </div>
              <Clock className="w-8 h-8 text-orange-600" />
            </div>
          </div>
        </div>

        <div className="col-span-12 lg:col-span-6 bg-white rounded-xl shadow-sm p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">
            Order Status
          </h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                <span className="text-sm text-gray-600">Pending</span>
              </div>
              <span className="font-semibold text-gray-800">
                {stats?.pendingOrders || 0}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                <span className="text-sm text-gray-600">Accepted</span>
              </div>
              <span className="font-semibold text-gray-800">
                {stats?.acceptedOrders || 0}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-purple-500"></div>
                <span className="text-sm text-gray-600">Preparing</span>
              </div>
              <span className="font-semibold text-gray-800">
                {stats?.preparingOrders || 0}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-green-500"></div>
                <span className="text-sm text-gray-600">Ready</span>
              </div>
              <span className="font-semibold text-gray-800">
                {stats?.readyOrders || 0}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-gray-500"></div>
                <span className="text-sm text-gray-600">Completed</span>
              </div>
              <span className="font-semibold text-gray-800">
                {stats?.completedOrders || 0}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-red-500"></div>
                <span className="text-sm text-gray-600">Cancelled</span>
              </div>
              <span className="font-semibold text-gray-800">
                {stats?.cancelledOrders || 0}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">
          Quick Actions
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <a
            href="/admin/orders"
            className="p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-all cursor-pointer"
          >
            <ShoppingBag className="mx-auto mb-2 text-gray-400" size={32} />
            <p className="text-sm font-medium text-gray-700 text-center">
              Manage Orders
            </p>
          </a>
          <a
            href="/admin/menu"
            className="p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-green-500 hover:bg-green-50 transition-all cursor-pointer"
          >
            <Users className="mx-auto mb-2 text-gray-400" size={32} />
            <p className="text-sm font-medium text-gray-700 text-center">
              Manage Menu
            </p>
          </a>
          <button
            onClick={fetchDashboardStats}
            className="p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-purple-500 hover:bg-purple-50 transition-all cursor-pointer"
          >
            <TrendingUp className="mx-auto mb-2 text-gray-400" size={32} />
            <p className="text-sm font-medium text-gray-700 text-center">
              Refresh Stats
            </p>
          </button>
        </div>
      </div>
    </div>
  );
}