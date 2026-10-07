"use client";

import { useEffect, useState } from "react";
import { card, label, input, select, primaryBtn, badge, sectionTitle, statBox } from "./styles";

type CatalogDataset = {
  id: string;
  provider_id: string;
  name: string;
  description: string;
  frequency: string;
  resolution?: string;
  variable_count: number;
};

type CatalogVariable = {
  name: string;
  label: string;
  unit: string;
};

type ApiResponse = {
  status: string;
  job_id?: string;
  download_url?: string;
  cached?: boolean;
  data_key?: string;
  detail?: string;
  record_count?: number;
  file_size_bytes?: number;
  parameters?: string[];
};

const DEFAULT_AREA = { north: "20", west: "10", south: "10", east: "20" };
const DEFAULT_POINT = { latitude: "23.0225", longitude: "72.5714" };

const FALLBACK_DATASETS: CatalogDataset[] = [
  {
    id: "reanalysis-era5-land",
    provider_id: "era5",
    name: "ERA5-Land",
    description: "ERA5-Land hourly reanalysis. Native 0.1 degree land grid, all catalog variables for one day.",
    frequency: "hourly",
    resolution: "0.1deg",
    variable_count: 50,
  },
  {
    id: "reanalysis-era5-single-levels",
    provider_id: "era5",
    name: "ERA5 single levels",
    description: "ERA5 hourly reanalysis on single levels. Native 0.25 degree grid, all catalog variables for one day.",
    frequency: "hourly",
    resolution: "0.25deg",
    variable_count: 232,
  },
];

