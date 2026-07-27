"use client";

import { useMemo } from "react";
import { getTravelLocations } from "@/lib/utils";
import { Entry } from "@/lib/types";

const VIETNAM_PATH =
  "M 62,8 L 82,4 L 108,2 L 132,2 L 150,5 L 162,16 " +
  "L 164,38 L 160,58 L 154,74 L 150,90 L 150,106 " +
  "L 144,128 L 132,152 L 122,170 L 118,186 " +
  "L 124,204 L 132,220 L 140,236 L 152,254 " +
  "L 156,268 L 154,282 L 156,304 L 158,326 " +
  "L 158,348 L 152,368 L 144,386 L 136,403 " +
  "L 126,418 L 112,430 L 96,448 L 78,452 " +
  "L 62,446 L 48,436 L 42,422 L 46,408 " +
  "L 54,394 L 60,380 L 64,364 L 66,348 " +
  "L 62,330 L 60,312 L 62,295 L 64,278 " +
  "L 62,262 L 64,245 L 66,228 L 70,212 " +
  "L 74,196 L 76,180 L 74,163 L 70,146 " +
  "L 72,130 L 74,113 L 72,97 L 70,80 " +
  "L 72,64 L 70,48 L 66,32 L 62,18 Z";

const CITY_COORDS: Record<string, [number, number]> = {
  "Hà Giang": [72, 30],
  "Lào Cai": [60, 48],
  "Cao Bằng": [148, 24],
  "Lạng Sơn": [152, 42],
  "Yên Bái": [88, 68],
  "Mù Cang Chải": [80, 76],
  "Điện Biên": [55, 68],
  "Hà Nội": [124, 94],
  "Hải Phòng": [148, 98],
  "Quảng Ninh": [158, 88],
  "Hạ Long": [158, 90],
  "Ninh Bình": [124, 120],
  "Thanh Hóa": [124, 146],
  "Nghệ An": [114, 168],
  "Vinh": [114, 170],
  "Hà Tĩnh": [120, 184],
  "Quảng Bình": [128, 204],
  "Quảng Trị": [136, 222],
  "Huế": [140, 236],
  "Đà Nẵng": [152, 254],
  "Hội An": [155, 262],
  "Quảng Nam": [148, 268],
  "Quảng Ngãi": [151, 280],
  "Bình Định": [154, 302],
  "Quy Nhơn": [155, 305],
  "Phú Yên": [156, 318],
  "Khánh Hòa": [157, 334],
  "Nha Trang": [157, 337],
  "Đà Lạt": [140, 354],
  "Lâm Đồng": [140, 354],
  "Phan Thiết": [150, 370],
  "Vũng Tàu": [140, 400],
  "TP. Hồ Chí Minh": [128, 408],
  "Hồ Chí Minh": [128, 408],
  "TP.HCM": [128, 408],
  "Cần Thơ": [108, 422],
  "Cà Mau": [90, 446],
  "Phú Quốc": [50, 430],
  "Kiên Giang": [56, 428],
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

export function VietnamMap({ entries, onLocationClick }: Props) {
  const vietnamEntries = entries.filter(
    (e) =>
      e.type === "TRAVEL" &&
      (!e.metadata.country ||
        String(e.metadata.country).toLowerCase().includes("viet") ||
        String(e.metadata.country) === "Việt Nam")
  );

  const visitedCities = useMemo(() => {
    const result: Array<{ name: string; coords: [number, number]; count: number }> = [];
    for (const [city, coords] of Object.entries(CITY_COORDS)) {
      const cityNorm = normalize(city);
      const count = vietnamEntries.filter((e) =>
        getTravelLocations(e.metadata).some((loc) => {
          const locNorm = normalize(loc);
          return locNorm.includes(cityNorm) || cityNorm.includes(locNorm);
        })
      ).length;
      if (count > 0) result.push({ name: city, coords, count });
    }
    return result;
  }, [vietnamEntries]);

  return (
    <div className="flex flex-col items-center">
      <svg
        viewBox="0 0 210 465"
        className="w-full max-w-[220px]"
        style={{ filter: "drop-shadow(0 1px 3px rgba(0,0,0,0.08))" }}
      >
        {/* Vietnam landmass */}
        <path d={VIETNAM_PATH} fill="#FDF4E7" stroke="#E8C89A" strokeWidth="1.5" strokeLinejoin="round" />

        {/* City markers */}
        {visitedCities.map(({ name, coords: [x, y] }) => (
          <g
            key={name}
            onClick={() => onLocationClick?.(name)}
            style={{ cursor: onLocationClick ? "pointer" : "default" }}
          >
            <circle cx={x} cy={y} r={6} fill="#B45309" opacity={0.15} />
            <circle cx={x} cy={y} r={4} fill="#B45309" />
            <circle cx={x} cy={y} r={2} fill="#FDF4E7" />
          </g>
        ))}
      </svg>

      {/* Legend */}
      {visitedCities.length > 0 && (
        <div className="mt-3 w-full max-w-[260px] flex flex-wrap gap-1.5 justify-center">
          {visitedCities.map(({ name }) => (
            <button
              key={name}
              onClick={() => onLocationClick?.(name)}
              className="flex items-center gap-1 bg-amber-50 border border-amber-200 text-amber-800 text-[11px] font-medium px-2.5 py-1 rounded-full hover:bg-amber-100 transition"
            >
              📍 {name}
            </button>
          ))}
        </div>
      )}

      {visitedCities.length === 0 && (
        <p className="text-xs text-gray-400 mt-3 text-center">
          Chưa có địa điểm Việt Nam nào được ghi lại
        </p>
      )}
    </div>
  );
}
