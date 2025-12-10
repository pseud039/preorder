"use client";
import { useEffect, useState } from "react";
import { SidebarTrigger } from "./ui/sidebar";
import { LogOut, User } from "lucide-react";
import { Button } from "./ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import { toast } from "sonner";

interface UserData {
  id: number;
  name: string;
  email: string;
  role: string;
  adminOf?: {
    restaurant: {
      name: string;
    };
  };
  chefOf?: {
    restaurant: {
      name: string;
    };
  };
}

export default function Navbar() {
  const [user, setUser] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchUser();
  }, []);

  const fetchUser = async () => {
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/admin/auth/me`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include", // CRITICAL: Include cookies
        }
      );

      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          setUser(data.data);
        }
      } else if (res.status === 401) {
        // Unauthorized - redirect to login
        window.location.href = "/login";
      }
    } catch (err) {
      console.error("Failed to fetch user", err);
      toast.error("Failed to load user information");
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/admin/auth/logout`,
        {
          method: "POST",
          credentials: "include", // CRITICAL: Include cookies
        }
      );

      if (response.ok) {
        toast.success("Logged out successfully");
        setTimeout(() => {
          window.location.href = "/login";
        }, 500);
      }
    } catch (error) {
      console.error("Logout error:", error);
      toast.error("Failed to logout");
    }
  };

  const getRestaurantName = () => {
    if (user?.adminOf?.restaurant?.name) {
      return user.adminOf.restaurant.name;
    }
    if (user?.chefOf?.restaurant?.name) {
      return user.chefOf.restaurant.name;
    }
    return null;
  };

  if (loading) {
    return (
      <nav className="flex w-full justify-between px-6 py-4 bg-white items-center border-b">
        <div className="flex items-center gap-4">
          <SidebarTrigger />
          <div className="h-8 w-48 bg-gray-200 animate-pulse rounded"></div>
        </div>
        <div className="h-10 w-10 bg-gray-200 animate-pulse rounded-full"></div>
      </nav>
    );
  }

  return (
    <nav className="flex w-full justify-between px-6 py-4 bg-white items-center border-b">
      <div className="flex items-center gap-4">
        <SidebarTrigger />
        <div>
          <h1 className="text-lg font-semibold text-gray-800">
            Welcome back, {user?.name || "User"}!
          </h1>
          {getRestaurantName() && (
            <p className="text-sm text-gray-600">{getRestaurantName()}</p>
          )}
        </div>
      </div>

      <div className="flex items-center gap-3">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-orange-600 flex items-center justify-center text-white font-semibold">
                {user?.name?.charAt(0).toUpperCase() || "A"}
              </div>
              <div className="hidden md:block text-left">
                <p className="text-sm font-medium text-gray-700">
                  {user?.name || "Admin"}
                </p>
                <p className="text-xs text-gray-500 capitalize">
                  {user?.role || ""}
                </p>
              </div>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>My Account</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem disabled>
              <User className="mr-2 h-4 w-4" />
              <span>{user?.email}</span>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={handleLogout}
              className="text-red-600 focus:text-red-600 cursor-pointer"
            >
              <LogOut className="mr-2 h-4 w-4" />
              <span>Logout</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </nav>
  );
}