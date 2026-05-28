"use client";

import { useEffect } from "react";
import { ArrowPathIcon, HomeIcon } from "@heroicons/react/24/outline";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

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
        width: 72,
        height: 72,
        borderRadius: "50%",
        background: "rgba(239, 68, 68, 0.1)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: "2rem",
      }}>
        ⚠️
      </div>
      <h1 style={{ fontSize: "1.75rem", fontWeight: 700, color: "#0f172a" }}>
        Something went wrong
      </h1>
      <p style={{ color: "#64748b", maxWidth: "420px", lineHeight: 1.6 }}>
        An unexpected error occurred. Our team has been notified. Please try again or return home.
      </p>
      {error.digest && (
        <p style={{ fontSize: "0.75rem", color: "#94a3b8", fontFamily: "monospace" }}>
          Error ID: {error.digest}
        </p>
      )}
      <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap", justifyContent: "center" }}>
        <button onClick={reset} className="btn-primary" style={{ display: "inline-flex", alignItems: "center", gap: "8px" }}>
          <ArrowPathIcon width={18} height={18} />
          Try Again
        </button>
        <a href="/" className="btn-secondary" style={{ display: "inline-flex", alignItems: "center", gap: "8px" }}>
          <HomeIcon width={18} height={18} />
          Go Home
        </a>
      </div>
    </div>
  );
}
