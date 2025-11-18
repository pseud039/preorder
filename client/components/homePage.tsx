"use client";
import React, { useState, useEffect } from "react";
import { Search, ShoppingCart, Heart, User, Loader2 } from "lucide-react";

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
  emoji: string;
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


export default function FoodOrderPage(){
  const [selectedCategory, setSelectedCategory] = useState<string>("All");
  const [cartCount, setCartCount] = useState<number>(0);
  const [isVegOnly, setIsVegOnly] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [page, setPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/home/menu?limit=100`
        );
        const data: ApiResponse<MenuItem> = await response.json();
        // console.log(data);
        // console.log(menuItems.map(item => item.category));
        if (data.success) {
          const uniqueCategories = [
            ...new Set(data.data.items.map((item) => item.category)),
          ];

          console.log("Fetched Categories:", uniqueCategories);
        }
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

        if (selectedCategory !== "All") params.append("category", selectedCategory);
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

  const addToCart = (item: MenuItem): void => {
    setCartCount((prev) => prev + 1);
    console.log("Added to cart:", item);
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
          <button className="relative">
            <div className="w-12 h-12 rounded-full bg-white shadow-md flex items-center justify-center">
              <ShoppingCart fill="#f1623a" className="w-5 h-5 text-primary" />
            </div>
            {cartCount > 0 && (
              <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center">
                {cartCount}
              </span>
            )}
          </button>
        </div>

        <h1 className="text-2xl font-bold text-primary-text/80 mb-6 leading-tight">
          What are you going<br />to eat today??
        </h1>

        {/* Search Bar */}
        <div className="relative mb-6 flex flex-row gap-2 items-center">
          <input
            type="text"
            placeholder="Search here.."
            value={searchQuery}
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
                isVegOnly ? "border-white bg-green-800" : "border-white bg-primary"
              }`}
            >
              <div
                className={`w-4 h-4 border-2 rounded flex items-center justify-center ${
                  isVegOnly ? "border-white bg-green-800" : "border-white bg-primary"
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
            <button className="text-primary font-medium text-sm">See More</button>
          </div>

          <div className="flex justify-between gap-3 overflow-x-auto">
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
                  className={`w-16 h-16 rounded-full flex items-center justify-center text-3xl mb-2 transition-all ${
                    selectedCategory === cat.name
                      ? "bg-primary shadow-lg scale-110"
                      : "bg-white shadow-sm"
                  }`}
                >
                  {cat.emoji}
                </div>
                <span
                  className={`text-xs font-medium ${
                    selectedCategory === cat.name ? "text-primary" : "text-gray-700"
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
              <div key={item.id} className="bg-white rounded-3xl p-4 shadow-sm">
                <div className="relative mb-3">
                  <div className="w-full h-32 bg-gradient-to-br from-orange-100 to-yellow-100 rounded-2xl overflow-hidden">
                    {item.imageUrl ? (
                      <img
                        src={item.imageUrl}
                        alt={item.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-5xl">
                        
                      </div>
                    )}
                  </div>
                  <button className="absolute top-2 right-2 w-8 h-8 bg-white rounded-full shadow-sm flex items-center justify-center">
                    <Heart className="w-4 h-4 text-gray-400" />
                  </button>
                  {item.isVeg && (
                    <div className="absolute top-2 left-2 w-6 h-6 bg-white rounded flex items-center justify-center">
                      <div className="w-3 h-3 border-2 border-green-600 rounded flex items-center justify-center">
                        <div className="w-1.5 h-1.5 bg-green-600 rounded-full"></div>
                      </div>
                    </div>
                  )}
                </div>
                <h4 className="font-bold text-gray-900 text-sm mb-1 truncate">
                  {item.name}
                </h4>
                <p className="text-xs text-gray-500 mb-2 line-clamp-2">
                  {item.description}
                </p>
                <div className="flex items-center justify-between">
                  <span className="font-bold text-gray-900">${item.price}</span>
                  <button
                    onClick={() => addToCart(item)}
                    className="w-8 h-8 bg-pink-300 rounded-full flex items-center justify-center hover:bg-pink-400 transition-colors"
                  >
                    <span className="text-white text-xl leading-none">+</span>
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
