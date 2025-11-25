"use client";
import React, { useState, useEffect } from "react";
import {
  Search,
  ShoppingCart,
  Heart,
  User,
  Loader2,
  Plus,
  Circle,
} from "lucide-react";
import { useRouter } from "next/navigation";


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
  name: string;
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

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/client/categories`
        );
        const data = await response.json();

        console.log("Categories API Response:", data);

        const uniqueCategories = data.data;

const categoriesWithAll: Category[] = [
  { name: "All" }, 
  ...uniqueCategories.map((category: Category) => ({ name: category }))
];
        setCategories(categoriesWithAll);
        console.log("Fetched Categories:", uniqueCategories);
      } catch (error) {
        console.error("Error fetching categories:", error);
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

        const response = await fetch(
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

      const token = localStorage.getItem("auth_token");
      console.log("Token from localStorage:", token ? "Found" : "Not found");

      if (!token) {
        alert("Please login first");
        window.location.href = "/auth/login";
        return;
      }

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/client/add`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          credentials: "include",
          body: JSON.stringify({
            menuItemId: item.id,
          }),
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
        <div
          className="relative mb-6 flex flex-row gap-2 items-center"
      
        >
          <input
            type="text"
            placeholder="Search here.."
            value={searchQuery}
             onClick={() => {
            router.push("/search");}}
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
                key={idx}
                onClick={() => {
                  setSelectedCategory(cat.name);
                  setPage(1);
                }}
                className="flex flex-col items-center flex-shrink-0"
              >
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center text-3xl mb-2 transition-all ${
                    selectedCategory === cat.name
                      ? "bg-primary shadow-lg scale-110"
                      : "bg-accent shadow-sm"
                  }`}
                >
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
