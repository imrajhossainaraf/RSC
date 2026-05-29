import type { Metadata } from "next";
import { Outfit, Inter } from "next/font/google";
import "./globals.css";
import Sidebar from "@/components/Sidebar";
import { Providers } from "@/components/Providers";

const outfit = Outfit({
  subsets: ["latin"],
  variable: "--font-heading-loaded",
  display: "swap",
});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-main-loaded",
  display: "swap",
});

const BASE_URL = "https://roboticsshopctg.com";

export const metadata: Metadata = {
  metadataBase: new URL(BASE_URL),
  title: {
    default: "Robotics Shop CTG — Electronics & Components",
    template: "%s | Robotics Shop CTG",
  },
  description:
    "Robotics Shop CTG — Your trusted source for electronic components, development boards, Arduino, Raspberry Pi, drones, IoT devices, sensors, and robotics services in Chittagong, Bangladesh.",
  keywords: [
    "electronics shop Chittagong",
    "robotics components Bangladesh",
    "Arduino Bangladesh",
    "Raspberry Pi Bangladesh",
    "ESP32",
    "sensors",
    "motor driver",
    "IoT devices",
    "drone parts",
    "electronics Chittagong",
  ],
  authors: [{ name: "Robotics Shop CTG" }],
  creator: "Robotics Shop CTG",
  publisher: "Robotics Shop CTG",
  alternates: { canonical: BASE_URL },
  openGraph: {
    title: "Robotics Shop CTG — Electronics & Components",
    description: "Premium electronic components, development boards, sensors, and robotics supplies in Chittagong, Bangladesh.",
    url: BASE_URL,
    siteName: "Robotics Shop CTG",
    images: [
      {
        url: "/images/ChatGPT Image May 28, 2026, 09_02_11 PM.png",
        width: 512,
        height: 512,
        alt: "Robotics Shop CTG Logo",
      },
    ],
    type: "website",
    locale: "en_US",
  },
  twitter: {
    card: "summary",
    title: "Robotics Shop CTG — Electronics & Components",
    description: "Premium electronic components and robotics supplies in Chittagong, Bangladesh.",
    images: ["/images/ChatGPT Image May 28, 2026, 09_02_11 PM.png"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true },
  },
  verification: {
    google: "rhxa2No-sAcr4QuFou7-ibFTHUhQR_0RWbLsK9Vls-A",
  },
};

import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${outfit.variable} ${inter.variable}`}>
      <body>
        <Providers>
          <Navbar />
          <div className="app-container">
            <Sidebar />
            <main className="main-content">{children}</main>
          </div>
          <Footer />
        </Providers>
      </body>
    </html>
  );
}
