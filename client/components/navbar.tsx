"use client";
import {
  House,
  TextSearch,
  Soup,
  UserRoundPen,
  UserPen,
  Home,
} from "lucide-react";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
export default function Navbar() {
  const [page, setPage] = useState("home");
  const router = useRouter();
  useEffect(() => {
    if (page === "account") {
      router.push("/account");
    } else if (page === "search") {
      router.push("/search");
    } else if (page === "orders") {
      router.push("/orders");
    } else {
      router.push("/home");
    }
  }, [page]);
  const Navigations = {
    home: {
      icon: Home,
      title: "Home",
    },
    search: {
      icon: TextSearch,
      title: "Search",
    },
    orders: {
      icon: Soup,
      title: "Orders",
    },
    account: {
      icon: UserRoundPen,
      title: "Account",
    },
  };

  return (
    <div className="flex flex-row justify-between max-w-md mx-auto items-end font-semibold py-4 fixed bottom-0 left-0 right-0 px-12">
      {Object.entries(Navigations).map(([key, { icon: Icon, title }]) => (
        <button
          key={key}
          onClick={() => setPage(key)}
          className="flex flex-col justify-center items-center hover:cursor-pointer"
        >
          <Icon color={page === key ? "#f1623a" : "gray"} size={24} />
          <span
            className={`${
              page === key ? "text-[#f1623a]" : "text-gray-500"
            } text-sm`}
          >
            {title}
          </span>
        </button>
      ))}
    </div>
  );
}
