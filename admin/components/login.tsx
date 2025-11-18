"use client";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useEffect } from "react";
import { Toaster } from "@/components/ui/sonner";

interface LoginFormProps extends React.ComponentPropsWithoutRef<"form"> {
  className?: string;
}
const formData = {
  email: "",
  password: ""
};
export function LoginForm({ className, ...props }: LoginFormProps) {

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
  // useEffect(async()=>{
     try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/client/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: formData.email,
          password: formData.password,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        if (response.status === 409) {
          // Toaster.error("Email already exists");
        } else {
          // toast.error(data.message || "Something went wrong");
        }
        return;
      }
  } catch (error) {
      console.error("An unexpected error occurred:", error);
    }};

  return (
    <div className="flex flex-col justify-between min-h-screen ">
    <form className={cn("flex flex-col gap-6", className)} {...props}>
      <div className="flex flex-col items-center gap-2 text-center">
        <h1 className="text-2xl font-bold">Login to your account</h1>
        <p className="text-muted-foreground text-sm text-balance">
          Enter your email below to login to your account
        </p>
      </div>
      <div className="grid gap-6">
        <div className="grid gap-3">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            placeholder="admin@example.com"
            name="email"
            required
          />
        </div>
        <div className="grid gap-3">
          <div className="flex items-center">
            <Label htmlFor="password">Password</Label>
          </div>
          <Input id="password" type="password" name="password" required />
          <a href="#" className="ml-auto text-xs hover:underline">
            
            Forgot your password?
          </a>
        </div>

        <Button type="submit" className="w-full cursor-pointer">
          Login
        </Button>
      </div>
    </form></div>
  );
}
