"use client";

import { useEffect, useState } from "react";
import { card, sectionTitle } from "./styles";

type StoredDataset = {
  data_key: string;
  dataset_name?: string;
  start_date?: string;
  end_date?: string;
  record_count?: number;
  file_size_bytes?: number;
  parameters?: string[];
  month_objects?: { year: string; month: string; record_count?: number }[];
  download_url?: string;
};

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

function downloadHref(item: StoredDataset): string {
  const path = item.download_url || `/api/v1/datasets/${item.data_key}/download`;
  if (path.startsWith("http")) return path;
  return `${API_BASE}${path}`;
}

export default function StoredDatasets() {
  const [items, setItems] = useState<StoredDataset[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch(`${API_BASE}/api/v1/datasets`)
      .then(async (res) => {
        if (!res.ok) throw new Error(`Stored files could not be loaded (${res.status}).`);
        return res.json();
      })
      .then((body: StoredDataset[]) => setItems(body))
      .catch((err: unknown) => setError(err instanceof Error ? err.message : "Stored files could not be loaded."));
  }, []);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      <div style={sectionTitle}>Stored files</div>
      {error && <div style={{ ...card, color: "#b45309" }}>{error}</div>}
      {!error && items.length === 0 && (
        <div style={{ ...card, color: "#64748b", fontSize: 14 }}>No stored files yet.</div>
      )}
      {items.map((item) => {
        const months = item.month_objects?.length || 1;
        return (
          <div key={item.data_key} style={card}>
            <div style={{ display: "flex", justifyContent: "space-between", gap: 16, alignItems: "flex-start" }}>
              <div>
                <div style={{ fontWeight: 650, color: "#0f172a" }}>{item.dataset_name || "Dataset"}</div>
                <div style={{ marginTop: 4, fontSize: 13, color: "#64748b" }}>
                  {item.start_date} to {item.end_date} · {(item.record_count || 0).toLocaleString()} records · {months} month file{months === 1 ? "" : "s"}
                </div>
                <div style={{ marginTop: 6, fontSize: 12, color: "#94a3b8" }}>
                  {(item.parameters || []).join(", ")}
                </div>
              </div>
              <a
                href={downloadHref(item)}
                style={{
                  flexShrink: 0,
                  background: "#1d4ed8",
                  color: "#fff",
                  borderRadius: 8,
                  padding: "8px 12px",
                  fontSize: 13,
                  fontWeight: 600,
                  textDecoration: "none",
                }}
              >
                Download
              </a>
            </div>
          </div>
        );
      })}
    </div>
  );
}
