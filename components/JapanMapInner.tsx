"use client";

import "leaflet/dist/leaflet.css";
import { MapContainer, TileLayer, CircleMarker, Tooltip } from "react-leaflet";
import { useMemo } from "react";
import { Entry } from "@/lib/types";
import { getTravelLocations } from "@/lib/utils";

const JAPAN_COORDS: Record<string, [number, number]> = {
  "Tokyo": [35.6762, 139.6503],
  "Tōkyō": [35.6762, 139.6503],
  "Osaka": [34.6937, 135.5023],
  "Ōsaka": [34.6937, 135.5023],
  "Kyoto": [35.0116, 135.7681],
  "Kyōto": [35.0116, 135.7681],
  "Sapporo": [43.0618, 141.3545],
  "Hokkaido": [43.0618, 141.3545],
  "Hokkaidō": [43.0618, 141.3545],
  "Hiroshima": [34.3853, 132.4553],
  "Nara": [34.6851, 135.8048],
  "Fukuoka": [33.5904, 130.4017],
  "Nagoya": [35.1815, 136.9066],
  "Yokohama": [35.4437, 139.6380],
  "Kobe": [34.6901, 135.1956],
  "Kōbe": [34.6901, 135.1956],
  "Nikko": [36.7199, 139.6981],
  "Nikkō": [36.7199, 139.6981],
  "Hakone": [35.2329, 139.1069],
  "Kamakura": [35.3192, 139.5501],
  "Nagasaki": [32.7503, 129.8779],
  "Kumamoto": [32.8032, 130.7079],
  "Beppu": [33.2842, 131.4914],
  "Sendai": [38.2682, 140.8694],
  "Kanazawa": [36.5613, 136.6562],
  "Matsumoto": [36.2382, 137.9724],
  "Takayama": [36.1461, 137.2522],
  "Nagano": [36.6485, 138.1947],
  "Okinawa": [26.2124, 127.6809],
  "Naha": [26.2124, 127.6809],
  "Fuji": [35.3606, 138.7274],
  "Fujisan": [35.3606, 138.7274],
  "Shirakawa": [36.2571, 136.9051],
  "Miyajima": [34.2950, 132.3190],
  "Asakusa": [35.7148, 139.7967],
  "Shinjuku": [35.6938, 139.7034],
  "Akihabara": [35.7022, 139.7741],
  "Harajuku": [35.6702, 139.7027],
  "Shibuya": [35.6580, 139.7016],
};

function normalize(s: string) {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/đ/g, "d");
}

interface Props {
  entries: Entry[];
  onLocationClick?: (loc: string) => void;
}

export default function JapanMapInner({ entries, onLocationClick }: Props) {
  const japanEntries = entries.filter(
    (e) =>
      e.type === "TRAVEL" &&
      (String(e.metadata.country).includes("Nhật") ||
        String(e.metadata.country).toLowerCase().includes("japan") ||
        String(e.metadata.country).includes("日本"))
  );

  const visitedCities = useMemo(() => {
    const result: Array<{ name: string; coords: [number, number] }> = [];
    const seen = new Set<string>();
    for (const [city, coords] of Object.entries(JAPAN_COORDS)) {
      if (seen.has(city)) continue;
      const cityNorm = normalize(city);
      const visited = japanEntries.some((e) =>
        getTravelLocations(e.metadata).some((loc) => {
          const locNorm = normalize(loc);
          return locNorm.includes(cityNorm) || cityNorm.includes(locNorm);
        })
      );
      if (visited) {
        result.push({ name: city, coords });
        seen.add(city);
      }
    }
    return result;
  }, [japanEntries]);

  return (
    <MapContainer
      center={[36.5, 137.5]}
      zoom={5}
      style={{ height: "380px", width: "100%", borderRadius: "12px" }}
      scrollWheelZoom={false}
      zoomControl
      attributionControl={false}
    >
      <TileLayer
        url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a> &copy; <a href="https://carto.com">CARTO</a>'
      />

      {visitedCities.map(({ name, coords }) => (
        <CircleMarker
          key={name}
          center={coords}
          radius={6}
          fillColor="#B45309"
          color="#fff"
          weight={2}
          fillOpacity={0.9}
          eventHandlers={{ click: () => onLocationClick?.(name) }}
        >
          <Tooltip direction="top" offset={[0, -8]} opacity={1}>
            <span style={{ fontSize: 12, fontWeight: 600 }}>📍 {name}</span>
          </Tooltip>
        </CircleMarker>
      ))}
    </MapContainer>
  );
}
