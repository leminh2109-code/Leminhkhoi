"use client";

import { useEffect, useState } from "react";
import { getKhoiAge, formatDateRange, formatDateRangeLong, ENTRY_TYPE_LABELS, getTravelLocations } from "@/lib/utils";
import { ImageLightbox } from "@/components/ImageLightbox";
import { Entry } from "@/lib/types";

const TYPE_DOT: Record<string, string> = {
  MEMORY: "bg-amber-400",
  TRAVEL: "bg-teal-500",
  SKILL: "bg-amber-500",
  EDUCATION: "bg-amber-500",
  BOOK: "bg-orange-400",
  SCHOOL: "bg-blue-500",
  FRIEND: "bg-pink-400",
};

export default function FamilyPage() {
  const [allEntries, setAllEntries] = useState<Entry[]>([]);
  const [coverImage, setCoverImage] = useState("/khoi1.jpeg");
  const [coverPos, setCoverPos] = useState({ x: 50, y: 0 });
  const [filter, setFilter] = useState<string | null>(null);
  const [countryFilter, setCountryFilter] = useState("");
  const [showCountriesModal, setShowCountriesModal] = useState(false);
  const [selected, setSelected] = useState<Entry | null>(null);
  const [lightbox, setLightbox] = useState<{ images: string[]; index: number } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/settings")
      .then((r) => r.ok ? r.json() : null)
      .then((data) => {
        if (!data) return;
        if (data.image) setCoverImage(data.image);
        if (data.pos) setCoverPos(data.pos);
      })
      .catch(() => {});

    fetch("/api/family")
      .then((r) => r.json())
      .then((data) => { setAllEntries(data); setLoading(false); });
  }, []);

  const travelEntries = allEntries.filter((e) => e.type === "TRAVEL");
  const memoriesEntries = allEntries.filter((e) => e.type === "MEMORY");
  const educationEntries = allEntries.filter((e) => ["SKILL", "BOOK", "SCHOOL", "EDUCATION"].includes(e.type));
  const friendEntries = allEntries.filter((e) => e.type === "FRIEND");

  const countryBreakdown = travelEntries.reduce<Record<string, number>>((acc, e) => {
    const c = String(e.metadata.country || "").trim();
    if (c) acc[c] = (acc[c] || 0) + 1;
    return acc;
  }, {});

  const filteredEntries =
    filter === "TRAVEL" && countryFilter
      ? travelEntries.filter((e) => String(e.metadata.country || "") === countryFilter)
      : filter === "TRAVEL" ? travelEntries
      : filter === "MEMORY" ? memoriesEntries
      : filter === "EDUCATION" ? educationEntries
      : filter === "FRIEND" ? friendEntries
      : allEntries;

  function goBack() {
    setFilter(null);
    setCountryFilter("");
  }

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "var(--bg)" }}>

      {/* ── DETAIL OVERLAY ── */}
      {selected && (
        <div className="fixed inset-0 z-50 overflow-y-auto" style={{ backgroundColor: "var(--bg)" }}>
          <div
            className="sticky top-0 px-4 py-4 flex items-center gap-3 border-b"
            style={{ backgroundColor: "var(--bg-card)", borderColor: "var(--border-2)" }}
          >
            <button onClick={() => setSelected(null)} style={{ color: "var(--text-2)" }}>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <h2 className="text-base font-semibold flex-1 truncate" style={{ color: "var(--text)" }}>
              {selected.title}
            </h2>
          </div>

          {selected.images.length > 0 && (
            <div className="overflow-x-auto scrollbar-hide flex gap-2 p-4">
              {selected.images.map((img, i) => (
                <img
                  key={i} src={img} alt=""
                  className="h-64 rounded-2xl object-cover flex-shrink-0 cursor-zoom-in"
                  onClick={() => setLightbox({ images: selected.images, index: i })}
                />
              ))}
            </div>
          )}

          <div className="px-4 py-4">
            <div className="flex items-start gap-3 mb-4">
              {selected.emoji && <span className="text-4xl mt-1">{selected.emoji}</span>}
              <div>
                <p className="text-xl font-semibold leading-snug" style={{ color: "var(--text)" }}>
                  {selected.title}
                </p>
                <p className="text-sm mt-1" style={{ color: "var(--text-2)" }}>
                  {formatDateRangeLong(selected.date, selected.metadata.endDate as string)}
                </p>
                <span
                  className="inline-block mt-1 text-xs px-2 py-0.5 rounded-full"
                  style={{ backgroundColor: "var(--bg-card2)", color: "var(--text-2)" }}
                >
                  {ENTRY_TYPE_LABELS[selected.type]}
                </span>
              </div>
            </div>
            {selected.description && (
              <p className="text-base leading-relaxed whitespace-pre-wrap" style={{ color: "var(--text-2)" }}>
                {selected.description}
              </p>
            )}
            <p className="text-xs mt-6" style={{ color: "var(--text-3)" }}>
              Ghi bởi {selected.author.name}
            </p>
          </div>
        </div>
      )}

      {lightbox && (
        <ImageLightbox images={lightbox.images} index={lightbox.index} onClose={() => setLightbox(null)} />
      )}

      {/* ── COUNTRIES MODAL ── */}
      {showCountriesModal && (
        <div className="fixed inset-0 z-50 flex items-end bg-black/30" onClick={() => setShowCountriesModal(false)}>
          <div
            className="w-full rounded-t-2xl px-4 pt-3 pb-10 shadow-xl"
            style={{ backgroundColor: "var(--bg-card)" }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-8 h-1 rounded-full mx-auto mb-4" style={{ backgroundColor: "var(--border-2)" }} />
            <h3 className="text-base font-semibold mb-3" style={{ color: "var(--text)" }}>🌏 Quốc gia đã đến</h3>
            <div className="space-y-2">
              {Object.entries(countryBreakdown).sort((a, b) => b[1] - a[1]).map(([country, count]) => (
                <button
                  key={country}
                  onClick={() => { setCountryFilter(country); setFilter("TRAVEL"); setShowCountriesModal(false); }}
                  className="w-full flex items-center justify-between px-4 py-3 rounded-xl text-left transition"
                  style={{ backgroundColor: "var(--bg-card2)" }}
                >
                  <span className="text-sm font-medium" style={{ color: "var(--text)" }}>{country}</span>
                  <span className="text-sm font-semibold text-teal-500">{count} chuyến ›</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── COVER HERO ── */}
      <div className="relative w-full overflow-hidden" style={{ height: 220 }}>
        <img
          src={coverImage}
          alt="cover"
          className="w-full h-full object-cover"
          style={{ objectPosition: `${coverPos.x}% ${coverPos.y}%` }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/20 to-transparent" />

        <div className="absolute bottom-0 left-0 right-0 flex items-end gap-3 px-4 pb-4">
          <div className="w-14 h-14 rounded-full flex-shrink-0 overflow-hidden border-2 border-amber-400 shadow-lg">
            <img src="/khoi-icon.png" alt="Khôi" className="w-full h-full object-cover object-top" />
          </div>
          <div className="pb-0.5">
            <p className="text-white font-bold text-lg leading-tight">Lê Minh Khôi</p>
            <p className="text-amber-300 text-xs mt-0.5">{getKhoiAge()} · Sinh 6/2/2022</p>
          </div>
        </div>
      </div>

      {/* ── STATS ROW ── */}
      <div className="flex gap-2 px-4 py-4">
        {[
          { label: "Kỷ niệm", value: memoriesEntries.length, onClick: () => setFilter("MEMORY") },
          { label: "Du lịch", value: travelEntries.length, onClick: () => setFilter("TRAVEL") },
          { label: "Kỹ năng", value: educationEntries.length, onClick: () => setFilter("EDUCATION") },
          { label: "Bạn bè", value: friendEntries.length, onClick: () => setFilter("FRIEND") },
          {
            label: "Quốc gia",
            value: Object.keys(countryBreakdown).length || "–",
            onClick: Object.keys(countryBreakdown).length > 0 ? () => setShowCountriesModal(true) : undefined,
          },
        ].map((s, i) => (
          <button
            key={i}
            onClick={s.onClick}
            className="flex-1 rounded-xl shadow-sm active:scale-95 transition-transform border"
            style={{ backgroundColor: "var(--bg-card)", borderColor: "var(--border-2)" }}
          >
            <div className="flex flex-col items-center py-2.5 px-1">
              <p className="font-bold text-base leading-none text-amber-500">{s.value}</p>
              <p className="text-[9px] mt-1 leading-tight whitespace-nowrap" style={{ color: "var(--text-2)" }}>
                {s.label}
              </p>
            </div>
          </button>
        ))}
      </div>

      {/* ── CONTENT ── */}
      {loading ? (
        <div className="flex justify-center py-16">
          <div className="w-8 h-8 rounded-full border-2 border-amber-700 border-t-transparent animate-spin" />
        </div>
      ) : filter !== null ? (

        /* ── FILTERED LIST ── */
        <div className="pb-10">
          <div className="px-4 mb-3 flex items-center gap-2">
            <button onClick={goBack} className="text-sm font-medium text-amber-500">
              ← Quay lại
            </button>
            {countryFilter && (
              <span className="text-sm" style={{ color: "var(--text-2)" }}>· {countryFilter}</span>
            )}
          </div>
          <div className="px-4 space-y-1.5">
            {filteredEntries.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-3xl mb-2">📝</p>
                <p className="text-sm" style={{ color: "var(--text-2)" }}>Chưa có mục nào</p>
              </div>
            ) : filteredEntries.map((entry) => (
              <button
                key={entry.id}
                onClick={() => setSelected(entry)}
                className="w-full rounded-2xl border p-3.5 flex items-center gap-3 text-left transition"
                style={{ backgroundColor: "var(--bg-card)", borderColor: "var(--border)" }}
              >
                <div className="flex-shrink-0 w-6">
                  <div className={`w-2.5 h-2.5 rounded-full ${TYPE_DOT[entry.type] || "bg-gray-400"}`} />
                </div>
                {entry.images.length > 0 ? (
                  <img src={entry.images[0]} alt="" className="w-10 h-10 rounded-xl object-cover flex-shrink-0" />
                ) : (
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center text-lg flex-shrink-0"
                    style={{ backgroundColor: "var(--bg-card2)" }}
                  >
                    {entry.emoji || "📌"}
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium leading-snug truncate" style={{ color: "var(--text)" }}>
                    {entry.title}
                  </p>
                  <p className="text-[11px] mt-0.5" style={{ color: "var(--text-3)" }}>
                    {formatDateRange(entry.date, entry.metadata.endDate as string)}
                    <span className="mx-1">·</span>
                    {ENTRY_TYPE_LABELS[entry.type]}
                  </p>
                </div>
                <svg className="w-3.5 h-3.5 flex-shrink-0" style={{ color: "var(--text-3)" }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            ))}
          </div>
        </div>

      ) : (

        /* ── OVERVIEW CAROUSELS ── */
        <div className="pb-10">

          {/* Du lịch */}
          {travelEntries.length > 0 && (
            <div className="mb-5">
              <div className="flex items-center justify-between px-4 mb-2">
                <h2 className="text-sm font-semibold" style={{ color: "var(--text)" }}>✈️ Du lịch</h2>
                <button onClick={() => setFilter("TRAVEL")} className="text-xs text-teal-500 font-medium">
                  Xem tất cả →
                </button>
              </div>
              <div className="flex gap-2.5 overflow-x-auto scrollbar-hide px-4 pb-1">
                {travelEntries.slice(0, 10).map((entry) => (
                  <button
                    key={entry.id}
                    onClick={() => setSelected(entry)}
                    className="flex-shrink-0 flex flex-col rounded-2xl overflow-hidden active:opacity-90 transition text-left border"
                    style={{ width: 130, backgroundColor: "var(--bg-card)", borderColor: "var(--border)" }}
                  >
                    <div className="flex-shrink-0 bg-teal-900/20" style={{ height: 115 }}>
                      {entry.images[0]
                        ? <img src={entry.images[0]} alt={entry.title} className="w-full h-full object-cover" />
                        : <div className="w-full h-full flex items-center justify-center text-4xl">{entry.emoji || "🗺️"}</div>
                      }
                    </div>
                    <div className="px-2.5 pt-2 pb-2.5 flex flex-col gap-0.5">
                      <p className="text-[11px] font-semibold leading-snug line-clamp-2" style={{ color: "var(--text)" }}>
                        {entry.title}
                      </p>
                      {getTravelLocations(entry.metadata).length > 0 && (
                        <p className="text-teal-500 text-[9px] truncate">
                          📍 {getTravelLocations(entry.metadata).join(" · ")}
                        </p>
                      )}
                      <p className="text-[9px]" style={{ color: "var(--text-3)" }}>
                        {new Date(entry.date).toLocaleDateString("vi-VN", { month: "numeric", year: "numeric" })}
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Kỷ niệm */}
          {memoriesEntries.length > 0 && (
            <div className="mb-5">
              <div className="flex items-center justify-between px-4 mb-2">
                <h2 className="text-sm font-semibold" style={{ color: "var(--text)" }}>💛 Kỷ niệm</h2>
                <button onClick={() => setFilter("MEMORY")} className="text-xs text-amber-500 font-medium">
                  Xem tất cả →
                </button>
              </div>
              <div className="flex gap-2.5 overflow-x-auto scrollbar-hide px-4 pb-1">
                {memoriesEntries.slice(0, 10).map((entry) => (
                  <button
                    key={entry.id}
                    onClick={() => setSelected(entry)}
                    className="flex-shrink-0 flex flex-col rounded-2xl overflow-hidden active:opacity-90 transition text-left border"
                    style={{ width: 130, backgroundColor: "var(--bg-card)", borderColor: "var(--border)" }}
                  >
                    <div className="flex-shrink-0 bg-amber-900/20" style={{ height: 115 }}>
                      {entry.images[0]
                        ? <img src={entry.images[0]} alt={entry.title} className="w-full h-full object-cover" />
                        : <div className="w-full h-full flex items-center justify-center text-4xl">{entry.emoji || "💛"}</div>
                      }
                    </div>
                    <div className="px-2.5 pt-2 pb-2.5 flex flex-col gap-0.5">
                      <p className="text-[11px] font-semibold leading-snug line-clamp-2" style={{ color: "var(--text)" }}>
                        {entry.title}
                      </p>
                      <p className="text-[9px]" style={{ color: "var(--text-3)" }}>
                        {new Date(entry.date).toLocaleDateString("vi-VN", { month: "numeric", year: "numeric" })}
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Học tập */}
          {educationEntries.length > 0 && (
            <div className="mb-5">
              <div className="flex items-center justify-between px-4 mb-2">
                <h2 className="text-sm font-semibold" style={{ color: "var(--text)" }}>📚 Học tập</h2>
                <button onClick={() => setFilter("EDUCATION")} className="text-xs text-amber-500 font-medium">
                  Xem tất cả →
                </button>
              </div>
              <div className="flex gap-2.5 overflow-x-auto scrollbar-hide px-4 pb-1">
                {educationEntries.slice(0, 10).map((entry) => (
                  <button
                    key={entry.id}
                    onClick={() => setSelected(entry)}
                    className="flex-shrink-0 rounded-2xl p-3 text-left transition flex flex-col gap-1.5 border"
                    style={{ width: 150, backgroundColor: "var(--bg-card)", borderColor: "var(--border)" }}
                  >
                    <span className="text-2xl">{entry.emoji || "📌"}</span>
                    <p className="text-xs font-semibold leading-snug line-clamp-2" style={{ color: "var(--text)" }}>
                      {entry.title}
                    </p>
                    <p className="text-[10px] mt-auto" style={{ color: "var(--text-3)" }}>
                      {new Date(entry.date).toLocaleDateString("vi-VN", { month: "numeric", year: "numeric" })}
                    </p>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Bạn bè */}
          {friendEntries.length > 0 && (
            <div className="mb-5">
              <div className="flex items-center justify-between px-4 mb-2">
                <h2 className="text-sm font-semibold" style={{ color: "var(--text)" }}>👫 Bạn bè</h2>
                <button onClick={() => setFilter("FRIEND")} className="text-xs text-pink-400 font-medium">
                  Xem tất cả →
                </button>
              </div>
              <div className="flex gap-2.5 overflow-x-auto scrollbar-hide px-4 pb-1">
                {friendEntries.slice(0, 10).map((entry) => (
                  <button
                    key={entry.id}
                    onClick={() => setSelected(entry)}
                    className="flex-shrink-0 flex flex-col rounded-2xl overflow-hidden active:opacity-90 transition text-left border"
                    style={{ width: 130, backgroundColor: "var(--bg-card)", borderColor: "var(--border)" }}
                  >
                    <div className="flex-shrink-0 bg-pink-900/20" style={{ height: 115 }}>
                      {entry.images[0]
                        ? <img src={entry.images[0]} alt={entry.title} className="w-full h-full object-cover" />
                        : <div className="w-full h-full flex items-center justify-center text-4xl">{entry.emoji || "👫"}</div>
                      }
                    </div>
                    <div className="px-2.5 pt-2 pb-2.5 flex flex-col gap-0.5">
                      <p className="text-[11px] font-semibold leading-snug line-clamp-2" style={{ color: "var(--text)" }}>
                        {entry.title}
                      </p>
                      <p className="text-[9px]" style={{ color: "var(--text-3)" }}>
                        {new Date(entry.date).toLocaleDateString("vi-VN", { month: "numeric", year: "numeric" })}
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="text-center pt-2 pb-6 px-4">
            <p className="text-xs" style={{ color: "var(--text-3)" }}>Nhật ký Khôi · Được tạo với yêu thương 💜</p>
          </div>
        </div>
      )}
    </div>
  );
}
