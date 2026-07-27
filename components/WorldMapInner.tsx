"use client";

import "leaflet/dist/leaflet.css";
import { MapContainer, TileLayer, CircleMarker, Tooltip } from "react-leaflet";
import { useMemo } from "react";
import { Entry } from "@/lib/types";

const ALL_COORDS: Record<string, [number, number]> = {
  // ===== VIỆT NAM =====
  "Hà Nội": [21.0245, 105.8412],
  "Hải Phòng": [20.8449, 106.6881],
  "Quảng Ninh": [21.006, 107.2925],
  "Hạ Long": [20.9101, 107.1839],
  "Hà Giang": [22.8232, 104.9836],
  "Lào Cai": [22.4856, 103.9751],
  "Sa Pa": [22.3364, 103.8438],
  "Sapa": [22.3364, 103.8438],
  "Điện Biên": [21.3869, 103.0235],
  "Cao Bằng": [22.6657, 106.2522],
  "Lạng Sơn": [21.853, 106.7608],
  "Yên Bái": [21.7226, 104.9113],
  "Mù Cang Chải": [21.8026, 104.0829],
  "Sơn La": [21.3256, 103.9188],
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
  "Quy Nhơn": [13.7765, 109.2237],
  "Bình Định": [13.7765, 109.2237],
  "Nha Trang": [12.2388, 109.1967],
  "Khánh Hòa": [12.2388, 109.1967],
  "Đà Lạt": [11.9465, 108.4419],
  "Lâm Đồng": [11.9465, 108.4419],
  "Phan Thiết": [10.9333, 108.1],
  "Vũng Tàu": [10.346, 107.0843],
  "TP. Hồ Chí Minh": [10.7769, 106.7009],
  "Hồ Chí Minh": [10.7769, 106.7009],
  "TP.HCM": [10.7769, 106.7009],
  "Cần Thơ": [10.045, 105.7469],
  "Cà Mau": [9.1769, 105.15],
  "Phú Quốc": [10.2899, 103.984],
  "Kiên Giang": [10.012, 105.0809],
  // ===== NHẬT BẢN =====
  "Tokyo": [35.6762, 139.6503],
  "Osaka": [34.6937, 135.5023],
  "Kyoto": [35.0116, 135.7681],
  "Sapporo": [43.0618, 141.3545],
  "Hokkaido": [43.2203, 142.8635],
  "Hiroshima": [34.3853, 132.4553],
  "Nara": [34.6851, 135.8048],
  "Fukuoka": [33.5904, 130.4017],
  "Nagoya": [35.1815, 136.9066],
  "Yokohama": [35.4437, 139.638],
  "Kobe": [34.6901, 135.1956],
  "Nikko": [36.7199, 139.6981],
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
  "Núi Phú Sĩ": [35.3606, 138.7274],
  "Phú Sĩ": [35.3606, 138.7274],
  "Shirakawa": [36.2571, 136.9051],
  "Miyajima": [34.295, 132.319],
  "Asakusa": [35.7148, 139.7967],
  "Shinjuku": [35.6938, 139.7034],
  "Akihabara": [35.7022, 139.7741],
  "Shibuya": [35.658, 139.7016],
  // ===== HÀN QUỐC =====
  "Seoul": [37.5665, 126.978],
  "Busan": [35.1796, 129.0756],
  "Jeju": [33.4996, 126.5312],
  "Incheon": [37.4563, 126.7052],
  "Gyeongju": [35.8562, 129.2247],
  // ===== TRUNG QUỐC =====
  "Beijing": [39.9042, 116.4074],
  "Bắc Kinh": [39.9042, 116.4074],
  "Shanghai": [31.2304, 121.4737],
  "Thượng Hải": [31.2304, 121.4737],
  "Guangzhou": [23.1291, 113.2644],
  "Quảng Châu": [23.1291, 113.2644],
  "Shenzhen": [22.5431, 114.0579],
  "Chengdu": [30.5728, 104.0668],
  "Xian": [34.3416, 108.9398],
  "Guilin": [25.2736, 110.2906],
  "Hangzhou": [30.2741, 120.1551],
  "Lijiang": [26.872, 100.2341],
  "Zhangjiajie": [29.1248, 110.4793],
  "Hong Kong": [22.3193, 114.1694],
  "Macao": [22.1987, 113.5439],
  // ===== THÁI LAN =====
  "Bangkok": [13.7563, 100.5018],
  "Chiang Mai": [18.7883, 98.9853],
  "Phuket": [7.8804, 98.3923],
  "Pattaya": [12.9236, 100.8825],
  "Krabi": [8.0863, 98.9063],
  "Koh Samui": [9.512, 100.0136],
  // ===== SINGAPORE =====
  "Singapore": [1.3521, 103.8198],
  // ===== MALAYSIA =====
  "Kuala Lumpur": [3.139, 101.6869],
  "Penang": [5.4141, 100.3288],
  "Langkawi": [6.35, 99.8],
  // ===== INDONESIA =====
  "Bali": [-8.3405, 115.092],
  "Jakarta": [-6.2088, 106.8456],
  "Yogyakarta": [-7.7971, 110.3688],
  // ===== CAMBODIA =====
  "Siem Reap": [13.3633, 103.8564],
  "Phnom Penh": [11.5564, 104.9282],
  // ===== LÀO =====
  "Luang Prabang": [19.8833, 102.135],
  "Vientiane": [17.9757, 102.6331],
  // ===== ẤN ĐỘ =====
  "Delhi": [28.6139, 77.209],
  "Mumbai": [19.076, 72.8777],
  "Agra": [27.1767, 78.0081],
  "Jaipur": [26.9124, 75.7873],
  "Goa": [15.2993, 74.124],
  // ===== DUBAI / UAE =====
  "Dubai": [25.2048, 55.2708],
  "Abu Dhabi": [24.4539, 54.3773],
  // ===== CHÂU ÂU =====
  "Paris": [48.8566, 2.3522],
  "London": [51.5074, -0.1278],
  "Rome": [41.9028, 12.4964],
  "Barcelona": [41.3851, 2.1734],
  "Madrid": [40.4168, -3.7038],
  "Amsterdam": [52.3676, 4.9041],
  "Berlin": [52.52, 13.405],
  "Vienna": [48.2082, 16.3738],
  "Prague": [50.0755, 14.4378],
  "Budapest": [47.4979, 19.0402],
  "Athens": [37.9838, 23.7275],
  "Santorini": [36.3932, 25.4615],
  "Istanbul": [41.0082, 28.9784],
  // ===== MỸ =====
  "New York": [40.7128, -74.006],
  "Los Angeles": [34.0522, -118.2437],
  "San Francisco": [37.7749, -122.4194],
  "Las Vegas": [36.1699, -115.1398],
  "Hawaii": [21.3069, -157.8583],
  // ===== ÚC =====
  "Sydney": [-33.8688, 151.2093],
  "Melbourne": [-37.8136, 144.9631],
  "Brisbane": [-27.4698, 153.0251],
  // ===== CANADA =====
  "Toronto": [43.6532, -79.3832],
  "Vancouver": [49.2827, -123.1207],
};

