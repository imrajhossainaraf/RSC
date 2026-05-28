import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Shop Electronics & Robotics Components",
  description:
    "Browse Arduino, Raspberry Pi, ESP32, sensors, motors, displays, and 500+ electronic components. Fast delivery across Bangladesh.",
  alternates: { canonical: "https://roboticsshopctg.com/products" },
  openGraph: {
    title: "Shop Electronics & Robotics Components — Robotics Shop CTG",
    description: "Arduino, Raspberry Pi, ESP32, sensors, motors, and 500+ components. Best prices in Chittagong, Bangladesh.",
    url: "https://roboticsshopctg.com/products",
    type: "website",
  },
};

export default function ProductsLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
