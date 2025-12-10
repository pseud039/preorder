"use client";
import React, { useState, useEffect } from "react";
import { Search, ShoppingCart, Heart, User, Loader2, Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import { fetchWithAuth } from "@/lib/auth";
import { io, Socket } from 'socket.io-client';


interface MenuItem {
  id: string | number;
  name: string;
  description: string;
  price: number;
  category: string;
  imageUrl?: string;
  isVeg?: boolean;
}

interface Category {
  id?: number;
  name: string;
  imageUrl?: string;
  description?: string | null;
  restaurantId?: number;
  displayOrder?: number;
  isActive?: boolean;
}

interface ApiResponse<T> {
  success: boolean;
  data: {
    items: T[];
    pagination: {
      totalPages: number;
    };
  };
}

export default function FoodOrderPage() {
  const [selectedCategory, setSelectedCategory] = useState<string>("All");
  const [cartCount, setCartCount] = useState<number>(0);
  const [isVegOnly, setIsVegOnly] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [page, setPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);
  const router = useRouter();
  const [socket, setSocket] = useState<Socket | null>(null);
  const [notifications, setNotifications] = useState<any[]>([]);

  useEffect(() => {
    const accessToken = localStorage.getItem('accessToken');
    const userId = localStorage.getItem('userId'); // Store this on login

    if (!accessToken || !userId) return;

    // Connect to Socket.IO
    const newSocket = io(process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000', {
      auth: {
        token: accessToken
      }
    });

    // Join user's room
    newSocket.emit('join', userId);

    // Listen for notifications
    newSocket.on('notification', (notification) => {
      console.log('📬 Received notification:', notification);
      
      setNotifications(prev => [notification, ...prev]);
      
      // Show browser notification if permission granted
      if (Notification.permission === 'granted') {
        new Notification(notification.title, {
          body: notification.message,
          icon: '/icon-192x192.png'
        });
      }
    });

    setSocket(newSocket);
    return () => {
      newSocket.close();
    };
  }, []);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await fetchWithAuth(
          `${process.env.NEXT_PUBLIC_API_URL}/client/categories`
        );
        const data = await response.json();

        console.log("Categories API Response:", data);
        
        const uniqueCategories = data.data.categories;

        const categoriesWithAll: Category[] = [
          { name: "All" },
          ...uniqueCategories, 
        ];
        setCategories(categoriesWithAll);
        console.log("Fetched Categories:", uniqueCategories);
      } catch (error) {
        console.error("Error fetching categories:", error);
      //   var token=true;
      //   if(error.includes("expired")){
      //      token=false;
      //   }

      // if (!token) {
      //   alert("Please login first");
      //   window.location.href = "/login";
      //   return;
      // }
      }
    };

    fetchCategories();
  }, []);

  useEffect(() => {
    const fetchMenuItems = async () => {
      setLoading(true);
      try {
        const params = new URLSearchParams({
          page: page.toString(),
          limit: "10",
          isAvailable: "true",
        });

        if (selectedCategory !== "All")
          params.append("category", selectedCategory);
        if (isVegOnly) params.append("isVeg", "true");
        if (searchQuery.trim()) params.append("search", searchQuery.trim());

        const response = await fetchWithAuth(
          `${process.env.NEXT_PUBLIC_API_URL}/home/menu?${params}`
        );
        const data: ApiResponse<MenuItem> = await response.json();

        if (data.success) {
          setMenuItems(data.data.items);
          setTotalPages(data.data.pagination.totalPages);
        }
      } catch (error) {
        console.error("Error fetching menu:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchMenuItems();
  }, [selectedCategory, isVegOnly, page]);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchQuery.trim()) {
        setPage(1);
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const addToCart = async (item: MenuItem): Promise<void> => {
    try {
      console.log("Attempting to add to cart...");

      const token = localStorage.getItem("accessToken");
      console.log("Token from localStorage:", token ? "Found" : "Not found");

      if (!token) {
        alert("Please login first");
        window.location.href = "/login";
        return;
      }

  const response = await fetchWithAuth(
      `${process.env.NEXT_PUBLIC_API_URL}/client/add`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ menuItemId: item.id }),
      }
    );

      const data = await response.json();

      if (!response.ok) {
        if (response.status === 401) {
          console.error("Authentication required. Please log in.");
          alert("Please log in to add items to cart");
          return;
        }
        console.error(
          "Failed to add to cart:",
          data.message || response.statusText
        );
        alert(`Failed to add to cart: ${data.message || "Unknown error"}`);
        return;
      }

      setCartCount((prev) => prev + 1);
      console.log("Added to cart:", item.id);
    } catch (error) {
      console.error("Error adding to cart:", error);
      alert("Network error. Please check your connection and try again.");
    }
  };

  return (
    <div className="max-w-md mx-auto min-h-screen relative overflow-hidden font-[inter]">
      <div className="absolute top-0 right-0 w-64 h-64 bg-primary/50 rounded-full blur-3xl opacity-30 -mr-32 -mt-32"></div>
      <div className="absolute top-40 left-0 w-64 h-64 bg-primary/30 rounded-full blur-3xl opacity-30 -ml-32 -mb-32"></div>
      
      <div className="relative z-10 px-6 pt-8 pb-4">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center">
              <span className="text-white text-lg">
                <User />
              </span>
            </div>
            <span className="text-gray-700 font-medium text-xl ml-2">
              Hey Foodie!!
            </span>
          </div>
          <button className="relative" onClick={() => router.push("/orders")}>
            <div className="w-12 h-12 rounded-full bg-white shadow-md flex items-center justify-center">
              <ShoppingCart fill="#f1623a" className="w-5 h-5 text-primary" />
            </div>
            {cartCount > 0 && (
              <span className="absolute top-1 -right-[2px] w-3 h-3 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center"></span>
            )}
          </button>
        </div>

        <h1 className="text-2xl font-bold text-primary-text/80 mb-6 leading-tight">
          What are you going
          <br />
          to eat today??
        </h1>

        {/* Search Bar */}
        <div className="relative mb-6 flex flex-row gap-2 items-center">
          <input
            type="text"
            placeholder="Search here.."
            value={searchQuery}
            onClick={() => {
              router.push("/search");
            }}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-white/80 backdrop-blur-sm rounded-2xl px-12 py-4 pr-14 text-gray-700 placeholder-gray-400 outline-none shadow-sm hover:outline-1 focus:outline-1"
          />
          <button className="absolute left-1 top-1/2 -translate-y-1/2 w-10 h-10 bg-white rounded-xl flex items-center justify-center">
            <Search className="w-5 h-5 text-primary border-white" />
          </button>

          {/* Veg Toggle */}
          <button
            onClick={() => setIsVegOnly(!isVegOnly)}
            className="w-10 h-13 rounded-xl flex flex-col items-center justify-between gap-0.5 px-2 pt-2 pb-1 transition-colors bg-gray-400"
          >
            <span className="text-xs text-white font-bold">
              {isVegOnly ? "ON" : "OFF"}
            </span>
            <div
              className={`w-7 h-7 rounded-lg flex items-center justify-center ${
                isVegOnly
                  ? "border-white bg-green-800"
                  : "border-white bg-primary"
              }`}
            >
              <div
                className={`w-4 h-4 border-2 rounded flex items-center justify-center ${
                  isVegOnly
                    ? "border-white bg-green-800"
                    : "border-white bg-primary"
                }`}
              >
                <div className="w-[6px] h-[6px] rounded-full bg-white"></div>
              </div>
            </div>
          </button>
        </div>

        {/* Discount Banner */}
        <div className="rounded-3xl p-6 mb-6 relative overflow-hidden shadow-md font-[inter] bg-gradient-to-r from-orange-200 via-yellow-100 to-orange-100">
          <div className="relative flex justify-start flex-col z-10 text-left">
            <h2 className="text-gray-900 font-bold text-2xl">Get</h2>
            <h2 className="text-primary font-bold text-3xl italic">50% off</h2>
            <p className="text-gray-900 text-sm font-medium">on first meal</p>
          </div>
        </div>

        {/* Categories */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-bold text-gray-900">Categories</h3>
            <a
              href="/search"
              className="text-primary font-medium text-sm hover:cursor-pointer"
            >
              See More
            </a>
          </div>

          <div className="flex gap-5 overflow-x-auto p-2">
            {categories.map((cat, idx) => (
              <button
                key={cat.id || idx}
                onClick={() => {
                  setSelectedCategory(cat.name);
                  setPage(1);
                }}
                className="flex flex-col items-center flex-shrink-0"
              >
                <div
                  className={`w-16 h-16 rounded-full flex items-center justify-center overflow-hidden mb-2 transition-all ${
                    selectedCategory === cat.name
                      ? "bg-primary shadow-lg scale-110 ring-2 ring-primary"
                      : "bg-accent shadow-sm"
                  }`}
                >
                  {/* Show category image */}
                  {cat.imageUrl ? (
                    <img
                      src={cat.imageUrl}
                      alt={cat.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span className="text-2xl">
                      {cat.name === "All" ? (
                        <img
                          src="data:image/jpeg;base64,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"
                          alt="All"
                          className="object-cover w-full h-full"
                        />
                      ) : (
                        "📦"
                      )}
                    </span>
                  )}
                </div>
                <span
                  className={`text-xs font-medium ${
                    selectedCategory === cat.name
                      ? "text-primary"
                      : "text-black-700"
                  }`}
                >
                  {cat.name}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Loading */}
        {loading && (
          <div className="flex justify-center items-center py-8">
            <Loader2 className="w-8 h-8 text-primary animate-spin" />
          </div>
        )}

        {/* Food Items */}
        {!loading && menuItems.length > 0 && (
          <div className="grid grid-cols-2 gap-4">
            {menuItems.map((item) => (
              <div key={item.id} className="bg-white rounded-3xl shadow-sm">
                <div className="relative mb-2">
                  <div className="w-full h-38 bg-gradient-to-br from-orange-100 to-yellow-100 rounded-t-2xl overflow-hidden">
                    {item.imageUrl ? (
                      <img
                        src={item.imageUrl}
                        alt={item.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-sm">
                        :)
                      </div>
                    )}
                  </div>

                  {item.isVeg && (
                    <div className="absolute top-2 right-2 w-5 h-5 bg-white rounded flex items-center justify-center">
                      <div className="w-3 h-3 border-2 border-green-600 rounded flex items-center justify-center">
                        <div className="w-1.5 h-1.5 bg-green-600 rounded-full"></div>
                      </div>
                    </div>
                  )}
                </div>
                <h4 className="font-bold px-4 text-gray-900 text-sm mb-1 truncate flex justify-between items-center">
                  {item.name}
                  <button className="w-8 h-8 bg-white flex items-center justify-center">
                    <Heart className="w-4 h-4 text-red-500 hover:cursor-pointer" />
                  </button>
                </h4>
                <div className="pb-4 px-4 flex items-center justify-between">
                  <span className="font-bold text-gray-900">₹{item.price}</span>
                  <button
                    onClick={() => addToCart(item)}
                    className="w-8 h-8 bg-orange-600 rounded-full flex items-center justify-center hover:bg-red-600 transition-colors"
                  >
                    <span className="mx-auto text-white text-xl leading-none">
                      <Plus className="w-4" />
                    </span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {!loading && menuItems.length === 0 && (
          <div className="text-center py-8">
            <p className="text-gray-500">No items found</p>
          </div>
        )}

        {totalPages > 1 && (
          <div className="flex justify-center gap-2 mt-6">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="px-4 py-2 bg-white rounded-lg shadow-sm disabled:opacity-50"
            >
              Previous
            </button>
            <span className="px-4 py-2 bg-primary text-white rounded-lg shadow-sm">
              {page} / {totalPages}
            </span>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="px-4 py-2 bg-white rounded-lg shadow-sm disabled:opacity-50"
            >
              Next
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
