"use client";

import "leaflet/dist/leaflet.css";
import { MapContainer, TileLayer, CircleMarker, Tooltip } from "react-leaflet";
import { useMemo } from "react";
import { Entry } from "@/lib/types";
import { getTravelLocations } from "@/lib/utils";

const CITY_COORDS: Record<string, [number, number]> = {
  "Hà Giang": [22.8232, 104.9836],
  "Lào Cai": [22.4856, 103.9751],
  "Điện Biên": [21.3869, 103.0235],
  "Cao Bằng": [22.6657, 106.2522],
  "Lạng Sơn": [21.853, 106.7608],
  "Yên Bái": [21.7226, 104.9113],
  "Mù Cang Chải": [21.8026, 104.0829],
  "Sơn La": [21.3256, 103.9188],
  "Hà Nội": [21.0245, 105.8412],
  "Hải Phòng": [20.8449, 106.6881],
  "Quảng Ninh": [21.006, 107.2925],
  "Hạ Long": [20.9101, 107.1839],
  "Ninh Bình": [20.2506, 105.9745],
  "Thanh Hóa": [19.8067, 105.7851],
  "Nghệ An": [18.6796, 105.6813],
  "Vinh": [18.6796, 105.6813],
  "Hà Tĩnh": [18.3559, 105.8877],
  "Quảng Bình": [17.4833, 106.5996],
  "Quảng Trị": [16.8167, 107.1333],
  "Huế": [16.4637, 107.5909],
  "Đà Nẵng": [16.0471, 108.2068],
  "Hội An": [15.8801, 108.338],
  "Quảng Nam": [15.5735, 108.4744],
  "Quảng Ngãi": [15.1214, 108.8042],
  "Bình Định": [13.7765, 109.2237],
  "Quy Nhơn": [13.7765, 109.2237],
  "Phú Yên": [13.0956, 109.3],
  "Khánh Hòa": [12.2388, 109.1967],
  "Nha Trang": [12.2388, 109.1967],
  "Đà Lạt": [11.9465, 108.4419],
  "Lâm Đồng": [11.9465, 108.4419],
  "Phan Thiết": [10.9333, 108.1],
  "Bình Thuận": [10.9333, 108.1],
  "Vũng Tàu": [10.346, 107.0843],
  "TP. Hồ Chí Minh": [10.7769, 106.7009],
  "Hồ Chí Minh": [10.7769, 106.7009],
  "TP.HCM": [10.7769, 106.7009],
  "Cần Thơ": [10.045, 105.7469],
  "Cà Mau": [9.1769, 105.15],
  "Phú Quốc": [10.2899, 103.984],
  "Kiên Giang": [10.012, 105.0809],
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

export default function VietnamMapInner({ entries, onLocationClick }: Props) {
  const vietnamEntries = entries.filter(
    (e) =>
      e.type === "TRAVEL" &&
      (!e.metadata.country ||
        String(e.metadata.country).includes("Việt") ||
        String(e.metadata.country).toLowerCase().includes("vietnam"))
  );

  const visitedCities = useMemo(() => {
    const result: Array<{ name: string; coords: [number, number] }> = [];
    const seen = new Set<string>();
    for (const [city, coords] of Object.entries(CITY_COORDS)) {
      if (seen.has(city)) continue;
      const cityNorm = normalize(city);
      const visited = vietnamEntries.some((e) =>
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
  }, [vietnamEntries]);

  return (
    <>
    <style>{`
      .city-label {
        background: transparent !important;
        border: none !important;
        box-shadow: none !important;
        padding: 0 !important;
      }
      .city-label::before { display: none !important; }
    `}</style>
    <MapContainer
      center={[16.5, 106.5]}
      zoom={5}
      style={{ height: "420px", width: "100%", borderRadius: "12px" }}
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
          radius={8}
          fillColor="#B45309"
          color="#fff"
          weight={2}
          fillOpacity={0.9}
          eventHandlers={{ click: () => onLocationClick?.(name) }}
        >
          <Tooltip
            direction="right"
            offset={[10, 0]}
            opacity={1}
            permanent
            className="city-label"
          >
            <span style={{ fontSize: 9, fontWeight: 700, color: "#92400e", whiteSpace: "nowrap", textShadow: "0 0 3px #fff, 0 0 3px #fff" }}>
              {name}
            </span>
          </Tooltip>
        </CircleMarker>
      ))}
    </MapContainer>
    </>
  );
}
