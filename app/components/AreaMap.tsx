"use client";

import { useEffect } from "react";
import { MapContainer, Rectangle, TileLayer, useMap } from "react-leaflet";

const EMPTY_CENTER: [number, number] = [20, 0];
const EMPTY_ZOOM = 2;

type AreaBounds = [[number, number], [number, number]];

function SyncView({ bounds }: { bounds: AreaBounds | null }) {
  const map = useMap();
  useEffect(() => {
    if (bounds) {
      map.fitBounds(bounds, { padding: [16, 16], maxZoom: 8 });
      return;
    }
    map.setView(EMPTY_CENTER, EMPTY_ZOOM);
  }, [bounds, map]);
  return null;
}

export default function AreaMap({ bounds }: { bounds: AreaBounds | null }) {
  const tileKey = process.env.NEXT_PUBLIC_MAP_TILER;
  const tiles = tileKey
    ? `https://api.maptiler.com/maps/streets-v2/{z}/{x}/{y}.png?key=${tileKey}`
    : "https://tile.openstreetmap.org/{z}/{x}/{y}.png";
  const attribution = tileKey
    ? '&copy; <a href="https://www.maptiler.com/copyright/">MapTiler</a> &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
    : '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>';

  return (
    <MapContainer center={EMPTY_CENTER} zoom={EMPTY_ZOOM} scrollWheelZoom className="point-map">
      <TileLayer attribution={attribution} url={tiles} />
      {bounds && (
        <Rectangle bounds={bounds} pathOptions={{ color: "#2563eb", weight: 2, fillOpacity: 0.15 }} />
      )}
      <SyncView bounds={bounds} />
    </MapContainer>
  );
}
