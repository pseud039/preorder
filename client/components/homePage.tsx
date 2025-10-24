"use client";
import { useEffect, useState } from "react";

export default function HomePage() {
  const [formData, setFormData] = useState({ name: "Foodie!" });
  return (
    <div className="max-w-md mx-auto flex flex-col  items-center bg-secondary min-h-screen">
      <header className="pt-12 font-semibold text-2xl">
        Hey {formData.name}
      </header>
    </div>
  );
}