// Kinh độ của Việt Nam ~ 102-109
function isVietnam(coords: [number, number]) {
  return coords[1] >= 100 && coords[1] <= 110 && coords[0] >= 8 && coords[0] <= 24;
}

function normalize(s: string) {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/đ/g, "d");
}

function getLocations(e: Entry): string[] {
  const locs: string[] = [];
  try {
    const parsed = JSON.parse(String(e.metadata.locations || ""));
    if (Array.isArray(parsed)) {
      for (const l of parsed) if (typeof l === "string" && l.trim()) locs.push(l.trim());
    }
  } catch {}
  const single = String(e.metadata.location || "").trim();
  if (single) {
    for (const part of single.split(",")) {
      const t = part.trim();
      if (t) locs.push(t);
    }
  }
  return locs;
}

interface Props {
  entries: Entry[];
  onLocationClick?: (loc: string) => void;
}

export default function WorldMapInner({ entries, onLocationClick }: Props) {
  const travelEntries = entries.filter((e) => e.type === "TRAVEL");

  const { visitedCities, hasOverseas } = useMemo(() => {
    const allLocsNorm = new Set<string>();
    for (const e of travelEntries) {
      for (const loc of getLocations(e)) {
        allLocsNorm.add(normalize(loc));
      }
    }

    const result: Array<{ name: string; coords: [number, number] }> = [];
    const seenCoords = new Set<string>();

    for (const [city, coords] of Object.entries(ALL_COORDS)) {
      const coordKey = `${coords[0]},${coords[1]}`;
      if (seenCoords.has(coordKey)) continue;

      const cityNorm = normalize(city);
      const matched = Array.from(allLocsNorm).some(
        (locNorm) => locNorm.includes(cityNorm) || cityNorm.includes(locNorm)
      );

      if (matched) {
        result.push({ name: city, coords });
        seenCoords.add(coordKey);
      }
    }

    const overseas = result.some(({ coords }) => !isVietnam(coords));
    return { visitedCities: result, hasOverseas: overseas };
  }, [travelEntries]);

  // Nếu chỉ có Việt Nam → center vào Việt Nam; nếu có nước ngoài → zoom ra Đông Á
  const mapCenter: [number, number] = hasOverseas ? [22, 112] : [16.5, 106.5];
  const mapZoom = hasOverseas ? 4 : 5;

  return (
    <MapContainer
      center={mapCenter}
      zoom={mapZoom}
      style={{ height: "450px", width: "100%", borderRadius: "12px" }}
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
          key={`${coords[0]},${coords[1]}`}
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
