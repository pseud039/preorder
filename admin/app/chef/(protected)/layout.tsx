import type { Metadata } from "next";
import { Geist, Geist_Mono, Open_Sans, Montserrat } from "next/font/google";
import "../../globals.css";
import { ChefLayoutClient } from "@/components/chef/ChefLayoutClient";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const openSans = Open_Sans({
  variable: "--font-open-sans",
  subsets: ["latin"],
});

const montserrat = Montserrat({
  variable: "--font-montserrat",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Chef Dashboard",
  description: "Chef dashboard for order management",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${openSans.variable} ${montserrat.variable} antialiased`}
      >
        <ChefLayoutClient>{children}</ChefLayoutClient>
      </body>
    </html>
  );
}
