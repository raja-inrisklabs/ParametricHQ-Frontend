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
          padding: "16px 24px 24px",
        }}
      >
        <DataFetchForm />
      </main>
    </>
  );
}
