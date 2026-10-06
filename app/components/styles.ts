import { CSSProperties } from "react";

// ── Consistent shared style tokens ─────────────────────────────────────────

export const card: CSSProperties = {
  background: "#ffffff",
  border: "1px solid #e2e8f0",
  borderRadius: 12,
  padding: 24,
  boxShadow: "0 1px 4px rgba(0,0,0,0.05)",
};

export const label: CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: 6,
  fontSize: 13,
  fontWeight: 500,
  color: "#475569",
};

export const input: CSSProperties = {
  padding: "10px 12px",
  border: "1px solid #e2e8f0",
  borderRadius: 8,
  fontSize: 14,
  color: "#0f172a",
  background: "#f8fafc",
  outline: "none",
  fontFamily: "inherit",
  transition: "border-color 0.15s",
  width: "100%",
  boxSizing: "border-box",
};

export const select: CSSProperties = {
  ...input,
  cursor: "pointer",
  appearance: "none",
  backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%2394a3b8' stroke-width='2'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E")`,
  backgroundRepeat: "no-repeat",
  backgroundPosition: "right 10px center",
  paddingRight: 36,
};

export const primaryBtn: CSSProperties = {
  padding: "11px 24px",
  background: "linear-gradient(135deg, #2563eb, #4f46e5)",
  color: "#fff",
  border: "none",
  borderRadius: 8,
  fontSize: 14,
  fontWeight: 600,
  cursor: "pointer",
  fontFamily: "inherit",
  letterSpacing: "0.01em",
  boxShadow: "0 2px 8px rgba(37,99,235,0.25)",
  transition: "opacity 0.15s, transform 0.1s",
  width: "100%",
};

export const badge = (color: string): CSSProperties => ({
  display: "inline-flex",
  alignItems: "center",
  gap: 5,
  padding: "3px 10px",
  borderRadius: 20,
  fontSize: 12,
  fontWeight: 600,
  background: color === "green"
    ? "#f0fdf4"
    : color === "yellow"
    ? "#fffbeb"
    : color === "red"
    ? "#fef2f2"
    : color === "blue"
    ? "#eff6ff"
    : "#f8fafc",
  color: color === "green"
    ? "#15803d"
    : color === "yellow"
    ? "#92400e"
    : color === "red"
    ? "#dc2626"
    : color === "blue"
    ? "#1d4ed8"
    : "#475569",
  border: `1px solid ${color === "green"
    ? "#bbf7d0"
    : color === "yellow"
    ? "#fde68a"
    : color === "red"
    ? "#fecaca"
    : color === "blue"
    ? "#bfdbfe"
    : "#e2e8f0"}`,
});

export const sectionTitle: CSSProperties = {
  fontSize: 13,
  fontWeight: 600,
  color: "#94a3b8",
  textTransform: "uppercase",
  letterSpacing: "0.07em",
  marginBottom: 12,
};

export const statBox: CSSProperties = {
  background: "#f8fafc",
  border: "1px solid #e2e8f0",
  borderRadius: 8,
  padding: "12px 16px",
  display: "flex",
  flexDirection: "column",
  gap: 2,
};
