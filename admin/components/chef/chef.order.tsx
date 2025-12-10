"use client";
import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Loader2, Eye, RefreshCw, Clock } from "lucide-react";
import { toast } from "sonner";

interface User {
  id: number;
  name: string;
  phone: string;
}

interface MenuItem {
  id: number;
  name: string;
  isVeg: boolean;
  imageUrl: string;
}

interface OrderItem {
  id: number;
  quantity: number;
  price: string;
  waitingTime: number;
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

interface OrdersResponse {
  statusCode: number;
  data: {
    orders: Order[];
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

export default function ChefOrders() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState<boolean>(false);
  const [updatingOrderId, setUpdatingOrderId] = useState<number | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>("all");

  useEffect(() => {
    fetchOrders();
    const interval = setInterval(fetchOrders, 30000);
    return () => clearInterval(interval);
  }, [statusFilter]);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const url = new URL(`${process.env.NEXT_PUBLIC_API_URL}/admin/chef/orders`);
      
      if (statusFilter !== "all") {
        url.searchParams.append("restaurantStatus", statusFilter);
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

      const data: OrdersResponse = await response.json();

      if (data.success) {
        setOrders(data.data.orders);
      } else {
        toast.error("Failed to fetch orders");
      }
    } catch (error) {
      console.error("Error fetching orders:", error);
      toast.error("Error loading orders");
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
      fetchOrders();
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

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString("en-IN", {
      dateStyle: "medium",
      timeStyle: "short",
    });
  };

  return (
    <div className="space-y-4 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Kitchen Orders</h2>
          <p className="text-gray-600 text-sm">
            Manage your cooking queue
          </p>
        </div>
        <div className="flex gap-3">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Orders</SelectItem>
              <SelectItem value="Accepted">Pending Start</SelectItem>
              <SelectItem value="Preparing">Preparing</SelectItem>
              <SelectItem value="Ready">Ready</SelectItem>
            </SelectContent>
          </Select>
          <Button
            onClick={fetchOrders}
            variant="outline"
            size="sm"
            disabled={loading}
          >
            <RefreshCw
              className={`w-4 h-4 mr-2 ${loading ? "animate-spin" : ""}`}
            />
            Refresh
          </Button>
        </div>
      </div>

      {/* Table */}
      <div className="border rounded-lg bg-white">
        <Table>
          <TableCaption>Your kitchen orders queue.</TableCaption>
          <TableHeader>
            <TableRow>
              <TableHead>Order ID</TableHead>
              <TableHead>Customer</TableHead>
              <TableHead>Items</TableHead>
              <TableHead>Amount</TableHead>
              <TableHead>Time</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8">
                  <Loader2 className="w-6 h-6 animate-spin mx-auto" />
                  <p className="text-sm text-gray-500 mt-2">Loading orders...</p>
                </TableCell>
              </TableRow>
            ) : orders.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8">
                  <p className="text-gray-500">No orders found</p>
                </TableCell>
              </TableRow>
            ) : (
              orders.map((order) => (
                <TableRow key={order.id}>
                  <TableCell className="font-medium">#{order.id}</TableCell>
                  <TableCell>
                    <div className="flex flex-col">
                      <span className="font-medium">{order.user.name}</span>
                      <span className="text-xs text-gray-500">
                        {order.user.phone}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className="text-sm">
                      {order.orderItems.length} item(s)
                    </span>
                  </TableCell>
                  <TableCell className="font-semibold">
                    ₹{Number(order.totalAmount)}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1 text-sm text-gray-600">
                      <Clock className="w-4 h-4" />
                      {order.estimatedWaitingTime || 15} min
                    </div>
                  </TableCell>
                  <TableCell>
                    {updatingOrderId === order.id ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      getStatusBadge(order.restaurantStatus)
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      {order.restaurantStatus === "Accepted" && (
                        <Button
                          size="sm"
                          onClick={() =>
                            updateOrderStatus(order.id, "Preparing")
                          }
                          disabled={updatingOrderId === order.id}
                          className="bg-purple-600 hover:bg-purple-700"
                        >
                          Start
                        </Button>
                      )}
                      {order.restaurantStatus === "Preparing" && (
                        <Button
                          size="sm"
                          onClick={() => updateOrderStatus(order.id, "Ready")}
                          disabled={updatingOrderId === order.id}
                          className="bg-green-600 hover:bg-green-700"
                        >
                          Ready
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setSelectedOrder(order);
                          setIsDialogOpen(true);
                        }}
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Order Details Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Order Details #{selectedOrder?.id}</DialogTitle>
            <DialogDescription>Complete order information</DialogDescription>
          </DialogHeader>

          {selectedOrder && (
            <div className="space-y-6">
              {/* Customer Info */}
              <div>
                <h3 className="font-semibold mb-2">Customer Information</h3>
                <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Name:</span>
                    <span className="font-medium">{selectedOrder.user.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Phone:</span>
                    <span className="font-medium">{selectedOrder.user.phone}</span>
                  </div>
                </div>
              </div>

              {/* Order Status */}
              <div>
                <h3 className="font-semibold mb-2">Status</h3>
                <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Current Status:</span>
                    {getStatusBadge(selectedOrder.restaurantStatus)}
                  </div>
                  {selectedOrder.estimatedWaitingTime && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Estimated Time:</span>
                      <span className="font-medium">
                        {selectedOrder.estimatedWaitingTime} minutes
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Order Items */}
              <div>
                <h3 className="font-semibold mb-2">Order Items</h3>
                <div className="border rounded-lg divide-y">
                  {selectedOrder.orderItems.map((item) => (
                    <div
                      key={item.id}
                      className="p-3 flex justify-between items-center"
                    >
                      <div className="flex items-center gap-3">
                        {item.menuItem.imageUrl && (
                          <img
                            src={item.menuItem.imageUrl}
                            alt={item.menuItem.name}
                            className="w-12 h-12 rounded object-cover"
                          />
                        )}
                        <div>
                          <p className="font-medium flex items-center gap-2">
                            {item.menuItem.name}
                            <span
                              className={`inline-flex px-1.5 py-0.5 rounded text-xs ${
                                item.menuItem.isVeg
                                  ? "bg-green-100 text-green-700"
                                  : "bg-red-100 text-red-700"
                              }`}
                            >
                              {item.menuItem.isVeg ? "Veg" : "Non-Veg"}
                            </span>
                          </p>
                          <p className="text-sm text-gray-600">
                            Qty: {item.quantity} × ₹{item.price}
                          </p>
                        </div>
                      </div>
                      <span className="font-semibold">
                        ₹{(Number(item.price) * item.quantity)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Total */}
              <div className="bg-blue-50 p-4 rounded-lg">
                <div className="flex justify-between items-center">
                  <span className="font-semibold text-lg">Total Amount:</span>
                  <span className="font-bold text-xl text-blue-600">
                    ₹{Number(selectedOrder.totalAmount)}
                  </span>
                </div>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
        </Dialog>
    </div>
  );
}
