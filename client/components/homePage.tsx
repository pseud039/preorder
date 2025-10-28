"use client";
import { useEffect, useState } from "react";

export default function HomePage() {
  const [formData, setFormData] = useState({ name: "Foodie" });
  const [activeFilter, setActiveFilter] = useState("all"); // "all", "veg", "nonveg"

  const menuItems = [
    {
      id: 1,
      image:
        "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=400",
      title: "Mixed Veggie",
      category: "Veg",
      description: "Fresh mixed vegetables",
      isVeg: true,
      price: 120,
    },
    {
      id: 2,
      image:
        "https://images.unsplash.com/photo-1603133872878-684f208fb84b?w=400",
      title: "Egg Rice",
      category: "Non-Veg",
      description: "Fried rice with eggs",
      isVeg: false,
      price: 150,
    },
    {
      id: 3,
      image: "https://images.unsplash.com/photo-1562967914-608f82629710?w=400",
      title: "Fried Chicken",
      category: "Non-Veg",
      description: "Crispy fried chicken",
      isVeg: false,
      price: 200,
    },
    {
      id: 4,
      image:
        "https://images.unsplash.com/photo-1596560548464-f010549b84d7?w=400",
      title: "Chicken Rice",
      category: "Non-Veg",
      description: "Rice with chicken",
      isVeg: false,
      price: 180,
    },
  ];
  const filteredItems = menuItems.filter((item) => {
    if (activeFilter === "all") return true;
    if (activeFilter === "veg") return item.isVeg;
    if (activeFilter === "nonveg") return !item.isVeg;
    return true;
  });
  return (
    <div className="max-w-md mx-auto flex flex-col justify-start px-8 bg-accent min-h-screen">
      <header className="pt-12 font-semibold text-2xl flex ">
        Hey {formData.name}!
      </header>
    </div>
  );
}
