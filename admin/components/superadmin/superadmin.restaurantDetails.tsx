"use client";
import { useEffect, useState } from "react";
import {
  Store,
  ArrowLeft,
  Edit,
  DollarSign,
  ShoppingBag,
  Users,
  ChefHat,
  Utensils,
  Clock,
  Save,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface Admin {
  user: {
    id: number;
    name: string;
    email: string;
    phone: string | null;
  };
}

interface Chef {
  user: {
    id: number;
    name: string;
    email: string;
    phone: string | null;
  };
  specialization: string | null;
  shiftStart: string | null;
  shiftEnd: string | null;
}

interface RestaurantDetails {
  id: number;
  name: string;
  description: string | null;
  address: string | null;
  contactNumber: string | null;
  imageUrl: string | null;
  commissionRate: string;
  baseWaitingTimeMultiplier: string;
  fixedAdditionalTime: number;
  isActive: boolean;
  createdAt: string;
  admins: Admin[];
  chefs: Chef[];
  _count: {
    orders: number;
    menuItems: number;
  };
  stats: {
    totalRevenue: number;
    totalCommission: number;
    pendingCommission: number;
    settledCommission: number;
  };
}

export default function RestaurantDetailsPage({ id }: { id: string }) {
  const [restaurant, setRestaurant] = useState<RestaurantDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editFormData, setEditFormData] = useState({
    name: "",
    description: "",
    address: "",
    contactNumber: "",
    commissionRate: "",
    baseWaitingTimeMultiplier: "",
    fixedAdditionalTime: "",
    isActive: true,
  });

  useEffect(() => {
    fetchRestaurantDetails();
  }, [id]);

  const fetchRestaurantDetails = async () => {
    try {
      setLoading(true);
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/admin/superadmin/restaurants/${id}`,
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
        setRestaurant(data.data);
      } else {
        toast.error(data.message || "Failed to fetch restaurant details");
      }
    } catch (error) {
      console.error("Error fetching restaurant details:", error);
      toast.error("Error loading restaurant details");
    } finally {
      setLoading(false);
    }
  };

  const openEditDialog = () => {
    if (!restaurant) return;
    setEditFormData({
      name: restaurant.name,
      description: restaurant.description || "",
      address: restaurant.address || "",
      contactNumber: restaurant.contactNumber || "",
      commissionRate: restaurant.commissionRate,
      baseWaitingTimeMultiplier: restaurant.baseWaitingTimeMultiplier,
      fixedAdditionalTime: String(restaurant.fixedAdditionalTime),
      isActive: restaurant.isActive,
    });
    setIsEditDialogOpen(true);
  };

  const handleEditInputChange = (field: string, value: string | boolean) => {
    setEditFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleUpdateRestaurant = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/admin/superadmin/restaurants/${id}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({
            name: editFormData.name,
            description: editFormData.description || null,
            address: editFormData.address || null,
            contactNumber: editFormData.contactNumber || null,
            commissionRate: editFormData.commissionRate,
            baseWaitingTimeMultiplier: editFormData.baseWaitingTimeMultiplier,
            fixedAdditionalTime: editFormData.fixedAdditionalTime,
            isActive: editFormData.isActive,
          }),
        }
      );

      const data = await response.json();

      if (data.success) {
        toast.success("Restaurant updated successfully!");
        setIsEditDialogOpen(false);
        fetchRestaurantDetails();
      } else {
        toast.error(data.message || "Failed to update restaurant");
      }
    } catch (error) {
      console.error("Error updating restaurant:", error);
      toast.error("Error updating restaurant");
    } finally {
      setIsSubmitting(false);
    }
  };

  const settleRestaurantCommissions = async () => {
    if (!restaurant) return;
    if (!confirm(`Settle all pending commissions for ${restaurant.name}?`)) return;

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/admin/superadmin/commissions/settle`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({
            restaurantId: restaurant.id,
            settleAll: true,
          }),
        }
      );

      const data = await response.json();

      if (data.success) {
        toast.success(`${data.data.settledCount} commission(s) settled!`);
        fetchRestaurantDetails();
      } else {
        toast.error(data.message || "Failed to settle commissions");
      }
    } catch (error) {
      console.error("Error settling commissions:", error);
      toast.error("Error settling commissions");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600"></div>
      </div>
    );
  }

  if (!restaurant) {
    return (
      <div className="p-6">
        <p className="text-gray-500">Restaurant not found</p>
        <a href="/superadmin/restaurants">
          <Button variant="outline" className="mt-4">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Restaurants
          </Button>
        </a>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div className="flex items-center gap-4">
          <a href="/superadmin/restaurants">
            <Button variant="outline" size="icon">
              <ArrowLeft className="w-4 h-4" />
            </Button>
          </a>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-gray-800">{restaurant.name}</h1>
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
            </div>
            <p className="text-sm text-gray-600 mt-1">{restaurant.address || "No address"}</p>
          </div>
        </div>
        <Button onClick={openEditDialog} className="gap-2">
          <Edit className="w-4 h-4" />
          Edit Restaurant
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow-sm p-5">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm text-gray-600">Total Revenue</p>
            <DollarSign className="w-5 h-5 text-green-600" />
          </div>
          <p className="text-2xl font-bold text-gray-800">
            ₹{restaurant.stats.totalRevenue}
          </p>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-5">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm text-gray-600">Total Orders</p>
            <ShoppingBag className="w-5 h-5 text-blue-600" />
          </div>
          <p className="text-2xl font-bold text-gray-800">
            {restaurant._count.orders}
          </p>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-5">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm text-gray-600">Pending Commission</p>
            <Clock className="w-5 h-5 text-yellow-600" />
          </div>
          <p className="text-2xl font-bold text-yellow-600">
            ₹{restaurant.stats.pendingCommission}
          </p>
          {restaurant.stats.pendingCommission > 0 && (
            <Button
              size="sm"
              onClick={settleRestaurantCommissions}
              className="mt-2 bg-green-600 hover:bg-green-700 w-full"
            >
              Settle All
            </Button>
          )}
        </div>

        <div className="bg-white rounded-lg shadow-sm p-5">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm text-gray-600">Menu Items</p>
            <Utensils className="w-5 h-5 text-orange-600" />
          </div>
          <p className="text-2xl font-bold text-gray-800">
            {restaurant._count.menuItems}
          </p>
        </div>
      </div>

      {/* Restaurant Info & Settings */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Info */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Restaurant Info</h3>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-600">Contact</span>
              <span className="font-medium">{restaurant.contactNumber || "N/A"}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Commission Rate</span>
              <span className="font-medium text-orange-600">{restaurant.commissionRate}%</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Waiting Time Multiplier</span>
              <span className="font-medium">{restaurant.baseWaitingTimeMultiplier}x</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Fixed Additional Time</span>
              <span className="font-medium">{restaurant.fixedAdditionalTime} mins</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Total Commission Earned</span>
              <span className="font-medium text-green-600">₹{restaurant.stats.totalCommission}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Settled Commission</span>
              <span className="font-medium">₹{restaurant.stats.settledCommission}</span>
            </div>
          </div>
        </div>

        {/* Description */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Description</h3>
          <p className="text-gray-600">
            {restaurant.description || "No description provided."}
          </p>
        </div>
      </div>

      {/* Staff Tables */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Admins */}
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          <div className="p-4 border-b flex items-center gap-2">
            <Users className="w-5 h-5 text-blue-600" />
            <h3 className="font-semibold text-gray-800">Admins ({restaurant.admins.length})</h3>
          </div>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Phone</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {restaurant.admins.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={3} className="text-center text-gray-500 py-4">
                    No admins assigned
                  </TableCell>
                </TableRow>
              ) : (
                restaurant.admins.map((admin) => (
                  <TableRow key={admin.user.id}>
                    <TableCell className="font-medium">{admin.user.name}</TableCell>
                    <TableCell className="text-sm">{admin.user.email}</TableCell>
                    <TableCell className="text-sm">{admin.user.phone || "N/A"}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {/* Chefs */}
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          <div className="p-4 border-b flex items-center gap-2">
            <ChefHat className="w-5 h-5 text-orange-600" />
            <h3 className="font-semibold text-gray-800">Chefs ({restaurant.chefs.length})</h3>
          </div>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Specialization</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {restaurant.chefs.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={3} className="text-center text-gray-500 py-4">
                    No chefs assigned
                  </TableCell>
                </TableRow>
              ) : (
                restaurant.chefs.map((chef) => (
                  <TableRow key={chef.user.id}>
                    <TableCell className="font-medium">{chef.user.name}</TableCell>
                    <TableCell className="text-sm">{chef.user.email}</TableCell>
                    <TableCell className="text-sm">{chef.specialization || "N/A"}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
          <form onSubmit={handleUpdateRestaurant}>
            <DialogHeader>
              <DialogTitle>Edit Restaurant</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="name">Restaurant Name *</Label>
                <Input
                  id="name"
                  value={editFormData.name}
                  onChange={(e) => handleEditInputChange("name", e.target.value)}
                  required
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={editFormData.description}
                  onChange={(e) => handleEditInputChange("description", e.target.value)}
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="address">Address</Label>
                  <Input
                    id="address"
                    value={editFormData.address}
                    onChange={(e) => handleEditInputChange("address", e.target.value)}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="contactNumber">Contact Number</Label>
                  <Input
                    id="contactNumber"
                    value={editFormData.contactNumber}
                    onChange={(e) => handleEditInputChange("contactNumber", e.target.value)}
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="commissionRate">Commission Rate (%)</Label>
                  <Input
                    id="commissionRate"
                    type="number"
                    min="0"
                    max="100"
                    step="0.1"
                    value={editFormData.commissionRate}
                    onChange={(e) => handleEditInputChange("commissionRate", e.target.value)}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="baseWaitingTimeMultiplier">Time Multiplier</Label>
                  <Input
                    id="baseWaitingTimeMultiplier"
                    type="number"
                    min="0.1"
                    max="10"
                    step="0.1"
                    value={editFormData.baseWaitingTimeMultiplier}
                    onChange={(e) => handleEditInputChange("baseWaitingTimeMultiplier", e.target.value)}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="fixedAdditionalTime">Fixed Time (mins)</Label>
                  <Input
                    id="fixedAdditionalTime"
                    type="number"
                    min="0"
                    value={editFormData.fixedAdditionalTime}
                    onChange={(e) => handleEditInputChange("fixedAdditionalTime", e.target.value)}
                  />
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Switch
                  id="isActive"
                  checked={editFormData.isActive}
                  onCheckedChange={(checked) => handleEditInputChange("isActive", checked)}
                />
                <Label htmlFor="isActive">Restaurant Active</Label>
              </div>
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsEditDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Saving..." : "Save Changes"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
