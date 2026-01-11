"use client";
import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
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
import { Loader2, Eye, RefreshCw, Pencil, Plus, Minus, Trash2, Search, X, Save } from "lucide-react";
import { toast } from "sonner";

interface User {
  id: number;
  name: string;
  email: string;
  phone: string;
}

interface MenuItem {
  id: number;
  name: string;
  price: string;
  imageUrl: string;
  isVeg: boolean;
}

interface OrderItem {
  id: number;
  menuItemId: number;
  quantity: number;
  price: string;
  waitingTime: number;
  menuItem: MenuItem;
}

interface Payment {
  id: number;
  status: string;
  gatewayPaymentId: string;
  amount: string;
  createdAt: string;
}

interface TimeSlot {
  id: number;
  slotStart: string;
  slotEnd: string;
}

interface Order {
  id: number;
  userId: number;
  restaurantId: number;
  status: "Waiting" | "Finished" | "Delivered" | "Cancelled";
  restaurantStatus:
    | "Pending"
    | "Accepted"
    | "Rejected"
    | "Preparing"
    | "Ready"
    | "Completed";
  totalAmount: string;
  paymentStatus: "pending" | "paid" | "failed" | "refunded";
  notes: string;
  estimatedWaitingTime: number | null;
  estimatedReadyTime: string | null;
  rejectionReason: string | null;
  createdAt: string;
  updatedAt: string;
  user: User;
  orderItems: OrderItem[];
  timeSlot: TimeSlot | null;
  payment: Payment | null;
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

interface AvailableMenuItem {
  id: number;
  name: string;
  price: string;
  imageUrl: string;
  isVeg: boolean;
  category: { id: number; name: string } | null;
  waitingTime: number;
}

interface EditableOrderItem {
  id?: number;
  menuItemId: number;
  quantity: number;
  price: string;
  menuItem: {
    id: number;
    name: string;
    price: string;
    imageUrl: string;
    isVeg: boolean;
  };
  isNew?: boolean;
}

export default function OrdersTable() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState<boolean>(false);
  const [updatingOrderId, setUpdatingOrderId] = useState<number | null>(null);
  const [rejectionReason, setRejectionReason] = useState<string>("");
  
  // Edit mode states
  const [isEditMode, setIsEditMode] = useState<boolean>(false);
  const [editLoading, setEditLoading] = useState<boolean>(false);
  const [saveLoading, setSaveLoading] = useState<boolean>(false);
  const [editableItems, setEditableItems] = useState<EditableOrderItem[]>([]);
  const [availableMenuItems, setAvailableMenuItems] = useState<AvailableMenuItem[]>([]);
  const [availableTimeSlots, setAvailableTimeSlots] = useState<TimeSlot[]>([]);
  const [selectedTimeSlotId, setSelectedTimeSlotId] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [showAddItemPanel, setShowAddItemPanel] = useState<boolean>(false);

