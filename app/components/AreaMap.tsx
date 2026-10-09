"use client";

import { useEffect } from "react";
import { MapContainer, Rectangle, TileLayer, useMap } from "react-leaflet";

function FitBox({ bounds }: { bounds: [[number, number], [number, number]] }) {
  const map = useMap();
  useEffect(() => {
    map.fitBounds(bounds, { padding: [16, 16], maxZoom: 8 });
  }, [bounds, map]);
  return null;
}

export default function AreaMap({
  north,
  south,
  east,
  west,
}: {
  north: number;
  south: number;
  east: number;
  west: number;
}) {
  const tileKey = process.env.NEXT_PUBLIC_MAP_TILER;
  const tiles = tileKey
    ? `https://api.maptiler.com/maps/streets-v2/{z}/{x}/{y}.png?key=${tileKey}`
    : "https://tile.openstreetmap.org/{z}/{x}/{y}.png";
  const attribution = tileKey
    ? '&copy; <a href="https://www.maptiler.com/copyright/">MapTiler</a> &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
    : '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>';
  const bounds: [[number, number], [number, number]] = [
    [south, west],
    [north, east],
  ];

  return (
    <MapContainer bounds={bounds} scrollWheelZoom className="point-map">
      <TileLayer attribution={attribution} url={tiles} />
      <Rectangle bounds={bounds} pathOptions={{ color: "#2563eb", weight: 2, fillOpacity: 0.15 }} />
      <FitBox bounds={bounds} />
    </MapContainer>
  );
}
