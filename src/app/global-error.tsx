"use client";

import { useEffect } from "react";

export default function GlobalError({
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
    <html>
      <body style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        minHeight: "100vh",
        gap: "1.5rem",
        textAlign: "center",
        padding: "2rem",
        fontFamily: "system-ui, sans-serif",
        background: "#fdfdfd",
        color: "#0f172a",
      }}>
        <h1 style={{ fontSize: "2rem", fontWeight: 700 }}>Critical Error</h1>
        <p style={{ color: "#64748b", maxWidth: "400px" }}>
          The application encountered a fatal error. Please refresh the page.
        </p>
        {error.digest && (
          <p style={{ fontSize: "0.75rem", color: "#94a3b8", fontFamily: "monospace" }}>
            Error ID: {error.digest}
          </p>
        )}
        <button
          onClick={reset}
          style={{
            background: "#7c3aed",
            color: "white",
            border: "none",
            padding: "12px 24px",
            borderRadius: "8px",
            fontSize: "1rem",
            cursor: "pointer",
            fontWeight: 600,
          }}
        >
          Reload Page
        </button>
      </body>
    </html>
  );
}
