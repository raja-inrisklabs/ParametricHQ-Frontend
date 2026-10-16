"use client";

import Navbar from "../components/Navbar";
import StoredDatasets from "../components/StoredDatasets";

export default function StoredPage() {
  return (
    <>
      <Navbar />
      <main style={{ maxWidth: 1200, margin: "0 auto", padding: "16px 24px 24px" }}>
        <StoredDatasets />
      </main>
    </>
  );
}
