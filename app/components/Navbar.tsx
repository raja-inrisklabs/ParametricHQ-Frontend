"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

export default function Navbar() {
  const pathname = usePathname();
  const [hoveredLink, setHoveredLink] = useState<string | null>(null);

  const navLinks = [
    { href: "/", label: "Fetch", icon: "⌂" },
  ];

  return (
    <nav
      style={{
        position: "sticky",
        top: 0,
        zIndex: 100,
        background: "rgba(255, 255, 255, 0.9)",
        backdropFilter: "blur(12px)",
        borderBottom: "1px solid #e2e8f0",
        boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
      }}
    >
      <div
        style={{
          maxWidth: 1200,
          margin: "0 auto",
          padding: "0 24px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          height: 64,
        }}
      >
        {/* Brand */}
        <Link href="/" style={{ textDecoration: "none", display: "flex", alignItems: "center", gap: 10 }}>
          <div
            style={{
              width: 34,
              height: 34,
              borderRadius: 9,
              background: "linear-gradient(135deg, #2563eb, #7c3aed)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 16,
            }}
          >
            🌍
          </div>
          <div>
            <div style={{ fontWeight: 700, fontSize: 15, color: "#0f172a", lineHeight: 1.2 }}>
              ParametricHQ
            </div>
            <div style={{ fontSize: 11, color: "#64748b", lineHeight: 1.2, fontWeight: 400 }}>
              ERA5 Climate Data
            </div>
          </div>
        </Link>

        {/* Nav Links */}
        <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
          {navLinks.map(({ href, label, icon }) => {
            const isActive = pathname === href;
            const isHovered = hoveredLink === href;
            return (
              <Link
                key={href}
                href={href}
                onMouseEnter={() => setHoveredLink(href)}
                onMouseLeave={() => setHoveredLink(null)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                  padding: "8px 16px",
                  borderRadius: 8,
                  textDecoration: "none",
                  fontSize: 14,
                  fontWeight: isActive ? 600 : 500,
                  color: isActive ? "#2563eb" : isHovered ? "#0f172a" : "#64748b",
                  background: isActive ? "#eff6ff" : isHovered ? "#f8fafc" : "transparent",
                  border: isActive ? "1px solid #bfdbfe" : "1px solid transparent",
                  transition: "all 0.15s ease",
                }}
              >
                <span style={{ fontSize: 16 }}>{icon}</span>
                {label}
              </Link>
            );
          })}

          {/* Status indicator */}
          <div
            style={{
              marginLeft: 12,
              display: "flex",
              alignItems: "center",
              gap: 6,
              padding: "6px 12px",
              borderRadius: 20,
              background: "#f0fdf4",
              border: "1px solid #bbf7d0",
              fontSize: 12,
              color: "#15803d",
              fontWeight: 500,
            }}
          >
            <span
              style={{
                width: 7,
                height: 7,
                borderRadius: "50%",
                background: "#22c55e",
                display: "inline-block",
                boxShadow: "0 0 0 2px rgba(34,197,94,0.2)",
              }}
            />
            API Live
          </div>
        </div>
      </div>
    </nav>
  );
}
