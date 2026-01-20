"use client";
import { useEffect, useState } from "react";
import Supermarket from "@/assets/Supermarket workers.gif";
import { useRouter } from "next/navigation";
import Image from "next/image";

interface VerifyEmailProps {
  id: string;
}

export default function verifyEmailPage({ id }: VerifyEmailProps) {
  const [isVerified, setIsVerified] = useState<boolean | null>(null);
  const router = useRouter();
  
  useEffect(() => {
    async function verifyEmail() {
      try {
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/client/verify-email/${id}`,
          {
            method: "GET",
          },
        );
        const data = await response.json();
        setIsVerified(data.success);
      } catch (error) {
        console.error("Error verifying email:", error);
        setIsVerified(false);
      }
    }
    verifyEmail();
  }, []);

  if (isVerified === null) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <p className="text-gray-600">Verifying your email...</p>
      </div>
    );
  }
  if (isVerified) router.push("/login");
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
        <div className="mb-6">
          <Image
            src={Supermarket}
            alt="Order processing"
            width={200}
            height={200}
            className="mx-auto"
            unoptimized
          />
        </div>
        <h1 className="text-2xl font-bold mb-4 text-gray-800">
          Verify Your Email
        </h1>
        <p className="text-gray-600 mb-6">
          A verification link has been sent to your email address. Please check
          your inbox and click on the link to verify your account.
        </p>
        <p className="text-gray-600">
          If you did not receive the email, please check your spam folder or
          request a new verification link.
        </p>
      </div>
    </div>
  );
}
