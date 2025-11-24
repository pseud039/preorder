"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { Grip } from "lucide-react";
import { Montserrat } from "next/font/google";
import { SidebarTrigger } from "./ui/sidebar";
import { ModeToggle } from "./switch";


export default function Navbar() {
  const [username, setUsername] = useState("");
const [theme, setTheme] = useState("light");
  // useEffect(() => {
  //   const fetchUser = async () => {
  //     try {
  //       const res = await fetch(
  //         `${process.env.NEXT_PUBLIC_API_URL}/admin`,
  //         {
  //           method: "GET",
  //           headers: {
  //             "Content-Type": "application/json",
  //           },
  //           credentials: "include",
  //         }
  //       );
  //       if (res.ok) {
  //         const data = await res.json();
  //         setUsername(data.name);
  //       }
  //     } catch (err) {
  //       console.error("Failed to fetch user", err);
  //     }
  //   };
  //   fetchUser();
  // }, []);

  return (
    <nav className="flex w-full justify-between px-6 py-4 bg-white items-start">
      <div className="flex items-center gap-4">
        <SidebarTrigger />
        <div>
          <h1 className="text-lg font-semibold text-gray-800">
            Welcome to your Dashboard,
          
          <p className="text-sm text-gray-600">{username || "Admin"}</p></h1>
        </div>
      </div>
      
      <div className="flex items-center gap-3">
        {/* <ModeToggle />   */}
        <div className="w-10 h-10 rounded-full bg-orange-600 flex items-center justify-center text-white font-semibold">
          {username.charAt(0).toUpperCase() || "A"}
        </div>
        <span className="text-sm font-medium text-gray-700">
          {username || "Admin"}
        </span>
      </div>
    </nav>
  );
}