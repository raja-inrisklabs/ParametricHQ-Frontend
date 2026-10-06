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
              ERA5 & ERA5-Land
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
            Climate Data Explorer
          </h1>
          <p style={{ fontSize: 15, color: "#64748b", margin: 0, maxWidth: 600, lineHeight: 1.6 }}>
            Request ERA5-Land data from Copernicus CDS through the backend.
            Choose variables, a location, and a date range, then fetch the dataset.
          </p>
        </div>

        {/* Main form */}
        <DataFetchForm />
      </main>
    </>
  );
}
