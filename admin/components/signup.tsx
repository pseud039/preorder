"use client";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useEffect } from "react";
import { Toaster } from "@/components/ui/sonner";
import { toast } from "sonner";
interface LoginFormProps extends React.ComponentPropsWithoutRef<"form"> {
  className?: string;
}
const formData = {
  email: "",
  password: "",
  confirmPassword: "",
};
export function SignupForm({ className, ...props }: LoginFormProps) {
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/client/signup`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: formData.email,
            password: formData.password,
          }),
        }
      );
      if (response.status === 200) {
        // Handle successful signup
        window.location.href = "/admin/emailVerification";
      }
      if(response.status!==200){
        // alert("Signup failed. Please try again.");
      toast.error(response
        .json().then((data) => data.message)
      );
      }

    } catch (error) {
      console.error("An unexpected error occurred:", error);
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
              className="h-12 px-6 placeholder:text-muted-foreground"
            />
          </div>
          <p className="text-right text-sm text-muted-foreground">Already have an account?{" "}
          <a href="" className="text-black hover:text-[#ff5c00] hover:underline">Login</a></p>
          <Button type="submit" className="w-full cursor-pointer bg-[#ff5c00] hover:bg-[#ff5c00] h-12 w-15/16 mx-auto text-white">
            SignUp
          </Button>
        </div>
      </form>
    </div>
  );
}
