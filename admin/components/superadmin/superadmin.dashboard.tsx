"use client";
import React, { useEffect, useState } from "react";
import {
  Store,
  ShoppingBag,
  DollarSign,
  Users,
  UserPlus,
  TrendingUp,
  CheckCircle2,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

interface PlatformAnalytics {
  restaurants: {
    total: number;
    active: number;
  };
  orders: {
    total: number;
  };
  revenue: {
    total: number;
    platformCommission: number;
    pendingCommission: number;
  };
  users: {
    totalCustomers: number;
  };
  menuItems: {
    total: number;
  };
}

export default function SuperAdminDashboard() {
  const [analytics, setAnalytics] = useState<PlatformAnalytics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAnalytics();
    const interval = setInterval(fetchAnalytics, 60000);
    return () => clearInterval(interval);
  }, []);

  const fetchAnalytics = async () => {
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/admin/superadmin/analytics/overview`,
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
        setAnalytics(data.data);
      } else {
        toast.error("Failed to fetch analytics");
      }
    } catch (error) {
      console.error("Error fetching analytics:", error);
      toast.error("Error loading analytics");
    } finally {
      setLoading(false);
    }
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
      label: "Total Restaurants",
      value: analytics?.restaurants.total || 0,
      icon: Store,
      iconBg: "bg-blue-50",
      iconColor: "text-blue-600",
    },
    {
      label: "Active Restaurants",
      value: analytics?.restaurants.active || 0,
      icon: TrendingUp,
      iconBg: "bg-green-50",
      iconColor: "text-green-600",
    },
    {
      label: "Total Orders",
      value: analytics?.orders.total || 0,
      icon: ShoppingBag,
      iconBg: "bg-purple-50",
      iconColor: "text-purple-600",
    },
    {
      label: "Total Customers",
      value: analytics?.users.totalCustomers || 0,
      icon: Users,
      iconBg: "bg-orange-50",
      iconColor: "text-orange-600",
    },
  ];

  return (
    <div className="space-y-6 w-full p-6 bg-gray-50">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">
            Platform Dashboard
          </h2>
          <p className="text-sm text-gray-600">
            Overview of your entire platform
          </p>
        </div>
        <Button onClick={fetchAnalytics} variant="outline" size="sm">
          Refresh
        </Button>
      </div>

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

      {/* Revenue Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">
            Revenue Overview
          </h3>
          <div className="space-y-4">
            <div className="flex justify-between items-center p-4 bg-blue-50 rounded-lg">
              <div>
                <p className="text-sm text-gray-600">Total Revenue</p>
                <p className="text-2xl font-bold text-blue-600">
                  ₹{analytics?.revenue.total || 0}
                </p>
              </div>
              <DollarSign className="w-8 h-8 text-blue-600" />
            </div>
            <div className="flex justify-between items-center p-4 bg-green-50 rounded-lg">
              <div>
                <p className="text-sm text-gray-600">Platform Commission</p>
                <p className="text-2xl font-bold text-green-600">
                  ₹{analytics?.revenue.platformCommission || 0}
                </p>
              </div>
              <TrendingUp className="w-8 h-8 text-green-600" />
            </div>
            <div className="flex justify-between items-center p-4 bg-orange-50 rounded-lg">
              <div>
                <p className="text-sm text-gray-600">Pending Commission</p>
                <p className="text-2xl font-bold text-orange-600">
                  ₹{analytics?.revenue.pendingCommission || 0}
                </p>
              </div>
              <DollarSign className="w-8 h-8 text-orange-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">
            Platform Statistics
          </h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 border-b">
              <span className="text-gray-600">Total Menu Items</span>
              <span className="font-semibold text-gray-800">
                {analytics?.menuItems.total || 0}
              </span>
            </div>
            <div className="flex items-center justify-between p-3 border-b">
              <span className="text-gray-600">Active Restaurants</span>
              <span className="font-semibold text-green-600">
                {analytics?.restaurants.active || 0}
              </span>
            </div>
            <div className="flex items-center justify-between p-3 border-b">
              <span className="text-gray-600">Inactive Restaurants</span>
              <span className="font-semibold text-red-600">
                {(analytics?.restaurants.total || 0) -
                  (analytics?.restaurants.active || 0)}
              </span>
            </div>
            <div className="flex items-center justify-between p-3">
              <span className="text-gray-600">Avg Revenue/Restaurant</span>
              <span className="font-semibold text-blue-600">
                ₹
                {analytics?.restaurants.total
                  ? (
                      analytics.revenue.total / analytics.restaurants.total
                    )
                  : 0}
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
            href="/superadmin/restaurants"
            className="p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-all cursor-pointer"
          >
            <Store className="mx-auto mb-2 text-gray-400" size={32} />
            <p className="text-sm font-medium text-gray-700 text-center">
              Manage Restaurants
            </p>
          </a>
          <a
            href="/superadmin/commissions"
            className="p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-green-500 hover:bg-green-50 transition-all cursor-pointer"
          >
            <DollarSign className="mx-auto mb-2 text-gray-400" size={32} />
            <p className="text-sm font-medium text-gray-700 text-center">
              Settle Commissions
            </p>
          </a>
          <a
            href="/superadmin/admins"
            className="p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-purple-500 hover:bg-purple-50 transition-all cursor-pointer"
          >
            <UserPlus className="mx-auto mb-2 text-gray-400" size={32} />
            <p className="text-sm font-medium text-gray-700 text-center">
              Create Admin
            </p>
          </a>
        </div>
      </div>
    </div>
  );
}
