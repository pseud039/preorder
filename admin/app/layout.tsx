import type { Metadata } from "next";
import { Geist, Geist_Mono, Open_Sans, Montserrat } from "next/font/google";
import "./globals.css";
import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/admin/admin.sidebar";
import { ThemeProvider } from "@/components/themeSwitch";
import Navbar from "@/components/header";
// import { NotificationListener } from '@/components/notificationListener';
import { Toaster } from "sonner";


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

// import LoadWS from "./loadws";
const APP_NAME = "Predine";
const APP_DEFAULT_TITLE = "Predine";
const APP_TITLE_TEMPLATE = "%s - Predine";
const APP_DESCRIPTION = "PredineAdmin - Manage orders without the hassle";

export const metadata: Metadata = {
  applicationName: APP_NAME,
  title: {
    default: APP_DEFAULT_TITLE,
    template: APP_TITLE_TEMPLATE,
  },
  description: APP_DESCRIPTION,
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: APP_DEFAULT_TITLE,
    // startUpImage: [],
  },
  formatDetection: {
    telephone: false,
  },
  openGraph: {
    type: "website",
    siteName: APP_NAME,
    title: {
      default: APP_DEFAULT_TITLE,
      template: APP_TITLE_TEMPLATE,
    },
    description: APP_DESCRIPTION,
  },
  twitter: {
    card: "summary",
    title: {
      default: APP_DEFAULT_TITLE,
      template: APP_TITLE_TEMPLATE,
    },
    description: APP_DESCRIPTION,
  },
  icons: {
    icon: '/source-icon.png',
    shortcut: '/source-icon.png',
    apple: '/source-icon.png'
  },
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
      ><main>

          {children}
      </main>
            {/* <NotificationListener /> */}
      <Toaster position="top-center"/>
      </body>
    </html>
  );
}
