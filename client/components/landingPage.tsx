"use client";
import { useEffect, useState } from "react";
import Image from "next/image";
import logo from "/public/icon.png";

export default function Onboardingpage1() {
  return (
    <main className="bg-gradient-to-b from-secondary via-accent to-secondary min-h-screen max-w-md mx-auto overflow-hidden flex justify-center items-center flex-col">
      <Image className="" height={150} width={150} alt="logo" src={logo} />
      <div className="font-bold uppercase text-3xl text-primary font-[Inter]">
        Predine
      </div>
    </main>
  );
}
