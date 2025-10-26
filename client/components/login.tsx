"use client";
import Image from "next/image";
import login from "@/public/login.png";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

export default function LoginPage() {
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const [errors, setErrors] = useState({
    email: "",
    password: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    // Clear error when user starts typing
    if (errors[name as keyof typeof errors]) {
      setErrors((prev) => ({
        ...prev,
        [name]: "",
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {
      email: "",
      password: "",
    };
    let isValid = true;

    // Email validation
    if (!formData.email) {
      newErrors.email = "Email is required";
      isValid = false;
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = "Please enter a valid email";
      isValid = false;
    }

    // Password validation
    if (!formData.password) {
      newErrors.password = "Password is required";
      isValid = false;
    }

    setErrors(newErrors);
    return isValid;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate form
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    try {
      // API call here
      const response = await fetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: formData.email,
          password: formData.password,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        // Show toast for API errors
        if (response.status === 401) {
          toast.error("Invalid email or password");
        } else {
          toast.error(data.message || "Something went wrong");
        }
        return;
      }

      // Success toast
      toast.success("Login successful!");

      // Redirect after successful login
      setTimeout(() => {
        router.push("/home"); // or wherever you want to redirect
      }, 1000);
    } catch (error) {
      console.error("Login error:", error);
      toast.error("Network error. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="relative min-h-screen max-w-md mx-auto bg-orange-50 flex flex-col items-center px-6 py-8">
      <div className="w-full max-w-sm space-y-6 mt-12">
        <div className="flex justify-center">
          <Image
            height={250}
            width={250}
            src={login}
            alt="Sign in illustration"
            priority
            className="object-contain"
          />
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-4">
            {/* Email Input */}
            <div>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="Enter your email"
                disabled={isSubmitting}
                className={`w-full px-2 py-3 bg-transparent border-b-2 ${
                  errors.email ? "border-red-500" : "border-gray-300"
                } focus:outline-none focus:border-orange-500 transition-colors placeholder:text-gray-400 disabled:opacity-50`}
              />
              {errors.email && (
                <p className="text-red-500 text-sm mt-1">{errors.email}</p>
              )}
            </div>

            {/* Password Input */}
            <div>
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="Password"
                disabled={isSubmitting}
                className={`w-full px-2 py-3 bg-transparent border-b-2 ${
                  errors.password ? "border-red-500" : "border-gray-300"
                } focus:outline-none focus:border-orange-500 transition-colors placeholder:text-gray-400 disabled:opacity-50`}
              />
              {errors.password && (
                <p className="text-red-500 text-sm mt-1">{errors.password}</p>
              )}
            </div>
          </div>
          <div className="text-primary flex justify-end hover:text-red-600 hover:cursor-pointer">
            Forgot Password?
          </div>
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full btn-secondary disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? "Logging in" : "Log In"}
          </button>
          <div className="flex flex-row justify-center items-center gap-1">
          <span className="text-center text-sm text-gray-600">
            Don{`&apos;`}t have an account? </span>
            <button
              type="button"
              onClick={() => router.push("/signup")}
              className="text-orange-500 font-semibold hover:underline"
              disabled={isSubmitting}
            >
              Sign Up
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
