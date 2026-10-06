"use client";

import { useState } from "react";
import { card, label, input, select, primaryBtn, badge, sectionTitle, statBox } from "./styles";

// ── ERA5 parameter catalog ─────────────────────────────────────────────────

const PARAMETER_GROUPS = [
  {
    group: "Hydrology & Precipitation",
    params: [
      { value: "total_precipitation", label: "Total Precipitation", unit: "mm" },
      { value: "total_evaporation", label: "Total Evaporation", unit: "mm" },
      { value: "potential_evaporation", label: "Potential Evaporation", unit: "mm" },
      { value: "surface_runoff", label: "Surface Runoff", unit: "mm" },
      { value: "sub_surface_runoff", label: "Sub-surface Runoff", unit: "mm" },
    ],
  },
  {
    group: "Temperature",
    params: [
      { value: "2m_temperature", label: "2m Air Temperature", unit: "°C" },
      { value: "2m_dewpoint_temperature", label: "2m Dewpoint Temperature", unit: "°C" },
      { value: "skin_temperature", label: "Skin Temperature", unit: "°C" },
    ],
  },
  {
    group: "Soil Moisture",
    params: [
      { value: "volumetric_soil_water_layer_1", label: "Soil Moisture Layer 1 (0–7 cm)", unit: "m³/m³" },
      { value: "volumetric_soil_water_layer_2", label: "Soil Moisture Layer 2 (7–28 cm)", unit: "m³/m³" },
      { value: "volumetric_soil_water_layer_3", label: "Soil Moisture Layer 3 (28–100 cm)", unit: "m³/m³" },
      { value: "volumetric_soil_water_layer_4", label: "Soil Moisture Layer 4 (100–289 cm)", unit: "m³/m³" },
    ],
  },
  {
    group: "Soil Temperature",
    params: [
      { value: "soil_temperature_level_1", label: "Soil Temperature Level 1 (0–7 cm)", unit: "°C" },
      { value: "soil_temperature_level_2", label: "Soil Temperature Level 2 (7–28 cm)", unit: "°C" },
    ],
  },
  {
    group: "Wind",
    params: [
      { value: "10m_wind_speed", label: "10m Wind Speed", unit: "m/s" },
      { value: "10m_u_component_of_wind", label: "10m Wind U-Component (Eastward)", unit: "m/s" },
      { value: "10m_v_component_of_wind", label: "10m Wind V-Component (Northward)", unit: "m/s" },
    ],
  },
  {
    group: "Radiation",
    params: [
      { value: "surface_solar_radiation_downwards", label: "Solar Radiation Downwards", unit: "MJ/m²" },
      { value: "surface_thermal_radiation_downwards", label: "Thermal Radiation Downwards", unit: "MJ/m²" },
    ],
  },
  {
    group: "Vegetation & Snow",
    params: [
      { value: "leaf_area_index_low_vegetation", label: "Leaf Area Index (Low Vegetation)", unit: "m²/m²" },
      { value: "snow_depth", label: "Snow Depth", unit: "m" },
    ],
  },
];

const PRESET_LOCATIONS = [
  { value: "gujarat/ahmedabad", label: "Ahmedabad, Gujarat (23.02°N, 72.57°E)" },
  { value: "maharashtra/mumbai", label: "Mumbai, Maharashtra (19.08°N, 72.88°E)" },
  { value: "maharashtra/pune", label: "Pune, Maharashtra (18.52°N, 73.86°E)" },
  { value: "punjab/ludhiana", label: "Ludhiana, Punjab (30.90°N, 75.86°E)" },
  { value: "delhi", label: "Delhi (28.61°N, 77.21°E)" },
  { value: "bengaluru", label: "Bengaluru (12.97°N, 77.59°E)" },
  { value: "kenya/nairobi", label: "Nairobi, Kenya (1.29°S, 36.82°E)" },
  { value: "us/iowa", label: "Iowa, USA (41.88°N, 93.10°W)" },
];

// ── Types ──────────────────────────────────────────────────────────────────

type VariableStat = { mean: number; min: number; max: number; sum: number };
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
  summary_stats?: {
    total_records?: number;
    start?: string;
    end?: string;
    mean?: number;
    min?: number;
    max?: number;
    sum?: number;
    unit?: string;
    variable_stats?: Record<string, VariableStat>;
  };
};