  useEffect(() => {
    fetchOrders();
    const interval = setInterval(fetchOrders, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/admin/orders`,
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

  const updateOrderStatus = async (
    orderId: number,
    restaurantStatus: string
  ) => {
    try {
      setUpdatingOrderId(orderId);

      const body: any = { restaurantStatus };

      if (restaurantStatus === "Rejected" && rejectionReason) {
        body.rejectionReason = rejectionReason;
      }

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/admin/orders/${orderId}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify(body),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to update order status");
      }

      toast.success("Order status updated successfully");
      setRejectionReason("");
      fetchOrders();
    } catch (error: any) {
      console.error("Error updating order status:", error);
      toast.error(error.message || "Failed to update order status");
    } finally {
      setUpdatingOrderId(null);
    }
  };

  const getRestaurantStatusBadge = (status: string) => {
    const variants: Record<string, string> = {
      Pending: "bg-yellow-100 text-yellow-800 border-yellow-200",
      Accepted: "bg-blue-100 text-blue-800 border-blue-200",
      Rejected: "bg-red-100 text-red-800 border-red-200",
      Preparing: "bg-purple-100 text-purple-800 border-purple-200",
      Ready: "bg-green-100 text-green-800 border-green-200",
      Completed: "bg-gray-100 text-gray-800 border-gray-200",
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

  const getPaymentBadge = (status: string) => {
    const variants: Record<string, string> = {
      pending: "bg-orange-100 text-orange-800 border-orange-200",
      paid: "bg-green-100 text-green-800 border-green-200",
      failed: "bg-red-100 text-red-800 border-red-200",
      refunded: "bg-purple-100 text-purple-800 border-purple-200",
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

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  };

  // Fetch order details for editing
  const fetchOrderForEdit = async (orderId: number) => {
    try {
      setEditLoading(true);
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/admin/orders/${orderId}/edit`,
        {
          method: "GET",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Cannot edit this order");
      }

      // Set editable items
      setEditableItems(
        data.data.order.orderItems.map((item: OrderItem) => ({
          id: item.id,
          menuItemId: item.menuItemId,
          quantity: item.quantity,
          price: item.price,
          menuItem: item.menuItem,
        }))
      );

      setAvailableMenuItems(data.data.availableMenuItems || []);
      setAvailableTimeSlots(data.data.availableTimeSlots || []);
      setSelectedTimeSlotId(data.data.order.timeSlot?.id || null);
      
      // If no menu items from edit endpoint, fetch from menu route
      if (!data.data.availableMenuItems || data.data.availableMenuItems.length === 0) {
        await fetchMenuItems();
      }
      
      setIsEditMode(true);
    } catch (error: any) {
      console.error("Error fetching order for edit:", error);
      toast.error(error.message || "Cannot edit this order");
    } finally {
      setEditLoading(false);
    }
  };

  // Save edited order
  const saveOrderChanges = async () => {
    if (!selectedOrder) return;

    try {
      setSaveLoading(true);

      const orderItems = editableItems.map((item) => ({
        menuItemId: item.menuItemId,
        quantity: item.quantity,
        price: item.price,
      }));

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/admin/orders/${selectedOrder.id}/edit/update`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({
            orderItems,
            timeSlotId: selectedTimeSlotId,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to update order");
      }

      toast.success(data.message || "Order updated successfully");
      setIsEditMode(false);
      setIsDialogOpen(false);
      fetchOrders();
    } catch (error: any) {
      console.error("Error saving order:", error);
      toast.error(error.message || "Failed to save order changes");
    } finally {
      setSaveLoading(false);
    }
  };

  // Add item to order
  const addItemToOrder = (menuItem: AvailableMenuItem) => {
    const existingItem = editableItems.find(
      (item) => item.menuItemId === menuItem.id
    );

    if (existingItem) {
      setEditableItems(
        editableItems.map((item) =>
          item.menuItemId === menuItem.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        )
      );
    } else {
      setEditableItems([
        ...editableItems,
        {
          menuItemId: menuItem.id,
          quantity: 1,
          price: menuItem.price,
          menuItem: {
            id: menuItem.id,
            name: menuItem.name,
            price: menuItem.price,
            imageUrl: menuItem.imageUrl,
            isVeg: menuItem.isVeg,
          },
          isNew: true,
        },
      ]);
    }
    toast.success(`${menuItem.name} added`);
  };

  // Update item quantity
  const updateItemQuantity = (menuItemId: number, delta: number) => {
    setEditableItems(
      editableItems
        .map((item) => {
          if (item.menuItemId === menuItemId) {
            const newQty = item.quantity + delta;
            return newQty > 0 ? { ...item, quantity: newQty } : null;
          }
          return item;
        })
        .filter((item): item is EditableOrderItem => item !== null)
    );
  };

  // Remove item from order
  const removeItemFromOrder = (menuItemId: number) => {
    if (editableItems.length <= 1) {
      toast.error("Order must have at least one item");
      return;
    }
    setEditableItems(editableItems.filter((item) => item.menuItemId !== menuItemId));
  };

  // Calculate total for editable items
  const calculateEditableTotal = () => {
    return editableItems.reduce(
      (sum, item) => sum + Number(item.price) * item.quantity,
      0
    );
  };

  // Filter menu items by search
  const filteredMenuItems = availableMenuItems.filter(
    (item) =>
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.category?.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Cancel edit mode
  const cancelEdit = () => {
    setIsEditMode(false);
    setEditableItems([]);
    setSearchQuery("");
    setShowAddItemPanel(false);
  };

  // Check if order can be edited
  // Orders can only be edited when NOT paid
  const canEditOrder = (order: Order) => {
    return (
      order.paymentStatus !== "paid" &&
      ["Pending", "Accepted"].includes(order.restaurantStatus) &&
      order.status !== "Cancelled"
    );
  };

  // Fetch menu items for adding to order
  const fetchMenuItems = async () => {
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/admin/menu`,
        {
          method: "GET",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
        }
      );

      const data = await response.json();

      if (response.ok && data.data?.menuItems) {
        setAvailableMenuItems(data.data.menuItems);
      }
    } catch (error) {
      console.error("Error fetching menu items:", error);
    }
  };