export default function DataFetchForm() {
  const [datasets, setDatasets] = useState<CatalogDataset[]>(FALLBACK_DATASETS);
  const [datasetId, setDatasetId] = useState(FALLBACK_DATASETS[0].id);
  const [startDate, setStartDate] = useState("2024-02-01");
  const [endDate, setEndDate] = useState("2024-02-01");
  const [variables, setVariables] = useState<CatalogVariable[]>([]);
  const [selectedVariables, setSelectedVariables] = useState<string[]>([]);
  const [north, setNorth] = useState(DEFAULT_AREA.north);
  const [west, setWest] = useState(DEFAULT_AREA.west);
  const [south, setSouth] = useState(DEFAULT_AREA.south);
  const [east, setEast] = useState(DEFAULT_AREA.east);
  const [locationMode, setLocationMode] = useState<"area" | "point">("area");
  const [latitude, setLatitude] = useState(DEFAULT_POINT.latitude);
  const [longitude, setLongitude] = useState(DEFAULT_POINT.longitude);
  const [loading, setLoading] = useState(false);
  const [jobStatus, setJobStatus] = useState<string | null>(null);
  const [result, setResult] = useState<ApiResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [preview, setPreview] = useState<Record<string, unknown>[] | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);

  const selected = datasets.find((item) => item.id === datasetId) ?? datasets[0];

  useEffect(() => {
    fetch("/api/v1/datasets/catalog")
      .then((res) => (res.ok ? res.json() : Promise.reject()))
      .then((rows: CatalogDataset[]) => {
        if (rows.length > 0) {
          setDatasets(rows);
          setDatasetId(rows[0].id);
        }
      })
      .catch(() => undefined);
  }, []);

  useEffect(() => {
    fetch(`/api/v1/datasets/catalog/${datasetId}/variables`)
      .then((res) => (res.ok ? res.json() : Promise.reject()))
      .then((rows: CatalogVariable[]) => {
        setVariables(rows);
        setSelectedVariables(rows.slice(0, 2).map((item) => item.name));
      })
      .catch(() => undefined);
  }, [datasetId]);

  function locationError(): string | null {
    if (locationMode === "point") {
      const lat = Number(latitude);
      const lon = Number(longitude);
      if (Number.isNaN(lat) || Number.isNaN(lon)) return "Latitude and longitude must be numbers.";
      if (lat < -90 || lat > 90) return "Latitude is -90 to 90.";
      if (lon < -180 || lon > 180) return "Longitude is -180 to 180.";
      return null;
    }
    const n = Number(north);
    const w = Number(west);
    const s = Number(south);
    const e = Number(east);
    if ([n, w, s, e].some((value) => Number.isNaN(value))) {
      return "North, west, south, and east must be numbers.";
    }
    if (n <= s) return "North must be greater than south.";
    if (w >= e) return "West must be less than east.";
    if (n > 90 || s < -90 || w < -180 || e > 180) return "Latitude is -90 to 90. Longitude is -180 to 180.";
    return null;
  }

  function errorText(body: ApiResponse, fallback: string): string {
    const detail = body.detail as unknown;
    if (typeof detail === "string" && detail) return detail;
    if (Array.isArray(detail)) {
      return detail
        .map((item) => (item && typeof item === "object" && "msg" in item ? String(item.msg) : String(item)))
        .join(" ");
    }
    return fallback;
  }

  function toggleVariable(name: string) {
    setSelectedVariables((current) =>
      current.includes(name) ? current.filter((item) => item !== name) : [...current, name]
    );
  }

  async function handleSubmit() {
    if (!startDate || !endDate) {
      setError("Select a start date and an end date.");
      return;
    }
    if (endDate < startDate) {
      setError("End date must be on or after the start date.");
      return;
    }
    if (selectedVariables.length === 0) {
      setError("Select at least one variable.");
      return;
    }
    const boundsError = locationError();
    if (boundsError) {
      setError(boundsError);
      return;
    }
    setLoading(true);
    setJobStatus(null);
    setError(null);
    setResult(null);
    setPreview(null);

    try {
      const res = await fetch("/api/v1/datasets/request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          provider_id: selected?.provider_id || "era5",
          dataset_id: datasetId,
          location: locationMode === "point" ? `${latitude},${longitude}` : `n${north}_w${west}_s${south}_e${east}`,
          start_date: startDate,
          end_date: endDate,
          parameters: selectedVariables,
          temporal_resolution: "hourly",
          ...(locationMode === "point"
            ? { latitude: Number(latitude), longitude: Number(longitude) }
            : {
                north: Number(north),
                west: Number(west),
                south: Number(south),
                east: Number(east),
              }),
        }),
      });
      const body: ApiResponse = await res.json().catch(() => ({ status: "failed", detail: res.statusText }));
      if (!res.ok && res.status !== 202) {
        setError(errorText(body, `Request failed (${res.status}). Is the API running on port 8000?`));
        setResult(body);
        return;
      }
      if ((res.status === 202 || body.status === "accepted" || body.status === "running") && body.job_id) {
        const finished = await pollJob(body.job_id, body);
        setResult(finished);
        if (finished.status === "failed") {
          setError(errorText(finished, "CDS fetch failed."));
        }
        return;
      }
      setResult(body);
      if (body.status === "failed") {
        setError(errorText(body, "CDS fetch failed."));
      }
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Network error — is the backend running?");
    } finally {
      setLoading(false);
      setJobStatus(null);
    }
  }

  async function pollJob(jobId: string, initial: ApiResponse): Promise<ApiResponse> {
    let latest = initial;
    setJobStatus(initial.status || "accepted");
    for (let i = 0; i < 180; i++) {
      await new Promise((r) => setTimeout(r, 3000));
      const res = await fetch(`/api/v1/datasets/jobs/${jobId}`);
      const body: ApiResponse = await res.json().catch(() => ({
        status: "running",
        job_id: jobId,
        detail: "Still waiting for the backend.",
      }));
      latest = body;
      setJobStatus(body.status || "running");
      setResult(body);
      if (body.status === "ready" || body.status === "failed") return body;
      if (!res.ok && res.status !== 202) {
        return { ...body, status: "failed", detail: body.detail || `Status check failed (${res.status}).` };
      }
    }
    return {
      ...latest,
      status: "running",
      detail: "CDS is still running. Check again in a moment.",
    };
  }

  async function loadPreview(dataKey: string) {
    setPreviewLoading(true);
    try {
      const res = await fetch(`/api/v1/datasets/${dataKey}/data?limit=8`);
      const body = await res.json();
      setPreview(body.sample_records || []);
    } catch {
      setPreview(null);
    } finally {
      setPreviewLoading(false);
    }
  }

  return (
    <div className="fetch-layout">
      <div>
        <div className="fetch-top">
          <div style={card}>
            <div style={sectionTitle}>Dataset</div>
            <div style={label}>
              <span>Dataset</span>
              <select value={datasetId} onChange={(e) => setDatasetId(e.target.value)} style={select}>
                {datasets.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.name}
                  </option>
                ))}
              </select>
            </div>
            {selected && (
              <p style={{ margin: "12px 0 0", fontSize: 13, color: "#64748b", lineHeight: 1.5 }}>
                {selected.description} {selected.variable_count} hourly variables
                {selected.resolution ? `, ${selected.resolution}` : ""}, 24 hours, stored as Parquet.
              </p>
            )}
          </div>

          <div style={card}>
            <div style={sectionTitle}>Location</div>
            <div style={{ display: "flex", gap: 16, marginBottom: 12, fontSize: 13, color: "#334155" }}>
              <label style={{ display: "flex", alignItems: "center", gap: 6, cursor: "pointer" }}>
                <input
                  type="radio"
                  name="location-mode"
                  checked={locationMode === "area"}
                  onChange={() => setLocationMode("area")}
                />
                Area
              </label>
              <label style={{ display: "flex", alignItems: "center", gap: 6, cursor: "pointer" }}>
                <input
                  type="radio"
                  name="location-mode"
                  checked={locationMode === "point"}
                  onChange={() => setLocationMode("point")}
                />
                Latitude / longitude
              </label>
            </div>
            {locationMode === "area" ? (
              <>
              <p style={{ margin: "0 0 10px", fontSize: 12, color: "#64748b" }}>
                {Number.isNaN(Number(north) - Number(south)) || Number.isNaN(Number(east) - Number(west))
                  ? "Enter north, south, east, and west."
                  : `Box: ${(Number(north) - Number(south)).toFixed(1)}° north–south by ${(Number(east) - Number(west)).toFixed(1)}° east–west.`}
              </p>
              <div className="area-row">
                <div style={label}>
                  <span>North</span>
                  <input type="number" step="0.1" value={north} onChange={(e) => setNorth(e.target.value)} style={input} />
                </div>
                <div style={label}>
                  <span>South</span>
                  <input type="number" step="0.1" value={south} onChange={(e) => setSouth(e.target.value)} style={input} />
                </div>
                <div style={label}>
                  <span>East</span>
                  <input type="number" step="0.1" value={east} onChange={(e) => setEast(e.target.value)} style={input} />
                </div>
                <div style={label}>
                  <span>West</span>
                  <input type="number" step="0.1" value={west} onChange={(e) => setWest(e.target.value)} style={input} />
                </div>
              </div>
              </>
            ) : (
              <>
                <p style={{ margin: "0 0 12px", fontSize: 12, color: "#64748b", lineHeight: 1.5 }}>
                  {selected?.name || "The dataset"} snaps this to the nearest {selected?.resolution === "0.25deg" ? "0.25" : "0.1"} degree cell. A stored box that already contains that cell is reused.
                </p>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                  <div style={label}>
                    <span>Latitude</span>
                    <input type="number" step="0.0001" value={latitude} onChange={(e) => setLatitude(e.target.value)} style={input} />
                  </div>
                  <div style={label}>
                    <span>Longitude</span>
                    <input type="number" step="0.0001" value={longitude} onChange={(e) => setLongitude(e.target.value)} style={input} />
                  </div>
                </div>
              </>
            )}
          </div>
        </div>

        <div style={{ ...card, marginTop: 16 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12 }}>
            <div style={sectionTitle}>Variables</div>
            <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
              <button type="button" onClick={() => setSelectedVariables(variables.map((item) => item.name))} style={{ border: "1px solid #e2e8f0", background: "#fff", borderRadius: 6, padding: "4px 8px", cursor: "pointer" }}>
                All
              </button>
              <button type="button" onClick={() => setSelectedVariables([])} style={{ border: "1px solid #e2e8f0", background: "#fff", borderRadius: 6, padding: "4px 8px", cursor: "pointer" }}>
                Clear
              </button>
            </div>
          </div>
          <p style={{ margin: "0 0 10px", fontSize: 12, color: "#64748b" }}>
            {selectedVariables.length} selected. A range longer than 31 days can include at most 5 variables.
          </p>
          <div className="variable-panel">
            {variables.map((item) => (
              <label key={item.name}>
                <input
                  type="checkbox"
                  checked={selectedVariables.includes(item.name)}
                  onChange={() => toggleVariable(item.name)}
                />
                <span>{item.label}{item.unit ? ` (${item.unit})` : ""}</span>
              </label>
            ))}
          </div>
        </div>

        <div className="fetch-actions">
          <div style={card}>
            <div style={sectionTitle}>Time period</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <div style={label}>
                <span>Start</span>
                <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} style={input} />
              </div>
              <div style={label}>
                <span>End</span>
                <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} style={input} />
              </div>
            </div>
          </div>

          <div style={{ ...card, display: "flex", flexDirection: "column", justifyContent: "flex-end", gap: 12 }}>
            <div style={sectionTitle}>Fetch</div>
            {error && (
              <div
                style={{
                  padding: "12px 16px",
                  background: "#fef2f2",
                  border: "1px solid #fecaca",
                  borderRadius: 8,
                  fontSize: 13,
                  color: "#dc2626",
                  fontWeight: 500,
                }}
              >
                {error}
              </div>
            )}
            <button
              onClick={handleSubmit}
              disabled={loading || !startDate || !endDate || selectedVariables.length === 0}
              className="fetch-button"
              style={{
                ...primaryBtn,
                opacity: loading || !startDate || !endDate || selectedVariables.length === 0 ? 0.6 : 1,
                cursor: loading || !startDate || !endDate || selectedVariables.length === 0 ? "not-allowed" : "pointer",
              }}
            >
              {loading
                ? jobStatus === "running"
                  ? "CDS running…"
                  : "Fetching one day…"
                : "Fetch hourly day"}
            </button>
          </div>
        </div>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        {!result && !loading && (
          <div
            style={{
              ...card,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              minHeight: 280,
              gap: 12,
              background: "#f8fafc",
              border: "2px dashed #e2e8f0",
            }}
          >
            <div style={{ fontWeight: 600, fontSize: 16, color: "#0f172a" }}>Ready to fetch</div>
            <div style={{ fontSize: 14, color: "#94a3b8", maxWidth: 320, textAlign: "center", lineHeight: 1.6 }}>
              Choose the dataset, the area box, and one date, then fetch.
            </div>
          </div>
        )}

        {loading && (
          <div style={{ ...card, minHeight: 200 }}>
            <div style={{ fontWeight: 600, color: "#0f172a", marginBottom: 6 }}>
              {jobStatus === "running" ? "CDS request is running" : "Request accepted"}
            </div>
            <div style={{ fontSize: 13, color: "#64748b" }}>
              {selected?.name} · {startDate} to {endDate} · {selectedVariables.length} variables
            </div>
          </div>
        )}

        {result && !loading && (
          <>
            <div style={card}>
              <div style={{ display: "flex", gap: 8, marginBottom: 8 }}>
                <span style={badge(result.status === "ready" ? "green" : "red")}>{result.status}</span>
                {result.cached !== undefined && (
                  <span style={badge(result.cached ? "blue" : "green")}>
                    {result.cached ? "Already stored" : "Stored now"}
                  </span>
                )}
              </div>
              <div style={{ fontSize: 13, color: "#475569" }}>{errorText(result, "")}</div>
              {result.record_count !== undefined && (
                <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10, marginTop: 16 }}>
                  <div style={statBox}>
                    <div style={{ fontSize: 11, color: "#94a3b8" }}>Records</div>
                    <div style={{ fontSize: 20, fontWeight: 700 }}>{result.record_count.toLocaleString()}</div>
                  </div>
                  <div style={statBox}>
                    <div style={{ fontSize: 11, color: "#94a3b8" }}>File</div>
                    <div style={{ fontSize: 20, fontWeight: 700 }}>
                      {((result.file_size_bytes || 0) / 1024).toFixed(1)} KB
                    </div>
                  </div>
                  <div style={statBox}>
                    <div style={{ fontSize: 11, color: "#94a3b8" }}>Variables</div>
                    <div style={{ fontSize: 20, fontWeight: 700 }}>{result.parameters?.length ?? 0}</div>
                  </div>
                </div>
              )}
            </div>

            {result.download_url && result.data_key && (
              <div style={card}>
                <div style={sectionTitle}>Stored file</div>
                <code
                  style={{
                    display: "block",
                    padding: "10px 14px",
                    background: "#0f172a",
                    color: "#7dd3fc",
                    borderRadius: 8,
                    fontSize: 12,
                    wordBreak: "break-all",
                    marginBottom: 12,
                  }}
                >
                  {result.data_key}
                </code>
                <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                  <a href={result.download_url} style={{ color: "#1d4ed8", fontWeight: 600, fontSize: 13 }}>
                    Download Parquet
                  </a>
                  <button
                    onClick={() => result.data_key && loadPreview(result.data_key)}
                    disabled={previewLoading}
                    style={{ border: "none", background: "none", color: "#7c3aed", fontWeight: 600, cursor: "pointer" }}
                  >
                    {previewLoading ? "Loading…" : "Preview rows"}
                  </button>
                </div>
              </div>
            )}

            {preview && preview.length > 0 && (
              <div style={{ ...card, overflowX: "auto" }}>
                <div style={sectionTitle}>Preview</div>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
                  <thead>
                    <tr>
                      {Object.keys(preview[0]).map((col) => (
                        <th key={col} style={{ textAlign: "left", padding: "8px 10px", borderBottom: "1px solid #e2e8f0" }}>
                          {col}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {preview.map((row, i) => (
                      <tr key={i}>
                        {Object.values(row).map((value, j) => (
                          <td key={j} style={{ padding: "8px 10px", borderBottom: "1px solid #f1f5f9", whiteSpace: "nowrap" }}>
                            {typeof value === "number" ? value.toFixed(4) : String(value ?? "—")}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
