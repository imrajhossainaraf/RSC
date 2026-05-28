import Link from "next/link";
import { HomeIcon, MagnifyingGlassIcon } from "@heroicons/react/24/outline";

export default function NotFound() {
  return (
    <div style={{
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      minHeight: "70vh",
      gap: "1.5rem",
      textAlign: "center",
      padding: "2rem",
    }}>
      <div style={{
        fontSize: "6rem",
        fontWeight: 900,
        background: "linear-gradient(135deg, #7c3aed, #f97316)",
        WebkitBackgroundClip: "text",
        WebkitTextFillColor: "transparent",
        lineHeight: 1,
      }}>
        404
      </div>
      <h1 style={{ fontSize: "1.75rem", fontWeight: 700, color: "#0f172a" }}>
        Page Not Found
      </h1>
      <p style={{ color: "#64748b", maxWidth: "420px", lineHeight: 1.6 }}>
        The page you&apos;re looking for doesn&apos;t exist or has been moved. Let&apos;s get you back on track.
      </p>
      <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap", justifyContent: "center" }}>
        <Link href="/" className="btn-primary" style={{ display: "inline-flex", alignItems: "center", gap: "8px" }}>
          <HomeIcon width={18} height={18} />
          Go Home
        </Link>
        <Link href="/products" className="btn-secondary" style={{ display: "inline-flex", alignItems: "center", gap: "8px" }}>
          <MagnifyingGlassIcon width={18} height={18} />
          Browse Products
        </Link>
      </div>
    </div>
  );
}
