"use client";
import Image from "next/image";
import getStarted from "@/public/get-Started.png";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
export default function GetStartedPage() {
  const router = useRouter();

  return (
    <div className="relative min-h-screen max-w-md mx-auto flex flex-col justify-center items-center px-6 py-8 gap-6">
      <Image
        height={250}
        width={250}
        alt="get-Started illustration"
        src={getStarted}
      />

      <div className="text-center space-y-2">
        <h1 className="font-bold text-primary-text text-2xl">
          Thinking About What to Eat?
        </h1>
        <p className="text-secondary-text">
          Lorem ipsum dolor sit amet consectetur, adipisicing elit. Modi dolore
          facilis laudantium omnis libero nostrum eius distinctio itaque odit
          deserunt
        </p>
      </div>

      <div className="flex flex-col gap-4 w-full max-w-xs">
        <button
          className="btn-secondary "
          onClick={() => router.push("/login")}
        >
          LogIn
        </button>
        <button
          className="btn-secondary"
          onClick={() => router.push("/signup")}
        >
          SignUp
        </button>
      </div>
    </div>
  );
}
