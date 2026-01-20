"use client";
import { Search, Heart, Plus } from "lucide-react";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { fetchWithAuth } from "@/lib/auth";
import { toast } from 'sonner';

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
export default function SearchPage() {
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [selectedCategory, setSelectedCategory] = useState<string>("All");
  const [cartCount, setCartCount] = useState<number>(0);
  const [isVegOnly, setIsVegOnly] = useState<boolean>(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [page, setPage] = useState<number>(1);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [totalPages, setTotalPages] = useState<number>(1);
  const router = useRouter();
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
        setMenuItems([]);
        setTotalPages(1);
      } finally {
        setLoading(false);
      }
    };

    fetchMenuItems();
  }, [selectedCategory, page]);

  useEffect(() => {
    const timer = setTimeout(() => {
      const doFetch = async (usePage: number) => {
        setLoading(true);
        try {
          const params = new URLSearchParams({
            page: usePage.toString(),
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
          } else {
            setMenuItems([]);
            setTotalPages(1);
          }
        } catch (error) {
          console.error("Error fetching menu:", error);
          setMenuItems([]);
          setTotalPages(1);
        } finally {
          setLoading(false);
        }
      };

      if (searchQuery.trim()) {
        if (page !== 1) {
          setPage(1);
        } else {
          doFetch(1);
        }
      } else {
        if (page !== 1) {
          setPage(1);
        } else {
          doFetch(1);
        }
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [searchQuery, selectedCategory, isVegOnly, page]);
  const addToCart = async (item: MenuItem): Promise<void> => {
    try {
      console.log("Attempting to add to cart...");

      const token = localStorage.getItem("accessToken");
      console.log("Token from localStorage:", token ? "Found" : "Not found");

      if (!token) {
        toast.error("Please login first");
        window.location.href = "/login";
        return;
      }

      const response = await fetchWithAuth(
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
          toast.error("Please log in to add items to cart");
          return;
        }
        console.error(
          "Failed to add to cart:",
          data.message || response.statusText
        );
        toast.error(`Failed to add to cart: ${data.message || "Unknown error"}`);
        return;
      }

      setCartCount((prev) => prev + 1);
      toast.success(`${item.name} added to cart`);
      console.log("Added to cart:", item.id);
    } catch (error) {
      console.error("Error adding to cart:", error);
      toast.error("Network error. Please check your connection and try again.");
    }
  };
  return (
    
    <div className="max-w-md mx-auto min-h-screen relative overflow-hidden font-[inter]">
      <div className="absolute top-0 right-0 w-64 h-64 bg-primary/50 rounded-full blur-3xl opacity-30 -mr-32 -mt-32"></div>
      <div className="absolute top-40 left-0 w-64 h-64 bg-primary/30 rounded-full blur-3xl opacity-30 -ml-32 -mb-32"></div>
      
    <div className="max-w-md mx-auto min-h-screen relative overflow-hidden font-[inter] px-2 lg:px-8 py-10">
      <div className="flex flex-row justify-center py-4">
        <div className="font-bold text-2xl">
          <div>Search for the </div>food you want
        </div>
      </div>
      <div className="relative mb-6 flex flex-row gap-2 items-center w-5/6 mx-auto">
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
      </div>
      <div className="">
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
                    {/* <Heart className="w-4 h-4 text-red-500 hover:cursor-pointer" /> */}
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
        )}{" "}
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
    </div></div>
  );
}