type DatasetRequestPayload = {
  provider_id: "era5";
  location: string;
  start_date: string;
  end_date: string;
  resolution: string;
  temporal_resolution: "hourly" | "daily";
  version: string;
  parameter_type?: string;
  parameters?: string[];
  latitude?: number;
  longitude?: number;
};

// ── Component ──────────────────────────────────────────────────────────────

export default function DataFetchForm() {
  const [providerId] = useState("era5");
  const [selectedParams, setSelectedParams] = useState<string[]>(["total_precipitation"]);
  const [location, setLocation] = useState("gujarat/ahmedabad");
  const [customLocation, setCustomLocation] = useState("");
  const [useCustomLocation, setUseCustomLocation] = useState(false);
  const [startDate, setStartDate] = useState("2024-06-01");
  const [endDate, setEndDate] = useState("2024-06-07");
  const [resolution, setResolution] = useState("0.1deg");
  const [temporalResolution, setTemporalResolution] = useState<"hourly" | "daily">("daily");
  const [version] = useState("v1");

  const [loading, setLoading] = useState(false);
  const [jobStatus, setJobStatus] = useState<string | null>(null);
  const [result, setResult] = useState<ApiResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [preview, setPreview] = useState<any[] | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);

  // Multi-select parameter toggle
  function toggleParam(value: string) {
    setSelectedParams((prev) =>
      prev.includes(value) ? prev.filter((p) => p !== value) : [...prev, value]
    );
  }

  const locationValue = useCustomLocation ? customLocation.trim() : location;

  async function handleSubmit() {
    if (selectedParams.length === 0) {
      setError("Select at least one parameter.");
      return;
    }
    if (!locationValue) {
      setError("Please provide a location.");
      return;
    }
    setLoading(true);
    setJobStatus(null);
    setError(null);
    setResult(null);
    setPreview(null);

    const payload: DatasetRequestPayload = {
      provider_id: "era5",
      location: locationValue,
      start_date: startDate,
      end_date: endDate,
      resolution,
      temporal_resolution: temporalResolution,
      version,
    };

    const coordMatch = locationValue.match(/^(-?\d+(?:\.\d+)?)\s*,\s*(-?\d+(?:\.\d+)?)$/);
    if (coordMatch) {
      payload.latitude = Number(coordMatch[1]);
      payload.longitude = Number(coordMatch[2]);
    }

    if (selectedParams.length === 1) {
      payload.parameter_type = selectedParams[0];
    } else {
      payload.parameters = selectedParams;
    }

    try {
      const res = await fetch("/api/datasets/request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const body: ApiResponse = await res.json().catch(() => ({ status: "failed", detail: res.statusText }));
      if (!res.ok && res.status !== 202) {
        setError(body.detail || `Request failed (${res.status}). Is the API running on port 8000?`);
        setResult(body);
        return;
      }

      // 202 accepted/running means CDS is still working. Poll the job, do not treat that as a failure.
      if ((res.status === 202 || body.status === "accepted" || body.status === "running") && body.job_id) {
        const finished = await pollJob(body.job_id, body);
        setResult(finished);
        if (finished.status === "failed") {
          setError(finished.detail || "CDS fetch failed.");
        }
        return;
      }

      setResult(body);
      if (body.status === "failed") {
        setError(body.detail || "CDS fetch failed.");
      }
    } catch (e: any) {
      setError(e.message || "Network error — is the backend running?");
    } finally {
      setLoading(false);
      setJobStatus(null);
    }
  }

  async function pollJob(jobId: string, initial: ApiResponse): Promise<ApiResponse> {
    let latest = initial;
    setJobStatus(initial.status || "accepted");
    // CDS retrievals can take several minutes. Keep polling while the job is accepted or running.
    for (let i = 0; i < 180; i++) {
      await new Promise((r) => setTimeout(r, 3000));
      const res = await fetch(`/api/datasets/jobs/${jobId}`);
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
      const res = await fetch(`/api/datasets/${dataKey}/data?limit=5`);
      const body = await res.json();
      setPreview(body.sample_records || []);
    } catch {
      setPreview(null);
    } finally {
      setPreviewLoading(false);
    }
  }

  const paramCount = selectedParams.length;
  const allParams = PARAMETER_GROUPS.flatMap((g) => g.params);

  return (
    <div style={{ display: "grid", gridTemplateColumns: "400px 1fr", gap: 24, alignItems: "start" }}>
      {/* ── LEFT: Form ────────────────────────────────────────────────── */}
      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>

        {/* Provider badge */}
        <div style={{ ...card, padding: 16, display: "flex", alignItems: "center", gap: 12 }}>
          <div
            style={{
              width: 40,
              height: 40,
              borderRadius: 10,
              background: "linear-gradient(135deg, #dbeafe, #ede9fe)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 20,
            }}
          >
            🌐
          </div>
          <div>
            <div style={{ fontWeight: 600, fontSize: 14, color: "#0f172a" }}>
              Copernicus ERA5-Land
            </div>
            <div style={{ fontSize: 12, color: "#64748b" }}>
              ECMWF · 0.1° (~9 km) · Hourly reanalysis
            </div>
          </div>
        </div>

        {/* Parameter Selection */}
        <div style={card}>
          <div style={sectionTitle}>
            Parameters
            <span
              style={{
                marginLeft: 8,
                padding: "2px 8px",
                background: "#eff6ff",
                color: "#2563eb",
                borderRadius: 20,
                fontSize: 11,
                fontWeight: 700,
                border: "1px solid #bfdbfe",
              }}
            >
              {paramCount} selected
            </span>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 6, maxHeight: 360, overflowY: "auto" }}>
            {PARAMETER_GROUPS.map((group) => (
              <div key={group.group}>
                <div
                  style={{
                    fontSize: 11,
                    fontWeight: 600,
                    color: "#94a3b8",
                    padding: "6px 0 3px",
                    textTransform: "uppercase",
                    letterSpacing: "0.06em",
                  }}
                >
                  {group.group}
                </div>
                {group.params.map((p) => {
                  const checked = selectedParams.includes(p.value);
                  return (
                    <label
                      key={p.value}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 9,
                        padding: "7px 10px",
                        borderRadius: 7,
                        cursor: "pointer",
                        background: checked ? "#eff6ff" : "transparent",
                        border: checked ? "1px solid #bfdbfe" : "1px solid transparent",
                        marginBottom: 2,
                        transition: "all 0.1s",
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => toggleParam(p.value)}
                        style={{ accentColor: "#2563eb", width: 14, height: 14, flexShrink: 0 }}
                      />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 13, fontWeight: checked ? 600 : 400, color: checked ? "#1d4ed8" : "#334155", lineHeight: 1.3 }}>
                          {p.label}
                        </div>
                      </div>
                      <span
                        style={{
                          fontSize: 11,
                          color: "#94a3b8",
                          background: "#f1f5f9",
                          borderRadius: 4,
                          padding: "1px 5px",
                          fontFamily: "monospace",
                          flexShrink: 0,
                        }}
                      >
                        {p.unit}
                      </span>
                    </label>
                  );
                })}
              </div>
            ))}
          </div>
        </div>

        {/* Location */}
        <div style={card}>
          <div style={sectionTitle}>Location</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <label style={{ ...label, flexDirection: "row", alignItems: "center", gap: 8, cursor: "pointer" }}>
              <input
                type="checkbox"
                checked={useCustomLocation}
                onChange={(e) => setUseCustomLocation(e.target.checked)}
                style={{ accentColor: "#2563eb", width: 14, height: 14 }}
              />
              <span style={{ fontSize: 13, color: "#475569" }}>Enter custom location</span>
            </label>

            {useCustomLocation ? (
              <div style={label}>
                <span>Location (name or lat,lon)</span>
                <input
                  value={customLocation}
                  onChange={(e) => setCustomLocation(e.target.value)}
                  placeholder="e.g. 23.02,72.57 or mumbai"
                  style={input}
                />
              </div>
            ) : (
              <div style={label}>
                <span>Preset Location</span>
                <select
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  style={select}
                >
                  {PRESET_LOCATIONS.map((l) => (
                    <option key={l.value} value={l.value}>
                      {l.label}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>
        </div>

        {/* Date Range */}
        <div style={card}>
          <div style={sectionTitle}>Date Range</div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <div style={label}>
              <span>Start Date</span>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                max={endDate}
                style={input}
              />
            </div>
            <div style={label}>
              <span>End Date</span>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                min={startDate}
                style={input}
              />
            </div>
          </div>
          {startDate && endDate && (
            <div style={{ marginTop: 10, fontSize: 12, color: "#64748b" }}>
              {Math.ceil((new Date(endDate).getTime() - new Date(startDate).getTime()) / 86400000) + 1} days selected
              {paramCount > 1 && ` · ${paramCount} parameters`}
            </div>
          )}
        </div>

        {/* Time step — sent as temporal_resolution on POST /api/datasets/request */}
        <div style={card}>
          <div style={sectionTitle}>CDS Time Step</div>
          <div style={{ display: "flex", gap: 8 }}>
            {[
              { value: "daily" as const, label: "Daily", sub: "1 value / day" },
              { value: "hourly" as const, label: "Hourly", sub: "24 values / day" },
            ].map((step) => (
              <label
                key={step.value}
                style={{
                  flex: 1,
                  padding: "10px 14px",
                  border: temporalResolution === step.value ? "1.5px solid #2563eb" : "1.5px solid #e2e8f0",
                  borderRadius: 8,
                  cursor: "pointer",
                  background: temporalResolution === step.value ? "#eff6ff" : "#f8fafc",
                  display: "flex",
                  flexDirection: "column",
                  gap: 2,
                }}
              >
                <input
                  type="radio"
                  name="temporal_resolution"
                  value={step.value}
                  checked={temporalResolution === step.value}
                  onChange={() => setTemporalResolution(step.value)}
                  style={{ display: "none" }}
                />
                <span style={{ fontSize: 13, fontWeight: 600, color: temporalResolution === step.value ? "#1d4ed8" : "#0f172a" }}>
                  {step.label}
                </span>
                <span style={{ fontSize: 11, color: "#94a3b8" }}>{step.sub}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Resolution */}
        <div style={card}>
          <div style={sectionTitle}>Spatial Resolution</div>
          <div style={{ display: "flex", gap: 8 }}>
            {[
              { value: "0.1deg", label: "0.1° ERA5-Land", sub: "~9 km" },
              { value: "0.25deg", label: "0.25° ERA5", sub: "~31 km" },
            ].map((r) => (
              <label
                key={r.value}
                style={{
                  flex: 1,
                  padding: "10px 14px",
                  border: resolution === r.value ? "1.5px solid #2563eb" : "1.5px solid #e2e8f0",
                  borderRadius: 8,
                  cursor: "pointer",
                  background: resolution === r.value ? "#eff6ff" : "#f8fafc",
                  display: "flex",
                  flexDirection: "column",
                  gap: 2,
                }}
              >
                <input
                  type="radio"
                  name="resolution"
                  value={r.value}
                  checked={resolution === r.value}
                  onChange={() => setResolution(r.value)}
                  style={{ display: "none" }}
                />
                <span style={{ fontSize: 13, fontWeight: 600, color: resolution === r.value ? "#1d4ed8" : "#0f172a" }}>
                  {r.label}
                </span>
                <span style={{ fontSize: 11, color: "#94a3b8" }}>{r.sub}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Error */}
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
            ⚠ {error}
          </div>
        )}

        {/* Submit */}
        <button
          onClick={handleSubmit}
          disabled={loading || selectedParams.length === 0}
          style={{
            ...primaryBtn,
            opacity: loading || selectedParams.length === 0 ? 0.6 : 1,
            cursor: loading || selectedParams.length === 0 ? "not-allowed" : "pointer",
          }}
        >
          {loading ? (
            <span style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
              <span className="spinner-inline" />
              {jobStatus === "running" ? "CDS running…" : jobStatus === "accepted" ? "Request accepted…" : "Fetching from CDS…"}
            </span>
          ) : (
            `Fetch Dataset${paramCount > 1 ? ` (${paramCount} variables)` : ""}`
          )}
        </button>
      </div>

      {/* ── RIGHT: Results ─────────────────────────────────────────────── */}
      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        {!result && !loading && (
          <div
            style={{
              ...card,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              minHeight: 400,
              gap: 16,
              background: "linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)",
              border: "2px dashed #e2e8f0",
            }}
          >
            <div style={{ fontSize: 48 }}>🛰️</div>
            <div style={{ textAlign: "center" }}>
              <div style={{ fontWeight: 600, fontSize: 16, color: "#0f172a", marginBottom: 6 }}>
                Ready to fetch
              </div>
              <div style={{ fontSize: 14, color: "#94a3b8", maxWidth: 280, lineHeight: 1.6 }}>
                Select parameters, location and date range, then click
                <strong style={{ color: "#2563eb" }}> Fetch Dataset</strong>
              </div>
            </div>
          </div>
        )}

        {loading && (
          <div
            style={{
              ...card,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              minHeight: 400,
              gap: 20,
            }}
          >
            <div className="spinner-ring" />
            <div style={{ textAlign: "center" }}>
              <div style={{ fontWeight: 600, color: "#0f172a", marginBottom: 4 }}>
                {jobStatus === "accepted"
                  ? "Request accepted"
                  : jobStatus === "running"
                  ? "CDS request is running"
                  : "Requesting Copernicus CDS…"}
              </div>
              <div style={{ fontSize: 13, color: "#94a3b8" }}>
                {paramCount} variable{paramCount > 1 ? "s" : ""} · {locationValue}
              </div>
            </div>
          </div>
        )}

        {result && !loading && (
          <>
            {/* Status card */}
            <div style={card}>
              <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12 }}>
                <div style={{ flex: 1 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                    <span style={badge(result.status === "ready" ? "green" : result.status === "processing" ? "yellow" : "red")}>
                      <span
                        style={{
                          width: 6,
                          height: 6,
                          borderRadius: "50%",
                          background: result.status === "ready" ? "#22c55e" : result.status === "processing" ? "#f59e0b" : "#ef4444",
                          display: "inline-block",
                        }}
                      />
                      {result.status}
                    </span>
                    {result.cached !== undefined && (
                      <span style={badge(result.cached ? "blue" : "green")}>
                        {result.cached ? "📦 Cached" : "✨ Freshly fetched"}
                      </span>
                    )}
                  </div>
                  <div style={{ fontSize: 13, color: "#475569", lineHeight: 1.5 }}>
                    {result.detail}
                  </div>
                </div>
              </div>

              {/* Stats row */}
              {result.record_count !== undefined && (
                <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10, marginTop: 16 }}>
                  <div style={statBox}>
                    <div style={{ fontSize: 11, color: "#94a3b8", fontWeight: 500, textTransform: "uppercase", letterSpacing: "0.05em" }}>Records</div>
                    <div style={{ fontSize: 20, fontWeight: 700, color: "#0f172a" }}>
                      {result.record_count.toLocaleString()}
                    </div>
                  </div>
                  <div style={statBox}>
                    <div style={{ fontSize: 11, color: "#94a3b8", fontWeight: 500, textTransform: "uppercase", letterSpacing: "0.05em" }}>File Size</div>
                    <div style={{ fontSize: 20, fontWeight: 700, color: "#0f172a" }}>
                      {((result.file_size_bytes || 0) / 1024).toFixed(1)}{" "}
                      <span style={{ fontSize: 13, fontWeight: 400, color: "#64748b" }}>KB</span>
                    </div>
                  </div>
                  <div style={statBox}>
                    <div style={{ fontSize: 11, color: "#94a3b8", fontWeight: 500, textTransform: "uppercase", letterSpacing: "0.05em" }}>Variables</div>
                    <div style={{ fontSize: 20, fontWeight: 700, color: "#0f172a" }}>
                      {result.parameters?.length ?? 1}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Data key */}
            {result.data_key && (
              <div style={card}>
                <div style={sectionTitle}>Dataset Key</div>
                <code
                  style={{
                    display: "block",
                    padding: "10px 14px",
                    background: "#0f172a",
                    color: "#7dd3fc",
                    borderRadius: 8,
                    fontSize: 12,
                    fontFamily: "monospace",
                    wordBreak: "break-all",
                    lineHeight: 1.6,
                  }}
                >
                  {result.data_key}
                </code>

                {/* Summary stats */}
                {result.summary_stats?.variable_stats &&
                  Object.entries(result.summary_stats.variable_stats).length > 0 && (
                    <div style={{ marginTop: 16 }}>
                      <div style={sectionTitle}>Variable Summary</div>
                      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                        {Object.entries(result.summary_stats.variable_stats).map(([varName, stats]) => {
                          const paramLabel = allParams.find((p) => p.value === varName)?.label ?? varName;
                          const paramUnit = allParams.find((p) => p.value === varName)?.unit ?? "";
                          const s = stats as VariableStat;
                          return (
                            <div
                              key={varName}
                              style={{
                                padding: "12px 14px",
                                background: "#f8fafc",
                                border: "1px solid #e2e8f0",
                                borderRadius: 8,
                              }}
                            >
                              <div style={{ fontWeight: 600, fontSize: 13, color: "#1d4ed8", marginBottom: 6 }}>
                                {paramLabel}
                              </div>
                              <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 8 }}>
                                {[
                                  { label: "Mean", val: s.mean?.toFixed(3) },
                                  { label: "Min", val: s.min?.toFixed(3) },
                                  { label: "Max", val: s.max?.toFixed(3) },
                                  { label: "Sum", val: s.sum?.toFixed(2) },
                                ].map(({ label: l, val }) => (
                                  <div key={l}>
                                    <div style={{ fontSize: 10, color: "#94a3b8", textTransform: "uppercase", fontWeight: 600 }}>{l}</div>
                                    <div style={{ fontSize: 13, fontWeight: 700, color: "#0f172a" }}>
                                      {val ?? "—"}
                                      <span style={{ fontSize: 10, color: "#94a3b8", fontWeight: 400, marginLeft: 2 }}>{paramUnit}</span>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
              </div>
            )}

            {/* Actions */}
            {result.download_url && result.data_key && (
              <div style={card}>
                <div style={sectionTitle}>Actions</div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
                  <a
                    href={`/api${result.download_url}`}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 7,
                      padding: "9px 18px",
                      borderRadius: 8,
                      textDecoration: "none",
                      fontSize: 13,
                      fontWeight: 600,
                      color: "#1d4ed8",
                      background: "#eff6ff",
                      border: "1px solid #bfdbfe",
                    }}
                  >
                    ⬇ Download Parquet
                  </a>
                  <button
                    onClick={() => result.data_key && loadPreview(result.data_key)}
                    disabled={previewLoading}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 7,
                      padding: "9px 18px",
                      borderRadius: 8,
                      fontSize: 13,
                      fontWeight: 600,
                      color: "#7c3aed",
                      background: "#f5f3ff",
                      border: "1px solid #ddd6fe",
                      cursor: "pointer",
                      fontFamily: "inherit",
                      opacity: previewLoading ? 0.6 : 1,
                    }}
                  >
                    {previewLoading ? "◌ Loading…" : "◫ Preview Data"}
                  </button>
                  <a
                    href={`/api/datasets/${result.data_key}/analysis`}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 7,
                      padding: "9px 18px",
                      borderRadius: 8,
                      textDecoration: "none",
                      fontSize: 13,
                      fontWeight: 600,
                      color: "#0f172a",
                      background: "#f8fafc",
                      border: "1px solid #e2e8f0",
                    }}
                  >
                    📊 Full Analysis JSON
                  </a>
                </div>
              </div>
            )}

            {/* Data Preview Table */}
            {preview && preview.length > 0 && (
              <div style={{ ...card, overflow: "hidden" }}>
                <div style={sectionTitle}>
                  Data Preview <span style={{ color: "#94a3b8", fontWeight: 400, textTransform: "none", letterSpacing: 0 }}>— first 5 records</span>
                </div>
                <div style={{ overflowX: "auto" }}>
                  <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
                    <thead>
                      <tr>
                        {Object.keys(preview[0]).map((col) => (
                          <th
                            key={col}
                            style={{
                              padding: "8px 12px",
                              textAlign: "left",
                              fontWeight: 600,
                              fontSize: 11,
                              color: "#64748b",
                              textTransform: "uppercase",
                              letterSpacing: "0.05em",
                              borderBottom: "2px solid #e2e8f0",
                              background: "#f8fafc",
                              whiteSpace: "nowrap",
                            }}
                          >
                            {col}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {preview.map((row, i) => (
                        <tr key={i} style={{ background: i % 2 === 0 ? "#fff" : "#f8fafc" }}>
                          {Object.values(row).map((v: any, j) => (
                            <td
                              key={j}
                              style={{
                                padding: "8px 12px",
                                borderBottom: "1px solid #f1f5f9",
                                fontFamily: typeof v === "number" ? "monospace" : "inherit",
                                color: "#0f172a",
                                whiteSpace: "nowrap",
                              }}
                            >
                              {typeof v === "number" ? v.toFixed(4) : String(v ?? "—")}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
