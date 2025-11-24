"use client";
import {
  House,
  TextSearch,
  Soup,
  UserRoundPen,
  Home,
} from "lucide-react";
import { usePathname, useRouter } from "next/navigation";

export default function Navbar() {
  const router = useRouter();
  const pathname = usePathname(); // Get current route

  // Determine which page is active based on the current pathname
  const getActivePage = () => {
    if (pathname === "/account") return "account";
    if (pathname === "/search") return "search";
    if (pathname === "/orders") return "orders";
    return "home"; // Default to home for /dashboard or /
  };

  const activePage = getActivePage();

  const Navigations = {
    home: {
      icon: Home,
      title: "Home",
      route: "/dashboard",
    },
    search: {
      icon: TextSearch,
      title: "Search",
      route: "/search",
    },
    orders: {
      icon: Soup,
      title: "Orders",
      route: "/orders",
    },
    account: {
      icon: UserRoundPen,
      title: "Account",
      route: "/account",
    },
  };

  const handleNavigation = (key: string) => {
    const route = Navigations[key as keyof typeof Navigations].route;
    router.push(route);
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-6 py-3 max-w-md mx-auto shadow-lg z-50 rounded-full mb-2 w-12/15">
      <div className="flex justify-around items-center">
        {Object.entries(Navigations).map(([key, { icon: Icon, title }]) => {
          const isActive = activePage === key;
          
          return (
            <button
              key={key}
              onClick={() => handleNavigation(key)}
              className="flex flex-col justify-center items-center hover:cursor-pointer transition-colors"
            >
              <Icon
                className={`w-6 h-6 mb-1 ${
                  isActive ? "text-orange-500" : "text-gray-400"
                }`}
              />
              <span
                className={`text-xs ${
                  isActive ? "text-orange-500 font-semibold" : "text-gray-400"
                }`}
              >
                {title}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}