  return (
    <div className="space-y-4 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Orders</h2>
          <p className="text-gray-600 text-sm">
            Manage your restaurant orders
          </p>
        </div>
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

      {/* Table */}
      <div className="border rounded-lg bg-white">
        <Table>
          <TableCaption>A list of all orders from customers.</TableCaption>
          <TableHeader>
            <TableRow>
              <TableHead>Order ID</TableHead>
              <TableHead>Customer</TableHead>
              <TableHead>Items</TableHead>
              <TableHead>Time Slot</TableHead>
              <TableHead>Amount</TableHead>
              <TableHead>Payment</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Date</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={9} className="text-center py-8">
                  <Loader2 className="w-6 h-6 animate-spin mx-auto" />
                  <p className="text-sm text-gray-500 mt-2">
                    Loading orders...
                  </p>
                </TableCell>
              </TableRow>
            ) : orders.length === 0 ? (
              <TableRow>
                <TableCell colSpan={9} className="text-center py-8">
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
                  <TableCell>
                    {order.timeSlot ? (
                      <div className="text-sm">
                        {formatTime(order.timeSlot.slotStart)} -{" "}
                        {formatTime(order.timeSlot.slotEnd)}
                      </div>
                    ) : (
                      <span className="text-gray-400 text-sm">No slot</span>
                    )}
                  </TableCell>
                  <TableCell className="font-semibold">
                    ₹{Number(order.totalAmount)}
                  </TableCell>
                  <TableCell>{getPaymentBadge(order.paymentStatus)}</TableCell>
                  <TableCell>
                    {updatingOrderId === order.id ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Select
                        value={order.restaurantStatus}
                        onValueChange={(value) =>
                          updateOrderStatus(order.id, value)
                        }
                        disabled={
                          order.restaurantStatus === "Completed" ||
                          order.restaurantStatus === "Rejected"
                        }
                      >
                        <SelectTrigger className="max-w-32 w-full">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Pending">Pending</SelectItem>
                          <SelectItem value="Accepted">Accepted</SelectItem>
                          <SelectItem value="Rejected">Rejected</SelectItem>
                          <SelectItem value="Preparing">Preparing</SelectItem>
                          <SelectItem value="Ready">Ready</SelectItem>
                          <SelectItem value="Completed">Completed</SelectItem>
                        </SelectContent>
                      </Select>
                    )}
                  </TableCell>
                  <TableCell className="text-sm text-gray-600">
                    {formatDate(order.createdAt)}
                  </TableCell>
                  <TableCell className="text-right">
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
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Order Details Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={(open) => {
        setIsDialogOpen(open);
        if (!open) {
          cancelEdit();
        }
      }}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              Order #{selectedOrder?.id}
              {isEditMode && (
                <Badge variant="outline" className="bg-blue-100 text-blue-800">
                  Editing
                </Badge>
              )}
            </DialogTitle>
            <DialogDescription>
              {isEditMode 
                ? "Edit order items and details. Changes will be notified to the customer."
                : "Complete information about this order"}
            </DialogDescription>
          </DialogHeader>

