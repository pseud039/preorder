"use client";
import { useState, useEffect } from "react";
import {
  Trash2,
  Plus,
  Minus,
  ShoppingBag,
  ArrowLeft,
  Loader2,
  Ghost,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import UserDetailsModal from "@/components/detailsModal";
import OTPVerificationModal from "@/components/verificationModal";
import TimeSlotModal from "@/components/slotBookingModal";
import { fetchWithAuth } from "@/lib/auth";
import { Button } from "./ui/button";

interface MenuItem {
  id: number;
  name: string;
  description: string;
  price: number;
  imageUrl: string;
  isAvailable: boolean;
  isActive: boolean;
  isVeg: boolean;
  category: string;
}

interface CartItem {
  id: number;
  cartId: number;
  menuItemId: number;
  quantity: number;
  price: number;
  createdAt: string;
  updatedAt: string;
  menuItem: MenuItem;
}

interface Cart {
  id: number;
  userId: number;
  restaurantId: number;
  createdAt: string;
  updatedAt: string;
  items: CartItem[];
  totalAmount: number;
  itemCount: number;
}

interface UserDetails {
  name: string;
  phone: string;
  phoneVerified: boolean;
}

interface ApiResponse {
  success: boolean;
  message: string;
  data: {
    cart: Cart;
  };
}

export default function CartPage() {
  const [cart, setCart] = useState<Cart | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [updating, setUpdating] = useState<number | null>(null);
  const [userDetails, setUserDetails] = useState<UserDetails | null>(null);
  const router = useRouter();
  const [showUserDetailsModal, setShowUserDetailsModal] = useState(false);
  const [showOTPModal, setShowOTPModal] = useState(false);
  const [showTimeSlotModal, setShowTimeSlotModal] = useState(false);
  const [tempPhone, setTempPhone] = useState("");
  const [selectedSlotId, setSelectedSlotId] = useState<number | null>(null);

  useEffect(() => {
    fetchCart();
    checkUserDetails();
  }, []);

  const checkUserDetails = async () => {
    try {
      const token = localStorage.getItem("accessToken");

      if (!token) {
        return;
      }

      const response = await fetchWithAuth(
        `${process.env.NEXT_PUBLIC_API_URL}/client/details`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          credentials: "include",
        }
      );

      if (!response.ok) {
        console.log("User details not found");
        return;
      }

      const data = await response.json();

      if (data.data) {
        setUserDetails({
          name: data.data.name || "",
          phone: data.data.phone || "",
          phoneVerified: data.data.phoneVerified || false,
        });
      }
    } catch (error) {
      console.error("Error fetching user details:", error);
    }
  };

  const fetchCart = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("accessToken");

      if (!token) {
        toast.error("Please login first");
        router.push("/login");
        return;
      }

      console.log("Token present:", !!token);

      const response = await fetchWithAuth(
        `${process.env.NEXT_PUBLIC_API_URL}/client/order`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          credentials: "include",
        }
      );

      console.log("Response status:", response.status);

      const data = await response.json();

      if (!response.ok) {
        if (response.status === 401) {
          toast.error("Session expired. Please login again");
          localStorage.removeItem("auth_token");
          router.push("/login");
          return;
        }
        if (response.status === 404) {
          console.log("Cart not found - showing empty state");
          setCart(null);
          return;
        }
        throw new Error(data.message || "Failed to fetch cart");
      }

      let cartData = null;

      console.log("Trying to extract cart from:", {
        hasDataCart: !!(data.data && data.data.cart),
        hasMessageCart: !!(data.message && data.message.cart),
        hasCart: !!data.cart,
        dataKeys: Object.keys(data),
      });

      if (
        data.message &&
        typeof data.message === "object" &&
        data.message.cart
      ) {
        cartData = data.message.cart;
      } else if (data.data && data.data.cart) {
        cartData = data.data.cart;
      } else if (data.cart) {
        cartData = data.cart;
      } else if (data.data) {
        cartData = data.data;
      }

      console.log("Extracted cart data:", cartData);
      setCart(cartData);
    } catch (error: any) {
      console.error("Error:", error);
      console.error("Error message:", error.message);
      if (error.message !== "Cart not found") {
        toast.error(error.message || "Failed to load cart");
      }
    } finally {
      setLoading(false);
    }
  };
  const updateQuantity = async (cartItemId: number, newQuantity: number) => {
    try {
      setUpdating(cartItemId);
      const token = localStorage.getItem("accessToken");

      if (!token) {
        toast.error("Please login first");
        router.push("/login");
        return;
      }

      const response = await fetchWithAuth(
        `${process.env.NEXT_PUBLIC_API_URL}/client/update`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          credentials: "include",
          body: JSON.stringify({
            cartItemId,
            quantity: newQuantity,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to update cart");
      }

      await fetchCart();
      toast.success(newQuantity === 0 ? "Item removed" : "Quantity updated");
    } catch (error: any) {
      console.error("Error updating cart:", error);
      toast.error(error.message || "Failed to update cart");
    } finally {
      setUpdating(null);
    }
  };

  const removeItem = async (cartItemId: number) => {
    try {
      setUpdating(cartItemId);
      const token = localStorage.getItem("accessToken");

      if (!token) {
        toast.error("Please login first");
        router.push("/login");
        return;
      }

      const response = await fetchWithAuth(
        `${process.env.NEXT_PUBLIC_API_URL}/client/delete`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          credentials: "include",
          body: JSON.stringify({
            cartItemId,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to remove item");
      }

      await fetchCart();
      toast.success("Item removed from cart");
    } catch (error: any) {
      console.error("Error removing item:", error);
      toast.error(error.message || "Failed to remove item");
    } finally {
      setUpdating(null);
    }
  };

  const clearCart = async () => {
    try {
      const token = localStorage.getItem("accessToken");

      if (!token) {
        toast.error("Please login first");
        router.push("/login");
        return;
      }

      const response = await fetchWithAuth(
        `${process.env.NEXT_PUBLIC_API_URL}/client/remove`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          credentials: "include",
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to clear cart");
      }

      setCart(null);
      toast.success("Cart cleared");
    } catch (error: any) {
      console.error("Error clearing cart:", error);
      toast.error(error.message || "Failed to clear cart");
    }
  };

  const handleCheckout = () => {
    if (!cart || cart.items.length === 0) {
      toast.error("Cart is empty");
      return;
    }

    // If no name or phone, show details modal
    if (!userDetails?.name || !userDetails?.phone) {
      setShowUserDetailsModal(true);
      return;
    }

    // If phone exists but not verified, show OTP modal
    if (!userDetails?.phoneVerified) {
      setTempPhone(userDetails.phone);
      setShowOTPModal(true);
      return;
    }

    setShowTimeSlotModal(true);
  };

  const handleUserDetailsSuccess = (data: { name: string; phone: string }) => {
    setShowUserDetailsModal(false);
    setTempPhone(data.phone);
    setShowOTPModal(true);
    checkUserDetails();
  };

  const handleOTPSuccess = () => {
    setShowOTPModal(false);
    toast.success("Phone verified successfully!");
    // Update local state to mark phone as verified
    if (userDetails) {
      setUserDetails({ ...userDetails, phoneVerified: true });
    }
    setShowTimeSlotModal(true);
  };

  const handleTimeSlotSelect = async (slotId: number) => {
    setSelectedSlotId(slotId);
    setShowTimeSlotModal(false);

    try {
      const token = localStorage.getItem("accessToken");

      const response = await fetchWithAuth(
        `${process.env.NEXT_PUBLIC_API_URL}/client/create-order`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          credentials: "include",
          body: JSON.stringify({
            timeSlotId: slotId,
            notes: "",
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to create order");
      }

      toast.success("Order created!");
      router.push(`/cart/confirmation?orderId=${data.data.order.id}`);
    } catch (error: any) {
      console.error("Error creating order:", error);
      toast.error(error.message || "Failed to create order");
    }
  };

  const subtotal = cart?.totalAmount || 0;
  const tax = subtotal * 0.1;
  const total = subtotal + tax;

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-orange-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto  relative overflow-hidden font-[inter]">
      <div className="absolute top-0 right-0 w-64 h-64 bg-primary/50 rounded-full blur-3xl opacity-30 -mr-32 -mt-32"></div>
      <div className="absolute top-40 left-0 w-64 h-64 bg-primary/30 rounded-full blur-3xl opacity-30 -ml-32 -mb-32"></div>

      <div className="bg-white flex flex-col max-w-md mx-auto">
        <div className="flex items-center justify-between px-6 pt-6 pb-4">
          <button
            onClick={() => router.push("/dashboard")}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            aria-label="Go back"
          >
            <ArrowLeft className="w-6 h-6 text-gray-700" />
          </button>
          <h1 className="text-2xl font-bold text-gray-900">Cart</h1>
          {cart && cart.items.length > 0 && (
            <Button
            variant="ghost"
              onClick={clearCart}
              className=" text-red-500 py-1 px-2"
            >
              Clear 
            </Button>
          )}
          {(!cart || cart.items.length === 0) && <div className="w-10" />}
        </div>

        <div className="flex-1 px-6 py-6 overflow-y-auto">
          {!cart || cart.items.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-96">
              <ShoppingBag className="w-16 h-16 text-gray-300 mb-4" />
              <h2 className="text-xl font-semibold text-gray-900 mb-2">
                Your cart is empty
              </h2>
              <p className="text-gray-600 text-center mb-6">
                Add items from our menu to get started
              </p>
              <button
                onClick={() => router.push("/dashboard")}
                className="bg-orange-500 hover:bg-orange-600 text-white font-semibold py-2 px-6 rounded-full transition-colors cursor-pointer"
              >
                Continue Shopping
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {cart.items.map((item) => (
                <div
                  key={item.id}
                  className="flex gap-4 rounded-lg p-4 relative bg-white/70 backdrop-blur-md shadow-md border-[#E5E7EB] border"
                >
                  {updating === item.id && (
                    <div className="absolute inset-0 bg-white/50 flex items-center justify-center rounded-lg">
                      <Loader2 className="w-6 h-6 text-orange-500 animate-spin" />
                    </div>
                  )}
                  <img
                    src={item.menuItem.imageUrl || "/placeholder-food.jpg"}
                    alt={item.menuItem.name}
                    className="w-24 h-24 rounded-lg object-cover flex-shrink-0"
                    onError={(e) => {
                      e.currentTarget.src = "/placeholder-food.jpg";
                    }}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between mb-1">
                      <h3 className="font-semibold text-gray-900 truncate">
                        {item.menuItem.name}
                      </h3>
                      {item.menuItem.isVeg && (
                        <div className="w-4 h-4 border-2 border-green-600 rounded flex items-center justify-center flex-shrink-0 ml-2">
                          <div className="w-2 h-2 bg-green-600 rounded-full"></div>
                        </div>
                      )}
                    </div>
                    <p className="text-orange-500 font-bold mb-3">
                      ₹{Number(item.price).toFixed(2)}
                    </p>
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 bg-white rounded-lg border border-gray-200">
                        <button
                          onClick={() =>
                            updateQuantity(item.id, item.quantity - 1)
                          }
                          className="p-2 hover:bg-gray-100 transition-colors rounded-l-lg disabled:opacity-50"
                          aria-label="Decrease quantity"
                          disabled={updating === item.id}
                        >
                          <Minus className="w-4 h-4 text-gray-600" />
                        </button>
                        <span className="px-3 py-1 text-sm font-medium min-w-[2rem] text-center">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() =>
                            updateQuantity(item.id, item.quantity + 1)
                          }
                          className="p-2 hover:bg-gray-100 transition-colors rounded-r-lg disabled:opacity-50"
                          aria-label="Increase quantity"
                          disabled={updating === item.id}
                        >
                          <Plus className="w-4 h-4 text-gray-600" />
                        </button>
                      </div>
                      <button
                        onClick={() => removeItem(item.id)}
                        className="p-2 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                        aria-label="Remove item"
                        disabled={updating === item.id}
                      >
                        <Trash2 className="w-5 h-5 text-red-500" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}

              {/* Order Summary */}
              <div className="rounded-lg px-4 mt-6 space-y-3 py-6 bg-white/70 backdrop-blur-md shadow-md border-[#E5E7EB] border">
                <div className="flex justify-between text-gray-700">
                  <span>Subtotal ({cart.itemCount} items)</span>
                  <span>₹{subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-gray-700">
                  <span>Tax (10%)</span>
                  <span>₹{tax.toFixed(2)}</span>
                </div>
                <div className="border-t border-gray-200 pt-3 flex justify-between font-bold text-gray-900 text-lg">
                  <span>Total</span>
                  <span>₹{total.toFixed(2)}</span>
                </div>
              </div>
            </div>
          )}

          {/* Checkout Button - Fixed at Bottom */}
          {cart && cart.items.length > 0 && (
            <div className="w-3/4 bg-white px-6 py-4 max-w-md mx-auto">
              <button
                onClick={handleCheckout}
                className="w-full bg-orange-500 hover:bg-orange-600 text-white font-semibold py-3 rounded-full transition-colors shadow-lg active:scale-95"
              >
                {!userDetails?.name || !userDetails?.phone
                  ? "Add Details to Checkout"
                  : `Checkout - ₹${total}`}
              </button>
            </div>
          )}
        </div>

        {/* Modals */}
        <div className="">
          <UserDetailsModal
            isOpen={showUserDetailsModal}
            onClose={() => setShowUserDetailsModal(false)}
            onSuccess={handleUserDetailsSuccess}
          />

          <OTPVerificationModal
            isOpen={showOTPModal}
            phone={tempPhone}
            onClose={() => setShowOTPModal(false)}
            onSuccess={handleOTPSuccess}
          />

          <TimeSlotModal
            isOpen={showTimeSlotModal}
            onClose={() => setShowTimeSlotModal(false)}
            onSlotSelect={handleTimeSlotSelect}
          />
        </div>
      </div>
    </div>
  );
}
