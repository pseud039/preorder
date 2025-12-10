"use client";
import { useEffect, useState } from "react";
import { Store, Search, Eye } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface Restaurant {
  id: number;
  name: string;
  address: string | null;
  contactNumber: string | null;
  commissionRate: string;
  isActive: boolean;
  stats?: {
    totalOrders: number;
    totalRevenue: number;
    pendingCommission: number;
    totalMenuItems: number;
  };
}

interface RestaurantsResponse {
  statusCode: number;
  data: {
    restaurants: Restaurant[];
    pagination: {
      total: number;
      page: number;
      limit: number;
      totalPages: number;
    };
  };
  message: string;
  success: boolean;
}

export default function RestaurantsPage() {
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [search, setSearch] = useState<string>("");
  const [searchInput, setSearchInput] = useState<string>("");

  useEffect(() => {
    fetchRestaurants();
  }, [search]);

  const fetchRestaurants = async () => {
    try {
      setLoading(true);
      const url = new URL(
        `${process.env.NEXT_PUBLIC_API_URL}/admin/superadmin/restaurants`
      );

      if (search) {
        url.searchParams.append("search", search);
      }

      const response = await fetch(url.toString(), {
        method: "GET",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
      });

      if (response.status === 401) {
        toast.error("Session expired. Please login again.");
        window.location.href = "/login";
        return;
      }

      const data: RestaurantsResponse = await response.json();

      if (data.success) {
        setRestaurants(data.data.restaurants);
      } else {
        toast.error("Failed to fetch restaurants");
      }
    } catch (error) {
      console.error("Error fetching restaurants:", error);
      toast.error("Error loading restaurants");
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    setSearch(searchInput);
  };

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Restaurants</h2>
          <p className="text-sm text-gray-600">
            Manage all restaurants on the platform
          </p>
        </div>
      </div>

      {/* Search */}
      <div className="bg-white rounded-lg shadow-sm p-4">
        <div className="flex gap-3">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              placeholder="Search restaurants..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              className="pl-10"
            />
          </div>
          <Button
            onClick={handleSearch}
            className="bg-orange-600 hover:bg-orange-700"
          >
            Search
          </Button>
        </div>
      </div>

      {/* Table */}
      <div className="border rounded-lg bg-white">
        <Table>
          <TableCaption>A list of all registered restaurants.</TableCaption>
          <TableHeader>
            <TableRow>
              <TableHead>Restaurant Name</TableHead>
              <TableHead>Address</TableHead>
              <TableHead>Contact</TableHead>
              <TableHead>Commission Rate</TableHead>
              <TableHead>Total Orders</TableHead>
              <TableHead>Revenue</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-8">
                  <div className="flex justify-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600"></div>
                  </div>
                </TableCell>
              </TableRow>
            ) : restaurants.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-8">
                  <p className="text-gray-500">No restaurants found</p>
                </TableCell>
              </TableRow>
            ) : (
              restaurants.map((restaurant) => (
                <TableRow key={restaurant.id}>
                  <TableCell className="font-medium">
                    {restaurant.name}
                  </TableCell>
                  <TableCell className="text-sm text-gray-600">
                    {restaurant.address || "N/A"}
                  </TableCell>
                  <TableCell className="text-sm">
                    {restaurant.contactNumber || "N/A"}
                  </TableCell>
                  <TableCell className="font-semibold text-orange-600">
                    {restaurant.commissionRate}%
                  </TableCell>
                  <TableCell>
                    {restaurant.stats?.totalOrders || 0}
                  </TableCell>
                  <TableCell className="font-semibold">
                    ₹{restaurant.stats?.totalRevenue  || 0}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant="outline"
                      className={
                        restaurant.isActive
                          ? "bg-green-100 text-green-800 border-green-200"
                          : "bg-red-100 text-red-800 border-red-200"
                      }
                    >
                      {restaurant.isActive ? "Active" : "Inactive"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <a href={`/superadmin/restaurants/${restaurant.id}`}>
                      <Button variant="ghost" size="sm">
                        <Eye className="w-4 h-4" />
                      </Button>
                    </a>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}