          {selectedOrder && !isEditMode && (
            <div className="space-y-6">
              {/* Order Status */}
              <div>
                <h3 className="font-semibold mb-2">Order Status</h3>
                <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Restaurant Status:</span>
                    {getRestaurantStatusBadge(selectedOrder.restaurantStatus)}
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Payment Status:</span>
                    {getPaymentBadge(selectedOrder.paymentStatus)}
                  </div>
                  {selectedOrder.estimatedWaitingTime && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Estimated Time:</span>
                      <span className="font-medium">
                        {selectedOrder.estimatedWaitingTime} minutes
                      </span>
                    </div>
                  )}
                  {selectedOrder.rejectionReason && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Rejection Reason:</span>
                      <span className="font-medium text-red-600">
                        {selectedOrder.rejectionReason}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Customer Info */}
              <div>
                <h3 className="font-semibold mb-2">Customer Information</h3>
                <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Name:</span>
                    <span className="font-medium">
                      {selectedOrder.user.name}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Phone:</span>
                    <span className="font-medium">
                      {selectedOrder.user.phone}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Email:</span>
                    <span className="font-medium">
                      {selectedOrder.user.email}
                    </span>
                  </div>
                </div>
              </div>

              {/* Order Items */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-semibold">Order Items</h3>
                  {canEditOrder(selectedOrder) && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => fetchOrderForEdit(selectedOrder.id)}
                      disabled={editLoading}
                    >
                      {editLoading ? (
                        <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                      ) : (
                        <Pencil className="w-4 h-4 mr-1" />
                      )}
                      Edit Items
                    </Button>
                  )}
                </div>
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
                
                {/* Edit Notice for Unpaid Orders */}
                {canEditOrder(selectedOrder) && (
                  <div className="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <p className="text-sm text-yellow-800">
                      <span className="font-medium">Note:</span> This order is not yet paid. You can edit items before customer completes payment.
                    </p>
                  </div>
                )}
                
                {/* Paid Order Notice */}
                {selectedOrder.paymentStatus === "paid" && (
                  <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded-lg">
                    <p className="text-sm text-green-800">
                      <span className="font-medium">✓ Paid:</span> This order has been paid and cannot be modified.
                    </p>
                  </div>
                )}
              </div>

