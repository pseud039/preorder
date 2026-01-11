import type { Metadata } from "next";
import { Geist, Geist_Mono, Inter, Roboto, Poppins } from "next/font/google";
import "./globals.css";
import { usePathname } from "next/navigation";
import { Toaster } from 'sonner';
// import Onboardingpage1 from "@/components/splashScreen";
import  AppWrapper  from "@/components/wrapper";

// import LoadWS from "./loadws";
const APP_NAME = "Predine";
const APP_DEFAULT_TITLE = "Predine";
const APP_TITLE_TEMPLATE = "%s - Predine";
const APP_DESCRIPTION = "Predine - Order food without the hassle";

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
};

// const geistSans = Geist({
//   variable: "--font-geist-sans",
//   subsets: ["latin"],
// });
const roboto = Roboto({
  variable: "--font-roboto",
  subsets: ["latin"],
});
const poppins = Poppins({
  weight: "200",
  variable: "--font-poppins",
  subsets: ["latin"],
});
const InterSans = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

// const geistMono = Geist_Mono({
//   variable: "--font-geist-mono",
//   subsets: ["latin"],
// });

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${poppins.variable}  antialiased`}
      >
        {/* <Onboardingpage1 /> */}
        <Toaster 
          position="top-center"
          toastOptions={{
            style: {
              background: '#fff',
              color: '#1f2937',
              border: '1px solid #e5e7eb',
              borderRadius: '12px',
              fontSize: '14px',
            },
            className: 'font-[inter]',
            duration: 3000,
            // success: {
            //   style: {
            //     background: '#fff',
            //     color: '#059669',
            //     border: '1px solid #10b981',
            //   },
            //   iconTheme: {
            //     primary: '#10b981',
            //     secondary: '#fff',
            //   },
            // },
            // error: {
            //   style: {
            //     background: '#fff',
            //     color: '#dc2626',
            //     border: '1px solid #ef4444',
            //   },
            //   iconTheme: {
            //     primary: '#ef4444',
            //     secondary: '#fff',
            //   },
            // },
            // info: {
            //   style: {
            //     background: '#fff',
            //     color: '#f97316',
            //     border: '1px solid #f97316',
            //   },
            //   iconTheme: {
            //     primary: '#f97316',
            //     secondary: '#fff',
            //   },
            // },
          }}
        />
              <AppWrapper>
          {children}
        </AppWrapper>
      </body>
    </html>
  );
}
