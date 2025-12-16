"use client";
import Image from "next/image";
import login from "@/public/login.png";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { fetchWithAuth } from "@/lib/auth";

interface FormData {
  email: string;
  password: string;
}

interface FormErrors {
  email: string;
  password: string;
}

interface LoginResponse {
  success: boolean;
  data: {
    user:{
       id: number;
      email: string;
      name?: string;
    }
    accessToken: string;
    refreshToken: string;
  };
  message: string;
}


export default function LoginPage() {
  const [formData, setFormData] = useState<FormData>({
    email: "",
    password: "",
  });
  const [errors, setErrors] = useState<FormErrors>({
    email: "",
    password: "",
  });
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const router = useRouter();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    if (errors[name as keyof typeof errors]) {
      setErrors((prev) => ({
        ...prev,
        [name]: "",
      }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {
      email: "",
      password: "",
    };
    let isValid = true;

    if (!formData.email) {
      newErrors.email = "Email is required";
      isValid = false;
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = "Please enter a valid email";
      isValid = false;
    }

    if (!formData.password) {
      newErrors.password = "Password is required";
      isValid = false;
    } else if (formData.password.length < 8) {
      newErrors.password = "Password must be at least 8 characters";
      isValid = false;
    }

    setErrors(newErrors);
    return isValid;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/client/login`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
          body: JSON.stringify({
            email: formData.email,
            password: formData.password,
          }),
        }
      );

      const data: LoginResponse = await response.json();

      if (!response.ok) {
        if (response.status === 409) {
          toast.error("Email already exists");
        }else if (response.status === 401){
          throw new Error("Invalid credentials");
        } else if (response.status === 404) {
          toast.error("User not found. Please sign up first.");
        } else {
          toast.error(data.message || "Something went wrong");
        }
        return;
      }
console.log(data.data.accessToken)
      if (data.data?.accessToken) {
        localStorage.setItem("accessToken", data.data.accessToken);

        const storedToken = localStorage.getItem("accessToken");
      } else {
        console.error(" No token in response!");
        console.error("Response structure:", JSON.stringify(data, null, 2));
        toast.error("Login succeeded but no token received");
        return;
      }

      toast.success("Logged in successfully!");

      setTimeout(() => {
        router.push("/dashboard");
      }, 1000);
    } catch (error) {
      console.error("=== Login Error ===");
      console.error("Error:", error);
      toast.error("Verify the credentials and try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="relative min-h-screen max-w-md mx-auto flex flex-col justify-center items-center px-6 py-8">
      <div className="w-full max-w-sm space-y-6">
        <div className="flex justify-center">
          <Image
            height={250}
            width={250}
            src={login}
            alt="LogIn illustration"
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

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full btn-secondary disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? "Logging in..." : "Login"}
          </button>

          <div className="flex flex-row justify-center items-center gap-1">
            <span className="text-center text-sm text-primary-text/60">
                Don&apos;t have an account?
            </span>
            <button
              type="button"
              onClick={() => router.push("/signup")}
              className="text-orange-500 font-semibold hover:underline cursor-pointer"
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
