import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Contact Us",
  description:
    "Get in touch with Robotics Shop CTG. Order enquiries, bulk pricing, custom robotics projects, and technical support — we're here to help.",
  alternates: { canonical: "https://roboticsshopctg.com/contact" },
  openGraph: {
    title: "Contact Robotics Shop CTG",
    description: "Reach out for order enquiries, bulk pricing, or technical support.",
    url: "https://roboticsshopctg.com/contact",
    type: "website",
  },
};

export default function ContactLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
