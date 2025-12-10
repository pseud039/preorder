"use client";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useEffect, useState } from "react";
import { Toaster } from "@/components/ui/sonner";
import { toast } from "sonner";
interface LoginFormProps extends React.ComponentPropsWithoutRef<"form"> {
  className?: string;
}
export function SignupForm({ className, ...props }: LoginFormProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/admin/signup`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: email,
            password: password,
            confirmPassword: confirmPassword,
          }),
        }
      );
      const data = await response.json().catch(() => ({}));

      if (response.status==200) {
        window.location.href = "/emailVerification";
        return;
      }
      if(response.status==409){
        toast.error("User already exists. Please login.", {
          duration: 4000,
        });
      }
      toast.error(data?.message || "Signup failed. Please try again.");
    } catch (error) {
      console.error("An unexpected error occurred:", error);
      toast.error("An unexpected error occurred. Please try again later.");
    }
  };

  return (
    <div className="min-h-screen grid grid-cols-1 md:grid-cols-2 gap-12 md:px-16 md:py-8">
      <div className="bg-[#e8eee3] rounded-xl  hidden md:block">
        {/* <div className="">Lorem ipsum dolor sit amet consectetur adipisicing elit.</div> */}
      </div>
      <form
        className="flex justify-center w-3/4 mx-auto flex-col gap-6"
        {...props}
        onSubmit={handleSubmit}
      ><div className="flex justify-center items-center gap-10 flex-row">
        <div className="flex items-center justify-center mb-4 flex-col">
          <img
            src="/image.png"
            alt="Image"
            className="absolute w-20 object-center"
          />
        </div>
        {/* <p className="font-bold text-xl pb-5 text-orange-600 ">Predine</p> */}
        </div>
        <div className="flex flex-col  items-center gap-2 text-center">
          <h1 className="text-2xl font-bold">Create your account</h1>
          {/* <p className="">Lorem ipsum dolor sit amet, consectetur adipiscing elit.</p>  */}
        </div>
        <div className="grid gap-6">
          <div className="grid gap-2">
            {/* <Label htmlFor="email">Email</Label> */}
            <Input
              id="email"
              type="email"
              placeholder="Email address"
              name="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="h-12 px-6 placeholder:text-muted-foreground"
            />
          </div>
          <div className="grid gap-2">
          
            <Input
              id="password"
              type="password"
              name="password"
              placeholder="Password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="h-12 px-6 placeholder:text-muted-foreground"
            />
          </div>
          <div className="grid gap-2">
            {/* <Label htmlFor="email">Email</Label> */}
            <Input
              id="confirmPassword"
              type="password"
              placeholder="Confirm Password"
              name="confirmPassword"
              required
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="h-12 px-6 placeholder:text-muted-foreground"
            />
          </div>
          <Button type="submit" className="w-full cursor-pointer bg-[#ff5c00] hover:bg-[#ff5c00] h-12 w-15/16 mx-auto text-white">
            SignUp
          </Button>
          <p className="mx-auto text-sm text-muted-foreground">Already have an account?{" "}
          <a href="/login" className="text-black hover:text-[#ff5c00] hover:underline">Login</a></p>
        </div>
      </form>
    </div>
  );
}
