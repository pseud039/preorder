"use client";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { toast } from "sonner";

interface LoginFormProps extends React.ComponentPropsWithoutRef<"form"> {
  className?: string;
}

interface ForgotPasswordData {
  email: string;
}

export function LoginForm({ className, ...props }: LoginFormProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [isLoginLoading, setIsLoginLoading] = useState<boolean>(false);
  const [formData, setFormData] = useState<ForgotPasswordData>({ email: "" });

  const handleSubmitPass = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/admin/auth/forgot-password`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({
            email: formData.email,
          }),
        }
      );

      const data = await response.json();

      if (data.success) {
        setIsDialogOpen(false);
        toast.success("Password reset email sent successfully!", {
          duration: 4000,
        });
      } else {
        toast.error(data.message || "Failed to send password reset email", {
          duration: 4000,
        });
      }
    } catch (error) {
      console.error("Error sending forgot password email:", error);
      toast.error("Network error. Please try again.", {
        duration: 4000,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoginLoading(true);

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/admin/auth/login`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include", 
          body: JSON.stringify({
            email: email,
            password: password,
          }),
        }
      );

      const data = await response.json();

      if (response.ok && data.success) {
        toast.success("Login successful!", {
          duration: 2000,
        });

        const userRole = data.data?.user?.role;
        setTimeout(() => {
          if (userRole === "superadmin") {
            window.location.href = "/superadmin/dashboard";
          } else if (userRole === "chef") {
            window.location.href = "/chef/dashboard";
          } else {
            window.location.href = "/admin/dashboard";
          }
        }, 500);
        return;
      }

      if (response.status === 404) {
        toast.error("Invalid credentials. Please check your email and password.", {
          duration: 4000,
        });
      } else if (response.status === 401) {
        toast.error("Invalid password. Please try again.", {
          duration: 4000,
        });
      } else if (response.status === 403) {
        toast.error(data.message || "Account is deactivated. Contact support.", {
          duration: 4000,
        });
      } else {
        toast.error(data.message || "Login failed. Please try again.", {
          duration: 4000,
        });
      }
    } catch (error) {
      console.error("Login error:", error);
      toast.error(
        "Network error. Please check your connection and try again.",
        {
          duration: 4000,
        }
      );
    } finally {
      setIsLoginLoading(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  return (
    <div className="min-h-screen grid grid-cols-1 md:grid-cols-2 gap-12 md:px-16 md:py-8">
      <div className="bg-[#e8eee3] rounded-xl hidden md:block"></div>
      <form
        className="flex justify-center w-3/4 mx-auto flex-col gap-6"
        {...props}
        onSubmit={handleSubmit}
      >
        <div className="flex justify-center items-center gap-10 flex-row">
          <div className="flex items-center justify-center mb-4 flex-col">
            <img
              src="/image.png"
              alt="Image"
              className="absolute w-20 object-center"
            />
          </div>
        </div>
        <div className="flex flex-col items-center gap-2 text-center">
          <h1 className="text-2xl font-bold">Log into your account</h1>
        </div>
        <div className="grid gap-4">
          <div className="grid gap-2">
            <Input
              id="email"
              type="email"
              placeholder="Email address"
              name="email"
              value={email}
              required
              onChange={(e) => setEmail(e.target.value)}
              className="h-12 px-6 placeholder:text-muted-foreground"
              disabled={isLoginLoading}
            />
          </div>
          <div className="grid gap-1">
            <Input
              id="password"
              type="password"
              name="password"
              placeholder="Password"
              value={password}
              required
              onChange={(e) => setPassword(e.target.value)}
              className="h-12 px-6 placeholder:text-muted-foreground"
              disabled={isLoginLoading}
            />
          </div>
          <div className="flex justify-end items-center flex-row w-full">
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <p className="gap-2 text-sm text-right text-black hover:text-[#ff5c00] hover:underline hover:cursor-pointer">
                  Forgot Password?
                </p>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[525px]">
                <DialogHeader>
                  <DialogTitle className="text-center">
                    Forgot Password?
                  </DialogTitle>
                  <DialogDescription className="mx-auto pt-2">
                    Don't worry, we will send you a password reset link.
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmitPass}>
                  <div className="grid gap-4 py-4">
                    <div className="grid gap-2">
                      <Label htmlFor="forgot-email" className="pb-1">
                        Email
                      </Label>
                      <Input
                        id="forgot-email"
                        type="email"
                        value={formData.email}
                        onChange={(e) =>
                          handleInputChange("email", e.target.value)
                        }
                        placeholder="Enter email address"
                        required
                      />
                    </div>
                  </div>

                  <DialogFooter>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setIsDialogOpen(false)}
                      disabled={isSubmitting}
                    >
                      Cancel
                    </Button>
                    <Button
                      className="bg-orange-600 hover:bg-orange-700"
                      type="submit"
                      disabled={isSubmitting}
                    >
                      {isSubmitting ? "Sending..." : "Send email"}
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          </div>
          <Button
            type="submit"
            disabled={isLoginLoading}
            className="gap-2 w-full cursor-pointer bg-[#ff5c00] hover:bg-[#ff5c00] h-12 w-15/16 mx-auto text-white disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoginLoading ? "Logging in..." : "Login"}
          </Button>
        </div>
      </form>
    </div>
  );
}