"use client";
import Image from "next/image";
import login from "@/public/login.png";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

interface Props {
  token: string;
}

interface FormData {
  password: string;
  confirmPassword: string;
}

interface FormErrors {
  password: string;
  confirmPassword: string;
}

export default function ResetPasswordPage({ token }: Props) {
  const [formData, setFormData] = useState<FormData>({ password: "", confirmPassword: "" });
  const [errors, setErrors] = useState<FormErrors>({ password: "", confirmPassword: "" });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const router = useRouter();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name as keyof FormErrors]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: FormErrors = { password: "", confirmPassword: "" };
    let isValid = true;

    if (!formData.password) {
      newErrors.password = "Password is required";
      isValid = false;
    } else if (formData.password.length < 8) {
      newErrors.password = "Password must be at least 8 characters";
      isValid = false;
    }

    if (!formData.confirmPassword) {
      newErrors.confirmPassword = "Please confirm your password";
      isValid = false;
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = "Passwords do not match";
      isValid = false;
    }

    setErrors(newErrors);
    return isValid;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsSubmitting(true);
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/client/password/${token}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ password: formData.password }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        toast.error(data.message || "Something went wrong");
        return;
      }

      setSuccess(true);
      toast.success("Password reset successful!");
      setTimeout(() => router.push("/login"), 2000);
    } catch (error) {
      toast.error("Something went wrong. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="relative min-h-screen max-w-md mx-auto flex flex-col justify-center items-center px-6 py-8">
      <div className="w-full max-w-sm space-y-6">
        <div className="flex justify-center">
          <Image height={250} width={250} src={login} alt="Reset Password" priority className="object-contain" />
        </div>

        <div className="space-y-2 text-center">
          <h1 className="text-2xl font-semibold">Reset Password</h1>
          <p className="text-sm text-gray-500">Enter your new password below</p>
        </div>

        {success ? (
          <div className="text-center text-green-600 font-medium">
            Password reset! Redirecting to login...
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-4">
              <div>
                <input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="New password"
                  disabled={isSubmitting}
                  className={`w-full px-2 py-3 bg-transparent border-b-2 ${
                    errors.password ? "border-red-500" : "border-gray-300"
                  } focus:outline-none focus:border-orange-500 transition-colors placeholder:text-gray-400 disabled:opacity-50`}
                />
                {errors.password && <p className="text-red-500 text-sm mt-1">{errors.password}</p>}
              </div>

              <div>
                <input
                  type="password"
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  placeholder="Confirm new password"
                  disabled={isSubmitting}
                  className={`w-full px-2 py-3 bg-transparent border-b-2 ${
                    errors.confirmPassword ? "border-red-500" : "border-gray-300"
                  } focus:outline-none focus:border-orange-500 transition-colors placeholder:text-gray-400 disabled:opacity-50`}
                />
                {errors.confirmPassword && <p className="text-red-500 text-sm mt-1">{errors.confirmPassword}</p>}
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full btn-secondary disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? "Resetting..." : "Reset Password"}
            </button>

            <div className="text-center">
              <button type="button" onClick={() => router.push("/login")} className="text-orange-500 text-sm hover:underline">
                Back to Login
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}