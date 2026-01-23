"use client";
import Image from "next/image";
import signUp from "@/public/sign-Up.png";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Checkbox } from "@/components/ui/checkbox";
import { Field, FieldContent, FieldDescription, FieldGroup, FieldLabel } from "@/components/ui/field"


export default function SignUpPage() {
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [errors, setErrors] = useState({
    email: "",
    password: "",
    confirmPassword: "",
      terms: "",
  });

  const handleTermsChange = (checked: boolean) => {
  setAcceptedTerms(checked);
  if (checked && errors.terms) {
    setErrors((prev) => ({
      ...prev,
      terms: "",
    }));
  }
};
  const [isSubmitting, setIsSubmitting] = useState(false);
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

  const validateForm = () => {
    const newErrors = {
      email: "",
      password: "",
      confirmPassword: "",
          terms: "",

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
    } else if (formData.password.length < 6) {
      newErrors.password = "Password must be at least 6 characters";
      isValid = false;
    }

    if (!formData.confirmPassword) {
      newErrors.confirmPassword = "Please confirm your password";
      isValid = false;
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = "Passwords do not match";
      isValid = false;
    }
if (!acceptedTerms) {
    newErrors.terms = "You must accept the terms and conditions";
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

      const data = await response.json();

      if (!response.ok) {
        if (response.status === 409) {
          toast.error("Email already exists");
        } else {
          toast.error(data.message || "Something went wrong");
        }
        return;
      }

      toast.success("Account created. Verify the email sent to you!");

      setTimeout(() => {
        router.push("/verify-email");
      }, 1000);
    } catch (error) {
      console.error("Signup error:", error);
      toast.error("Network error. Please try again.");
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
            src={signUp}
            alt="Sign up illustration"
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

            {/* Confirm Password Input */}
            <div>
              <input
                type="password"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                placeholder="Confirm password"
                disabled={isSubmitting}
                className={`w-full px-2 py-3 bg-transparent border-b-2 ${
                  errors.confirmPassword ? "border-red-500" : "border-gray-300"
                } focus:outline-none focus:border-orange-500 transition-colors placeholder:text-gray-400 disabled:opacity-50`}
              />
              {errors.confirmPassword && (
                <p className="text-red-500 text-sm mt-1">
                  {errors.confirmPassword}
                </p>
              )}
            </div>
          </div>
          <div className=""><div className="text-gray-500 p-2">
 <FieldGroup className="mx-auto w-full">
      <Field orientation="horizontal">
        <Checkbox
          id="terms-checkbox-desc"
          name="terms-checkbox-desc"
           checked={acceptedTerms}
  onCheckedChange={handleTermsChange}
  disabled={isSubmitting}
        />
        <FieldContent className="font-xs">
          <FieldLabel htmlFor="terms-checkbox-desc ">
            Accept <a href="/policies" className="hover:underline">terms and conditions</a>
          </FieldLabel>
          <FieldDescription className="">
            By clicking this checkbox, you agree to the terms and conditions.
          </FieldDescription>
          {errors.terms && (
  <FieldDescription className="text-red-500 ml-6">
    {errors.terms}
  </FieldDescription>
)}
        </FieldContent>
      </Field>
    </FieldGroup></div>
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full btn-secondary disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? "Signing up" : "Sign Up"}
          </button></div>
          <div className="flex flex-row justify-center items-center gap-1">
            <span className="text-center text-sm text-primary-text/60">
              Already have an account?
            </span>
            <button
              type="button"
              onClick={() => router.push("/login")}
              className="text-orange-500 font-semibold hover:underline cursor-pointer"
              disabled={isSubmitting}
            >
              Log In
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
