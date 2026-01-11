"use client";
import { useState } from "react";
import { ChefHat, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function CreateChefPage() {
  const [loading, setLoading] = useState<boolean>(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
    specialization: "",
    shiftStart: "",
    shiftEnd: "",
  });

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const validateForm = () => {
    if (!formData.name.trim()) {
      toast.error("Name is required");
      return false;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      toast.error("Invalid email format");
      return false;
    }

    if (formData.phone.length < 10) {
      toast.error("Phone number must be at least 10 digits");
      return false;
    }

    if (formData.password.length < 8) {
      toast.error("Password must be at least 8 characters");
      return false;
    }

    if (formData.password !== formData.confirmPassword) {
      toast.error("Passwords do not match");
      return false;
    }

    // Validate shift times if provided
    if (formData.shiftStart && formData.shiftEnd) {
      if (formData.shiftStart >= formData.shiftEnd) {
        toast.error("Shift start time must be before shift end time");
        return false;
      }
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    setLoading(true);

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/admin/staff/create-chef`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({
            name: formData.name,
            email: formData.email,
            phone: formData.phone,
            password: formData.password,
            specialization: formData.specialization || null,
            shiftStart: formData.shiftStart || null,
            shiftEnd: formData.shiftEnd || null,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to create chef");
      }

      toast.success("Chef created successfully!");

      // Reset form
      setFormData({
        name: "",
        email: "",
        phone: "",
        password: "",
        confirmPassword: "",
        specialization: "",
        shiftStart: "",
        shiftEnd: "",
      });
    } catch (error: any) {
      console.error("Error creating chef:", error);
      toast.error(error.message || "Failed to create chef");
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setFormData({
      name: "",
      email: "",
      phone: "",
      password: "",
      confirmPassword: "",
      specialization: "",
      shiftStart: "",
      shiftEnd: "",
    });
  };

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <div className="bg-white rounded-xl shadow-sm p-8">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <div className="p-3 bg-orange-50 rounded-lg">
            <ChefHat className="w-6 h-6 text-orange-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-800">
              Create Chef
            </h1>
            <p className="text-sm text-gray-600">
              Add a new chef to your restaurant
            </p>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Name */}
          <div>
            <Label htmlFor="name">
              Full Name <span className="text-red-500">*</span>
            </Label>
            <Input
              id="name"
              type="text"
              value={formData.name}
              onChange={(e) => handleChange("name", e.target.value)}
              placeholder="Enter full name"
              required
              className="mt-1"
              disabled={loading}
            />
          </div>

          {/* Email */}
          <div>
            <Label htmlFor="email">
              Email <span className="text-red-500">*</span>
            </Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => handleChange("email", e.target.value)}
              placeholder="chef@example.com"
              required
              className="mt-1"
              disabled={loading}
            />
          </div>

          {/* Phone */}
          <div>
            <Label htmlFor="phone">
              Phone Number <span className="text-red-500">*</span>
            </Label>
            <Input
              id="phone"
              type="tel"
              value={formData.phone}
              onChange={(e) => handleChange("phone", e.target.value)}
              placeholder="1234567890"
              required
              className="mt-1"
              disabled={loading}
            />
          </div>

          {/* Specialization */}
          <div>
            <Label htmlFor="specialization">
              Specialization <span className="text-gray-500">(Optional)</span>
            </Label>
            <Select
              value={formData.specialization}
              onValueChange={(value) => handleChange("specialization", value)}
              disabled={loading}
            >
              <SelectTrigger className="mt-1">
                <SelectValue placeholder="Select specialization" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="North Indian">North Indian</SelectItem>
                <SelectItem value="South Indian">South Indian</SelectItem>
                <SelectItem value="Chinese">Chinese</SelectItem>
                <SelectItem value="Italian">Italian</SelectItem>
                <SelectItem value="Continental">Continental</SelectItem>
                <SelectItem value="Bakery">Bakery</SelectItem>
                <SelectItem value="Desserts">Desserts</SelectItem>
                <SelectItem value="Fast Food">Fast Food</SelectItem>
                <SelectItem value="General">General</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Shift Times */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="shiftStart">
                Shift Start <span className="text-gray-500">(Optional)</span>
              </Label>
              <Input
                id="shiftStart"
                type="time"
                value={formData.shiftStart}
                onChange={(e) => handleChange("shiftStart", e.target.value)}
                className="mt-1"
                disabled={loading}
              />
            </div>
            <div>
              <Label htmlFor="shiftEnd">
                Shift End <span className="text-gray-500">(Optional)</span>
              </Label>
              <Input
                id="shiftEnd"
                type="time"
                value={formData.shiftEnd}
                onChange={(e) => handleChange("shiftEnd", e.target.value)}
                className="mt-1"
                disabled={loading}
              />
            </div>
          </div>

          {/* Password */}
          <div>
            <Label htmlFor="password">
              Password <span className="text-red-500">*</span>
            </Label>
            <Input
              id="password"
              type="password"
              value={formData.password}
              onChange={(e) => handleChange("password", e.target.value)}
              placeholder="Minimum 8 characters"
              required
              className="mt-1"
              disabled={loading}
            />
            <p className="text-xs text-gray-500 mt-1">
              Must be at least 8 characters long
            </p>
          </div>

          {/* Confirm Password */}
          <div>
            <Label htmlFor="confirmPassword">
              Confirm Password <span className="text-red-500">*</span>
            </Label>
            <Input
              id="confirmPassword"
              type="password"
              value={formData.confirmPassword}
              onChange={(e) => handleChange("confirmPassword", e.target.value)}
              placeholder="Re-enter password"
              required
              className="mt-1"
              disabled={loading}
            />
          </div>

          {/* Submit Buttons */}
          <div className="flex gap-3 pt-4 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={handleReset}
              disabled={loading}
              className="flex-1"
            >
              Reset
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="flex-1 bg-orange-600 hover:bg-orange-700"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  <ChefHat className="w-4 h-4 mr-2" />
                  Create Chef
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
