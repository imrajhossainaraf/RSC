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

export const metadata: Metadata = {
  title: {
    default: "Robotics Shop CTG — Electronics & Components",
    template: "%s | Robotics Shop CTG",
  },
  description:
    "Robotics Shop CTG — Your trusted source for electronic components, development boards, drones, IoT devices, power systems, and professional robotics services in Chittagong.",
  keywords: [
    "electronics",
    "robotics",
    "components",
    "Arduino",
    "Raspberry Pi",
    "drones",
    "sensors",
    "Chittagong",
    "Bangladesh",
  ],
  openGraph: {
    title: "Robotics Shop CTG",
    description: "Premium electronic components and robotics supplies.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${outfit.variable} ${inter.variable}`}>
      <body>
        <Providers>
          <div className="app-container">
            <Sidebar />
            <main className="main-content">{children}</main>
          </div>
        </Providers>
      </body>
    </html>
  );
}
