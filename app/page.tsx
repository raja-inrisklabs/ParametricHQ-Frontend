"use client";

import Navbar from "./components/Navbar";
import DataFetchForm from "./components/DataFetchForm";

export default function Home() {
  return (
    <>
      <Navbar />
      <main
        style={{
          maxWidth: 1200,
          margin: "0 auto",
          padding: "40px 24px 80px",
        }}
      >
        {/* Hero Section */}
        <div style={{ marginBottom: 40 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
            <span
              style={{
                fontSize: 11,
                fontWeight: 600,
                color: "#2563eb",
                background: "#eff6ff",
                border: "1px solid #bfdbfe",
                borderRadius: 20,
                padding: "3px 10px",
                textTransform: "uppercase",
                letterSpacing: "0.06em",
              }}
            >
              ERA5-Land
            </span>
            <span
              style={{
                fontSize: 11,
                fontWeight: 600,
                color: "#0f766e",
                background: "#f0fdfa",
                border: "1px solid #99f6e4",
                borderRadius: 20,
                padding: "3px 10px",
                textTransform: "uppercase",
                letterSpacing: "0.06em",
              }}
            >
              ERA5 single levels
            </span>
            <span
              style={{
                fontSize: 11,
                fontWeight: 600,
                color: "#7c3aed",
                background: "#f5f3ff",
                border: "1px solid #ddd6fe",
                borderRadius: 20,
                padding: "3px 10px",
                textTransform: "uppercase",
                letterSpacing: "0.06em",
              }}
            >
              ECMWF Reanalysis
            </span>
          </div>
          <h1
            style={{
              fontSize: 32,
              fontWeight: 700,
              color: "#0f172a",
              margin: "0 0 10px 0",
              lineHeight: 1.25,
            }}
          >
            Fetch hourly ERA5 data
          </h1>
          <p style={{ fontSize: 15, color: "#64748b", margin: 0, maxWidth: 640, lineHeight: 1.6 }}>
            Choose ERA5-Land or ERA5 single levels, then a box or a point, the variables, and the dates.
            Each dataset keeps its own variables and its own stored file.
          </p>
        </div>

        {/* Main form */}
        <DataFetchForm />
      </main>
    </>
  );
}