              {/* Time Slot */}
              {selectedOrder.timeSlot && (
                <div>
                  <h3 className="font-semibold mb-2">Pickup Time</h3>
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <p className="font-medium">
                      {formatTime(selectedOrder.timeSlot.slotStart)} -{" "}
                      {formatTime(selectedOrder.timeSlot.slotEnd)}
                    </p>
                    <p className="text-sm text-gray-600 mt-1">
                      {new Date(
                        selectedOrder.timeSlot.slotStart
                      ).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              )}

              {/* Payment Info */}
              <div>
                <h3 className="font-semibold mb-2">Payment Information</h3>
                <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Status:</span>
                    {getPaymentBadge(selectedOrder.paymentStatus)}
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Amount:</span>
                    <span className="font-bold text-lg">
                      ₹{Number(selectedOrder.totalAmount)}
                    </span>
                  </div>
                  {selectedOrder.payment?.gatewayPaymentId && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Payment ID:</span>
                      <span className="font-mono text-sm">
                        {selectedOrder.payment.gatewayPaymentId}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Notes */}
              {selectedOrder.notes && (
                <div>
                  <h3 className="font-semibold mb-2">Notes</h3>
                  <div className="bg-yellow-50 p-4 rounded-lg">
                    <p className="text-sm">{selectedOrder.notes}</p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Edit Mode View */}
          {selectedOrder && isEditMode && (
            <div className="space-y-6">
              {/* Current Order Items - Editable */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-semibold">Order Items</h3>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowAddItemPanel(!showAddItemPanel)}
                  >
                    <Plus className="w-4 h-4 mr-1" />
                    Add Item
                  </Button>
                </div>
                
                <div className="border rounded-lg divide-y">
                  {editableItems.map((item) => (
                    <div
                      key={item.menuItemId}
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
                            {item.isNew && (
                              <Badge variant="outline" className="bg-green-100 text-green-700 text-xs">
                                New
                              </Badge>
                            )}
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
                          <p className="text-sm text-gray-600">₹{item.price}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-2 border rounded-lg">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => updateItemQuantity(item.menuItemId, -1)}
                          >
                            <Minus className="w-4 h-4" />
                          </Button>
                          <span className="w-8 text-center font-medium">
                            {item.quantity}
                          </span>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => updateItemQuantity(item.menuItemId, 1)}
                          >
                            <Plus className="w-4 h-4" />
                          </Button>
                        </div>
                        <span className="font-semibold w-16 text-right">
                          ₹{Number(item.price) * item.quantity}
                        </span>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-red-500 hover:text-red-700 hover:bg-red-50"
                          onClick={() => removeItemFromOrder(item.menuItemId)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Total */}
                <div className="mt-3 p-3 bg-gray-50 rounded-lg flex justify-between items-center">
                  <span className="font-semibold">New Total:</span>
                  <span className="text-xl font-bold">₹{calculateEditableTotal()}</span>
                </div>
              </div>

              {/* Add Item Panel */}
              {showAddItemPanel && (
                <div className="border rounded-lg p-4 bg-gray-50">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-semibold">Add Items to Order</h4>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => setShowAddItemPanel(false)}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                  
                  {/* Search */}
                  <div className="relative mb-4">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <Input
                      placeholder="Search menu items..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10"
                    />
                  </div>

                  {/* Menu Items Grid */}
                  <div className="max-h-64 overflow-y-auto">
                    <div className="grid grid-cols-1 gap-2">
                      {filteredMenuItems.map((menuItem) => {
                        const isInOrder = editableItems.some(
                          (item) => item.menuItemId === menuItem.id
                        );
                        return (
                          <div
                            key={menuItem.id}
                            className={`p-3 border rounded-lg flex justify-between items-center ${
                              isInOrder ? "bg-green-50 border-green-200" : "bg-white hover:bg-gray-50"
                            }`}
                          >
                            <div className="flex items-center gap-3">
                              {menuItem.imageUrl && (
                                <img
                                  src={menuItem.imageUrl}
                                  alt={menuItem.name}
                                  className="w-10 h-10 rounded object-cover"
                                />
                              )}
                              <div>
                                <p className="font-medium text-sm flex items-center gap-2">
                                  {menuItem.name}
                                  <span
                                    className={`inline-flex px-1 py-0.5 rounded text-xs ${
                                      menuItem.isVeg
                                        ? "bg-green-100 text-green-700"
                                        : "bg-red-100 text-red-700"
                                    }`}
                                  >
                                    {menuItem.isVeg ? "V" : "NV"}
                                  </span>
                                </p>
                                <p className="text-xs text-gray-500">
                                  {menuItem.category?.name} • ₹{menuItem.price}
                                </p>
                              </div>
                            </div>
                            <Button
                              variant={isInOrder ? "outline" : "default"}
                              size="sm"
                              onClick={() => addItemToOrder(menuItem)}
                            >
                              {isInOrder ? (
                                <>
                                  <Plus className="w-4 h-4 mr-1" />
                                  Add More
                                </>
                              ) : (
                                <>
                                  <Plus className="w-4 h-4 mr-1" />
                                  Add
                                </>
                              )}
                            </Button>
                          </div>
                        );
                      })}
                      {filteredMenuItems.length === 0 && (
                        <p className="text-center text-gray-500 py-4">
                          No items found
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Time Slot Selection */}
              {availableTimeSlots.length > 0 && (
                <div>
                  <h3 className="font-semibold mb-2">Change Pickup Time</h3>
                  <Select
                    value={selectedTimeSlotId?.toString() || ""}
                    onValueChange={(value) => setSelectedTimeSlotId(parseInt(value))}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select a time slot" />
                    </SelectTrigger>
                    <SelectContent>
                      {availableTimeSlots.map((slot) => (
                        <SelectItem key={slot.id} value={slot.id.toString()}>
                          {formatTime(slot.slotStart)} - {formatTime(slot.slotEnd)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>
          )}

          <DialogFooter className="flex gap-2">
            {!isEditMode ? (
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                Close
              </Button>
            ) : (
              <>
                <Button variant="outline" onClick={cancelEdit}>
                  Cancel
                </Button>
                <Button onClick={saveOrderChanges} disabled={saveLoading}>
                  {saveLoading ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Save className="w-4 h-4 mr-2" />
                  )}
                  Save Changes
                </Button>
              </>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}