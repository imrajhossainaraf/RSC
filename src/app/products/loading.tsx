export default function ProductsLoading() {
  return (
    <div style={{ padding: "2rem 0" }}>
      <div style={{
        height: 32,
        width: 200,
        background: "linear-gradient(90deg, #f1f5f9 25%, #e2e8f0 50%, #f1f5f9 75%)",
        backgroundSize: "200% 100%",
        animation: "shimmer 1.5s infinite",
        borderRadius: 8,
        marginBottom: "2rem",
      }} />
      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))",
        gap: "1.5rem",
      }}>
        {Array.from({ length: 12 }).map((_, i) => (
          <div key={i} style={{
            borderRadius: 12,
            overflow: "hidden",
            border: "1px solid rgba(0,0,0,0.06)",
          }}>
            <div style={{
              height: 200,
              background: "linear-gradient(90deg, #f1f5f9 25%, #e2e8f0 50%, #f1f5f9 75%)",
              backgroundSize: "200% 100%",
              animation: "shimmer 1.5s infinite",
            }} />
            <div style={{ padding: "1rem", display: "flex", flexDirection: "column", gap: 8 }}>
              <div style={{ height: 16, width: "80%", background: "#f1f5f9", borderRadius: 4, animation: "shimmer 1.5s infinite" }} />
              <div style={{ height: 14, width: "50%", background: "#f1f5f9", borderRadius: 4, animation: "shimmer 1.5s infinite" }} />
            </div>
          </div>
        ))}
      </div>
      <style>{`@keyframes shimmer { 0%{background-position:200% 0} 100%{background-position:-200% 0} }`}</style>
    </div>
  );
}
