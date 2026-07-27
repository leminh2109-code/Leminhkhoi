"use client";

import { useEffect, useState, Suspense } from "react";
import { useSession } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { PageShell } from "@/components/PageShell";
import { EntryModal } from "@/components/EntryModal";
import { Entry } from "@/lib/types";
import { formatDateRange, getTravelLocations } from "@/lib/utils";
import { ImageLightbox } from "@/components/ImageLightbox";
import { VietnamMap } from "@/components/VietnamMap";
import toast from "react-hot-toast";

export default function TravelPage() {
  return (
    <Suspense>
      <TravelPageInner />
    </Suspense>
  );
}

function TravelPageInner() {
  const { status } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const countryFilter = searchParams.get("country");
  const [entries, setEntries] = useState<Entry[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [editingEntry, setEditingEntry] = useState<Entry | null>(null);
  const [selected, setSelected] = useState<Entry | null>(null);
  const [lightbox, setLightbox] = useState<{ images: string[]; index: number } | null>(null);
  const [locationFilter, setLocationFilter] = useState("");
  const [showLocationsModal, setShowLocationsModal] = useState(false);
  const [showCountriesModal, setShowCountriesModal] = useState(false);

  useEffect(() => {
    if (status === "unauthenticated") router.push("/login");
  }, [status, router]);

  async function fetchEntries() {
    const res = await fetch("/api/entries?type=TRAVEL");
    if (res.ok) setEntries(await res.json());
  }

  useEffect(() => {
    if (status === "authenticated") fetchEntries();
  }, [status]);

  async function deleteEntry(id: string) {
    if (!window.confirm("Xóa chuyến đi này?")) return;
    const res = await fetch(`/api/entries/${id}`, { method: "DELETE" });
    if (res.ok) {
      toast.success("Đã xóa");
      setSelected(null);
      fetchEntries();
    } else {
      toast.error("Xóa thất bại");
    }
  }

  const displayedEntries = entries.filter((e) => {
    if (countryFilter && String(e.metadata.country || "") !== countryFilter) return false;
    if (locationFilter && !getTravelLocations(e.metadata).includes(locationFilter)) return false;
    return true;
  });

  const locationBreakdown = entries.reduce<Record<string, number>>((acc, e) => {
    for (const loc of getTravelLocations(e.metadata)) {
      acc[loc] = (acc[loc] || 0) + 1;
    }
    return acc;
  }, {});
  const uniqueLocations = Object.keys(locationBreakdown).length;
  const countryBreakdown = entries.reduce<Record<string, number>>((acc, e) => {
    const c = String(e.metadata.country || "").trim();
    if (c) acc[c] = (acc[c] || 0) + 1;
    return acc;
  }, {});
  const uniqueCountries = Object.keys(countryBreakdown).length;

  return (
    <PageShell>
      {lightbox && <ImageLightbox images={lightbox.images} index={lightbox.index} onClose={() => setLightbox(null)} />}

      {(showModal || editingEntry) && (
        <EntryModal
          defaultType="TRAVEL"
          entry={editingEntry ?? undefined}
          onClose={() => { setShowModal(false); setEditingEntry(null); }}
          onSaved={() => { fetchEntries(); setSelected(null); }}
        />
      )}

      {/* Countries modal */}
      {showCountriesModal && (
        <div className="fixed inset-0 z-50 flex items-end bg-black/30" onClick={() => setShowCountriesModal(false)}>
          <div className="w-full bg-white rounded-t-2xl px-4 pt-3 pb-10 shadow-xl" onClick={(e) => e.stopPropagation()}>
            <div className="w-8 h-1 bg-gray-200 rounded-full mx-auto mb-4" />
            <h3 className="text-base font-semibold text-gray-800 mb-3">🌏 Quốc gia đã đến</h3>
            <div className="space-y-2 max-h-72 overflow-y-auto">
              {Object.entries(countryBreakdown)
                .sort((a, b) => b[1] - a[1])
                .map(([country, count]) => (
                  <button
                    key={country}
                    onClick={() => { router.push(`/travel?country=${encodeURIComponent(country)}`); setShowCountriesModal(false); }}
                    className="w-full flex items-center justify-between px-4 py-3 bg-gray-50 rounded-xl active:bg-gray-100 transition text-left"
                  >
                    <span className="text-sm font-medium text-gray-700">{country}</span>
                    <span className="text-sm text-teal-600 font-semibold">{count} chuyến ›</span>
                  </button>
                ))}
            </div>
          </div>
        </div>
      )}

      {/* Locations modal */}
      {showLocationsModal && (
        <div className="fixed inset-0 z-50 flex items-end bg-black/30" onClick={() => setShowLocationsModal(false)}>
          <div className="w-full bg-white rounded-t-2xl px-4 pt-3 pb-10 shadow-xl" onClick={(e) => e.stopPropagation()}>
            <div className="w-8 h-1 bg-gray-200 rounded-full mx-auto mb-4" />
            <h3 className="text-base font-semibold text-gray-800 mb-3">📍 Địa điểm đã đến</h3>
            <div className="space-y-2 max-h-72 overflow-y-auto">
              {Object.entries(locationBreakdown)
                .sort((a, b) => b[1] - a[1])
                .map(([loc, count]) => (
                  <button
                    key={loc}
                    onClick={() => { setLocationFilter(loc); setShowLocationsModal(false); }}
                    className="w-full flex items-center justify-between px-4 py-3 bg-gray-50 rounded-xl active:bg-gray-100 transition text-left"
                  >
                    <span className="text-sm font-medium text-gray-700">{loc}</span>
                    <span className="text-sm text-teal-600 font-semibold">{count} lần ›</span>
                  </button>
                ))}
            </div>
          </div>
        </div>
      )}

      {/* Detail view */}
      {selected && (
        <div className="fixed inset-0 z-50 bg-white overflow-y-auto">
          <div className="sticky top-0 bg-white border-b border-gray-100 px-4 py-4 flex items-center gap-3">
            <button onClick={() => setSelected(null)} className="text-gray-400">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <h2 className="text-base font-semibold text-gray-800 flex-1 truncate">{selected.title}</h2>
            <button
              onClick={() => { setEditingEntry(selected); setSelected(null); }}
              className="text-sm text-amber-700 font-medium"
            >
              Sửa
            </button>
            <button
              onClick={() => deleteEntry(selected.id)}
              className="text-sm text-red-400 font-medium"
            >
              Xóa
            </button>
          </div>

          {selected.images.length > 0 && (
            <div className="overflow-x-auto scrollbar-hide flex gap-2 p-4">
              {selected.images.map((img, i) => (
                <img key={i} src={img} alt="" className="h-64 rounded-2xl object-cover flex-shrink-0 shadow-sm cursor-zoom-in"
                  onClick={() => setLightbox({ images: selected.images, index: i })} />
              ))}
            </div>
          )}

          <div className="px-4 py-4 space-y-3">
            <div>
              <p className="text-xl font-semibold text-gray-900 leading-snug">{selected.title}</p>
              {getTravelLocations(selected.metadata).length > 0 && (
                <p className="text-sm text-teal-600 mt-1 leading-relaxed">
                  📍 {getTravelLocations(selected.metadata).join(" · ")}
                </p>
              )}
              <p className="text-sm text-gray-400 mt-1">
                {formatDateRange(selected.date, selected.metadata.endDate as string)}
              </p>
              <div className="flex flex-wrap gap-2 mt-2">
                {(selected.metadata.isFirstTime === true || selected.metadata.isFirstTime === "true") && (
                  <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-teal-50 text-teal-600">Lần đầu ✨</span>
                )}
                {!!(selected.metadata.country) && (
                  <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-gray-100 text-gray-500">
                    🌏 {String(selected.metadata.country)}
                  </span>
                )}
              </div>
            </div>

            {selected.description && (
              <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">{selected.description}</p>
            )}

            <p className="text-xs text-gray-300 pt-2">Ghi bởi {selected.author.name}</p>
          </div>
        </div>
      )}

      <div className="px-4 pt-6">
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-xl font-semibold text-gray-900">Du lịch</h1>
            {countryFilter && (
              <button
                onClick={() => router.push("/travel")}
                className="flex items-center gap-1 px-2.5 py-1 bg-teal-50 text-teal-600 rounded-full text-xs font-medium"
              >
                {countryFilter} ✕
              </button>
            )}
            {locationFilter && (
              <button
                onClick={() => setLocationFilter("")}
                className="flex items-center gap-1 px-2.5 py-1 bg-teal-500 text-white rounded-full text-xs font-medium"
              >
                📍 {locationFilter} ✕
              </button>
            )}
          </div>
          <button
            onClick={() => setShowModal(true)}
            className="w-8 h-8 rounded-full bg-teal-600 text-white flex items-center justify-center text-lg font-light"
          >
            +
          </button>
        </div>

        {/* Summary */}
        {entries.length > 0 && (
          <div className="bg-teal-600 rounded-2xl p-4 mb-5 text-white">
            <div className="grid grid-cols-3 gap-3 text-center">
              <button
                onClick={() => { router.push("/travel"); setLocationFilter(""); }}
                className={`${(countryFilter || locationFilter) ? "opacity-70" : ""}`}
              >
                <p className="text-3xl font-semibold">{entries.length}</p>
                <p className="text-teal-200 text-xs mt-0.5">Số chuyến</p>
              </button>
              <button
                onClick={() => uniqueLocations > 0 && setShowLocationsModal(true)}
                className="disabled:cursor-default"
                disabled={uniqueLocations === 0}
              >
                <p className="text-3xl font-semibold">{uniqueLocations || "–"}</p>
                <p className="text-teal-200 text-xs mt-0.5">Địa điểm</p>
              </button>
              <button
                onClick={() => uniqueCountries > 0 && setShowCountriesModal(true)}
                className="disabled:cursor-default"
                disabled={uniqueCountries === 0}
              >
                <p className="text-3xl font-semibold">{uniqueCountries || "–"}</p>
                <p className="text-teal-200 text-xs mt-0.5">Quốc gia</p>
              </button>
            </div>
          </div>
        )}

        {/* Vietnam map — chỉ hiện khi không filter, có entries VN */}
        {!countryFilter && !locationFilter && entries.some(e => !e.metadata.country || String(e.metadata.country).includes("Việt")) && (
          <div className="bg-white rounded-2xl border border-gray-100 p-4 mb-5">
            <p className="text-sm font-semibold text-gray-700 mb-3">🗺️ Bản đồ Việt Nam</p>
            <VietnamMap
              entries={entries}
              onLocationClick={(loc) => setLocationFilter(loc)}
            />
          </div>
        )}

        {displayedEntries.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-100 p-8 text-center">
            <p className="text-3xl mb-2">✈️</p>
            <p className="text-sm text-gray-400">
              {countryFilter ? `Chưa có chuyến đi nào tại ${countryFilter}` : "Chưa có chuyến đi nào"}
            </p>
            {!countryFilter && (
              <button onClick={() => setShowModal(true)} className="mt-3 text-sm text-teal-600 font-medium">
                Thêm chuyến đi đầu tiên →
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            {displayedEntries.map((entry) => (
              <button
                key={entry.id}
                onClick={() => setSelected(entry)}
                className="w-full bg-white rounded-xl border border-gray-100 overflow-hidden text-left active:bg-gray-50 transition flex items-center gap-3 p-3"
              >
                {entry.images[0] ? (
                  <img src={entry.images[0]} alt={entry.title} className="w-20 h-20 rounded-xl object-cover flex-shrink-0" />
                ) : (
                  <div className="w-20 h-20 rounded-xl bg-teal-50 flex items-center justify-center text-3xl flex-shrink-0">
                    {entry.emoji || "🗺️"}
                  </div>
                )}
                <div className="flex-1 min-w-0 py-0.5">
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-sm font-semibold text-gray-800 leading-snug">{entry.title}</p>
                    {(entry.metadata.isFirstTime === true || entry.metadata.isFirstTime === "true") && (
                      <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-full bg-teal-50 text-teal-600 flex-shrink-0">
                        Lần đầu ✨
                      </span>
                    )}
                  </div>
                  {getTravelLocations(entry.metadata).length > 0 && (
                    <p className="text-xs text-teal-600 mt-0.5 leading-relaxed">
                      📍 {getTravelLocations(entry.metadata).join(" · ")}
                    </p>
                  )}
                  <p className="text-xs text-gray-400 mt-0.5">
                    {formatDateRange(entry.date, entry.metadata.endDate as string)}
                  </p>
                  {entry.description && (
                    <p className="text-xs text-gray-400 mt-1 line-clamp-2 leading-relaxed">{entry.description}</p>
                  )}
                </div>
                {entry.images.length > 1 && (
                  <span className="text-[11px] text-gray-300 flex-shrink-0 self-start mt-0.5">
                    +{entry.images.length - 1}
                  </span>
                )}
                <svg className="w-4 h-4 text-gray-300 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            ))}
          </div>
        )}
      </div>
    </PageShell>
  );
}
