"use client";
import Supermarket from "@/assets/Supermarket workers.gif";
import Image from "next/image";
import { useState, useEffect, useRef, useCallback, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "./ui/button";
import { io, Socket } from "socket.io-client";
import { toast } from "sonner";
import { fetchWithAuth } from "@/lib/auth";

const TIMER_DURATION = 5 * 60; // 5 minutes

type OrderStatus = "Pending" | "Accepted" | "Rejected" | "Expired";

function OrderConfirmationContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const orderId = searchParams.get("orderId");

  const [timeLeft, setTimeLeft] = useState(TIMER_DURATION);
  const [orderStatus, setOrderStatus] = useState<OrderStatus>("Pending");
  const [isConnected, setIsConnected] = useState(false);

  const socketRef = useRef<Socket | null>(null);
  const redirectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const hasRedirectedRef = useRef(false);
  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const pollIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Centralized redirect handler - prevents multiple redirects
  const handleRedirect = useCallback(
    (path: string, delay: number = 2000) => {
      if (hasRedirectedRef.current) return;
      hasRedirectedRef.current = true;

      if (redirectTimeoutRef.current) {
        clearTimeout(redirectTimeoutRef.current);
      }

      redirectTimeoutRef.current = setTimeout(() => {
        router.push(path);
      }, delay);
    },
    [router]
  );

  // Centralized status update handler
  const handleStatusUpdate = useCallback(
    (status: OrderStatus, message?: string) => {
      if (orderStatus === status) return; // Prevent duplicate updates

      setOrderStatus(status);

      // Clear timer from localStorage
      if (orderId) {
        localStorage.removeItem(`order_timer_${orderId}`);
      }

      // Stop the countdown timer
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
        timerIntervalRef.current = null;
      }

      // Stop polling
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
        pollIntervalRef.current = null;
      }

      switch (status) {
        case "Accepted":
          toast.success("Order Accepted! 🎉", {
            description: message || "Redirecting to payment...",
            duration: 3000,
          });
          handleRedirect(`/checkout/payment?orderId=${orderId}`, 2500);
          break;

        case "Rejected":
          toast.error("Order Rejected", {
            description: message || "The restaurant couldn't accept your order",
            duration: 5000,
          });
          handleRedirect("/order-history", 3000);
          break;

        case "Expired":
          toast.error("Order Confirmation Timeout", {
            description: "The restaurant didn't respond in time",
            duration: 5000,
          });
          handleRedirect("/order-history", 3000);
          break;
      }
    },
    [orderId, orderStatus, handleRedirect]
  );

  // Initialize timer from localStorage
  useEffect(() => {
    if (!orderId) {
      toast.error("No order ID found");
      router.push("/");
      return;
    }

    const storageKey = `order_timer_${orderId}`;
    const storedStartTime = localStorage.getItem(storageKey);

    if (storedStartTime) {
      const startTime = parseInt(storedStartTime, 10);
      const elapsed = Math.floor((Date.now() - startTime) / 1000);
      const remaining = TIMER_DURATION - elapsed;

      if (remaining <= 0) {
        setTimeLeft(0);
        handleStatusUpdate("Expired");
      } else {
        setTimeLeft(remaining);
      }
    } else {
      localStorage.setItem(storageKey, Date.now().toString());
    }
  }, [orderId, router, handleStatusUpdate]);

  // Setup Socket.IO for real-time order updates
  useEffect(() => {
    if (!orderId || orderStatus !== "Pending") return;

    const accessToken = localStorage.getItem("accessToken");
    const userId = localStorage.getItem("userId");

    // if (!accessToken || !userId) {
    //   toast.error("Please login to continue");
    //   router.push("/login");
    //   return;
    // }

    const newSocket = io(
      process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000",
      {
        auth: { token: accessToken },
        transports: ["websocket", "polling"],
        reconnection: true,
        reconnectionAttempts: 5,
        reconnectionDelay: 1000,
      }
    );

    socketRef.current = newSocket;

    newSocket.on("connect", () => {
      console.log("Socket connected:", newSocket.id);
      setIsConnected(true);
      newSocket.emit("join", userId);
    });

    newSocket.on("connect_error", (error) => {
      console.error("Socket connection error:", error);
      setIsConnected(false);
    });

    newSocket.on("disconnect", () => {
      setIsConnected(false);
    });

    newSocket.on("notification", (notification) => {
      console.log("Notification received:", notification);

      // Check if this notification is for our order
      if (notification.data?.orderId !== parseInt(orderId)) {
        return;
      }

      if (notification.type === "ORDER_ACCEPTED") {
        handleStatusUpdate("Accepted", notification.message);
      } else if (notification.type === "ORDER_REJECTED") {
        handleStatusUpdate("Rejected", notification.message);
      }
    });

    return () => {
      newSocket.close();
      socketRef.current = null;
    };
  }, [orderId, orderStatus, router, handleStatusUpdate]);

  // Countdown timer
  useEffect(() => {
    if (orderStatus !== "Pending" || timeLeft <= 0) return;

    timerIntervalRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          handleStatusUpdate("Expired");
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
      }
    };
  }, [orderStatus, timeLeft, handleStatusUpdate]);

  // Poll for order status as backup
  useEffect(() => {
    if (!orderId || orderStatus !== "Pending") return;

    const pollOrderStatus = async () => {
      try {
        const accessToken = localStorage.getItem("accessToken");
        const response = await fetchWithAuth(
          `${process.env.NEXT_PUBLIC_API_URL}/client/orders/${orderId}`,
          {
            headers: {
              Authorization: `Bearer ${accessToken}`,
            },
          }
        );

        if (response.ok) {
          const data = await response.json();
          const status = data.data?.restaurantStatus;

          if (status === "Accepted") {
            handleStatusUpdate("Accepted");
          } else if (status === "Rejected") {
            handleStatusUpdate("Rejected");
          }
        }
      } catch (error) {
        console.error("Error polling order status:", error);
      }
    };

    // Initial check
    pollOrderStatus();

    // Poll every 5 seconds as backup
    pollIntervalRef.current = setInterval(pollOrderStatus, 5000);

    return () => {
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
      }
    };
  }, [orderId, orderStatus, handleStatusUpdate]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (redirectTimeoutRef.current) clearTimeout(redirectTimeoutRef.current);
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
      if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
      if (socketRef.current) socketRef.current.close();
    };
  }, []);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs
      .toString()
      .padStart(2, "0")}`;
  };

  const handleGoHome = () => {
    if (orderId) {
      localStorage.removeItem(`order_timer_${orderId}`);
    }
    router.push("/");
  };

  const handleViewOrders = () => {
    if (orderId) {
      localStorage.removeItem(`order_timer_${orderId}`);
    }
    router.push("/order-history");
  };

  if (!orderId) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600">No Order Found</h1>
          <Button onClick={handleGoHome} className="mt-4">
            Go Home
          </Button>
        </div>
      </div>
    );
  }

  const getStatusContent = () => {
    switch (orderStatus) {
      case "Accepted":
        return {
          icon: "",
          title: "Order Accepted!",
          description:
            "Your order has been accepted! Redirecting to payment...",
          color: "text-green-600",
        };
      case "Rejected":
        return {
          icon: "",
          title: "Order Rejected",
          description:
            "The restaurant couldn't accept your order. Redirecting to order history...",
          color: "text-red-600",
        };
      case "Expired":
        return {
          icon: "",
          title: "Time Expired",
          description:
            "The restaurant didn't respond in time. Redirecting to order history...",
          color: "text-orange-600",
        };
      default:
        return {
          icon: "",
          title: "Waiting for Confirmation",
          description:
            "The restaurant will confirm your order within 5 minutes. Please wait...",
          color: "text-orange-600",
        };
    }
  };

  const statusContent = getStatusContent();

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
        <div className="mb-6">
          <Image
            src={Supermarket}
            alt="Order processing"
            width={200}
            height={200}
            className="mx-auto"
            unoptimized
          />
        </div>

        <h1 className={`text-3xl font-bold mb-4 ${statusContent.color}`}>
          {statusContent.icon} {statusContent.title}
        </h1>

        <p className="text-gray-600 mb-6">{statusContent.description}</p>

        {/* Show timer only when pending */}
        {orderStatus === "Pending" && (
          <div className="mb-6">
            <div className="text-5xl font-bold text-orange-600 mb-2">
              {formatTime(timeLeft)}
            </div>
            <div className="text-sm text-gray-500">Time remaining</div>
            <div className="mt-4">
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-orange-600 h-2 rounded-full transition-all duration-1000"
                  style={{
                    width: `${(timeLeft / TIMER_DURATION) * 100}%`,
                  }}
                />
              </div>
            </div>

            {/* Connection status indicator */}
            {/* <div className="mt-4 flex items-center justify-center gap-2">
              <div
                className={`w-2 h-2 rounded-full ${
                  isConnected ? "bg-green-500" : "bg-yellow-500"
                }`}
              />
              <span className="text-xs text-gray-500">
                {isConnected
                  ? "Connected - Listening for updates"
                  : "Connecting..."}
              </span>
            </div> */}
          </div>
        )}

        {/* Show loading spinner during redirect */}
        {orderStatus !== "Pending" && (
          <div className="mb-6">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto" />
            <p className="text-sm text-gray-500 mt-2">Redirecting...</p>
          </div>
        )}

        {/* Action buttons only when pending */}
        {orderStatus === "Pending" && (
          <div className="space-y-3">
            <Button
              onClick={handleViewOrders}
              variant="outline"
              className="w-full"
            >
              View Order History
            </Button>
            <Button onClick={handleGoHome} variant="ghost" className="w-full">
              Go Back Home
            </Button>
          </div>
        )}

        <div className="mt-6 text-xs text-gray-400">
          Order ID: {orderId} | Status: {orderStatus}
        </div>
      </div>
    </div>
  );
}

// Loading fallback component
function LoadingFallback() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600 mx-auto mb-4" />
        <p className="text-gray-600">Loading order details...</p>
      </div>
    </div>
  );
}

// Main export with Suspense wrapper
export default function OrderConfirmation() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <OrderConfirmationContent />
    </Suspense>
  );
}