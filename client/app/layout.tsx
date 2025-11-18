import type { Metadata } from "next";
import { Geist, Geist_Mono, Inter, Roboto, Poppins } from "next/font/google";
import "./globals.css";
import { usePathname } from "next/navigation";
import Onboardingpage1 from "@/components/splashScreen";

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
  // const pathname = usePathname();
  // const isHome = pathname ==="/";
  // const[isLoading, setIsLoading] = useState();

  return (
    <html lang="en">
      <body
        className={`${poppins.variable}  antialiased`}
      >
        {/* <Onboardingpage1 /> */}
        {children}
      </body>
    </html>
  );
}
