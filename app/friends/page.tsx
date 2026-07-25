"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { PageShell } from "@/components/PageShell";
import { EntryModal } from "@/components/EntryModal";
import { Entry } from "@/lib/types";
import { formatDate, formatDateRange } from "@/lib/utils";
import { ImageLightbox } from "@/components/ImageLightbox";
import toast from "react-hot-toast";

export default function FriendsPage() {
  const { status } = useSession();
  const router = useRouter();
  const [entries, setEntries] = useState<Entry[]>([]);
  const [travelEntries, setTravelEntries] = useState<Entry[]>([]);
  const [tripCounts, setTripCounts] = useState<Record<string, number>>({});
  const [showModal, setShowModal] = useState(false);
  const [editingEntry, setEditingEntry] = useState<Entry | null>(null);
  const [selected, setSelected] = useState<Entry | null>(null);
  const [selectedTrip, setSelectedTrip] = useState<Entry | null>(null);
  const [lightbox, setLightbox] = useState<{ images: string[]; index: number } | null>(null);

  useEffect(() => {
    if (status === "unauthenticated") router.push("/login");
  }, [status, router]);

  async function fetchEntries() {
    const [friendRes, travelRes] = await Promise.all([
      fetch("/api/entries?type=FRIEND"),
      fetch("/api/entries?type=TRAVEL"),
    ]);
    if (friendRes.ok) setEntries(await friendRes.json());
    if (travelRes.ok) {
      const travels: Entry[] = await travelRes.json();
      setTravelEntries(travels);
      const counts: Record<string, number> = {};
      for (const t of travels) {
        let companions: string[] = [];
        try { companions = JSON.parse(String(t.metadata.companions || "[]")); } catch {}
        for (const id of companions) counts[id] = (counts[id] || 0) + 1;
      }
      setTripCounts(counts);
    }
  }

  useEffect(() => {
    if (status === "authenticated") fetchEntries();
  }, [status]);

  const sortedEntries = [...entries].sort((a, b) => (tripCounts[b.id] || 0) - (tripCounts[a.id] || 0));

  async function deleteEntry(id: string) {
    if (!window.confirm("Xóa bạn này?")) return;
    const res = await fetch(`/api/entries/${id}`, { method: "DELETE" });
    if (res.ok) {
      toast.success("Đã xóa");
      setSelected(null);
      fetchEntries();
    } else {
      toast.error("Xóa thất bại");
    }
  }

  return (
    <PageShell>
      {(showModal || editingEntry) && (
        <EntryModal
          defaultType="FRIEND"
          entry={editingEntry ?? undefined}
          onClose={() => { setShowModal(false); setEditingEntry(null); }}
          onSaved={fetchEntries}
        />
      )}

      {lightbox && <ImageLightbox images={lightbox.images} index={lightbox.index} onClose={() => setLightbox(null)} />}

      {/* Trip detail overlay — above friend detail */}
      {selectedTrip && (
        <div className="fixed inset-0 z-[60] bg-white overflow-y-auto">
          <div className="sticky top-0 bg-white border-b border-gray-100 px-4 py-4 flex items-center gap-3">
            <button onClick={() => setSelectedTrip(null)} className="text-gray-400">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <h2 className="text-base font-semibold text-gray-800 flex-1 truncate">{selectedTrip.title}</h2>
          </div>

          {selectedTrip.images.length > 0 && (
            <div className="overflow-x-auto scrollbar-hide flex gap-2 p-4">
              {selectedTrip.images.map((img, i) => (
                <img key={i} src={img} alt="" className="h-64 rounded-2xl object-cover flex-shrink-0 shadow-sm cursor-zoom-in"
                  onClick={() => setLightbox({ images: selectedTrip.images, index: i })} />
              ))}
            </div>
          )}

          <div className="px-4 py-4 space-y-3">
            <div>
              <p className="text-xl font-semibold text-gray-900 leading-snug">{selectedTrip.title}</p>
              {!!selectedTrip.metadata.location && (
                <p className="text-sm text-teal-600 mt-1">📍 {String(selectedTrip.metadata.location)}</p>
              )}
              <p className="text-sm text-gray-400 mt-1">
                {formatDateRange(selectedTrip.date, selectedTrip.metadata.endDate as string)}
              </p>
              {!!selectedTrip.metadata.country && (
                <span className="inline-block mt-2 text-xs font-medium px-2.5 py-1 rounded-full bg-gray-100 text-gray-500">
                  🌏 {String(selectedTrip.metadata.country)}
                </span>
              )}
            </div>
            {selectedTrip.description && (
              <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">{selectedTrip.description}</p>
            )}
            <p className="text-xs text-gray-300 pt-2">Ghi bởi {selectedTrip.author.name}</p>
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
              className="text-sm text-purple-600 font-medium"
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
                <img key={i} src={img} alt="" className="h-56 rounded-xl object-cover flex-shrink-0 cursor-zoom-in"
                  onClick={() => setLightbox({ images: selected.images, index: i })} />
              ))}
            </div>
          )}

          <div className="px-4 py-4 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-14 h-14 rounded-2xl bg-pink-50 flex items-center justify-center text-3xl flex-shrink-0">
                {selected.emoji || "👫"}
              </div>
              <div>
                <p className="text-lg font-semibold text-gray-800">{selected.title}</p>
                <p className="text-xs text-gray-400 mt-0.5">Quen từ {formatDate(selected.date)}</p>
                {(tripCounts[selected.id] || 0) > 0 && (
                  <span className="inline-block mt-1 text-xs font-semibold px-2 py-0.5 rounded-full bg-teal-50 text-teal-600">
                    ✈️ Đã đi {tripCounts[selected.id]} chuyến cùng Khôi
                  </span>
                )}
              </div>
            </div>

            {!!(selected.metadata.address || selected.metadata.fatherName || selected.metadata.motherName || selected.metadata.phone) && (
              <div className="bg-gray-50 rounded-2xl p-4 space-y-3">
                {!!selected.metadata.address && (
                  <div className="flex items-start gap-3">
                    <span className="text-lg mt-0.5">🏠</span>
                    <div>
                      <p className="text-xs text-gray-400 font-medium">Địa chỉ</p>
                      <p className="text-sm text-gray-700 mt-0.5">{String(selected.metadata.address)}</p>
                    </div>
                  </div>
                )}
                {(!!selected.metadata.fatherName || !!selected.metadata.motherName) && (
                  <div className="flex items-start gap-3">
                    <span className="text-lg mt-0.5">👨‍👩‍👦</span>
                    <div>
                      <p className="text-xs text-gray-400 font-medium">Bố mẹ</p>
                      {!!selected.metadata.fatherName && (
                        <p className="text-sm text-gray-700 mt-0.5">Bố: {String(selected.metadata.fatherName)}</p>
                      )}
                      {!!selected.metadata.motherName && (
                        <p className="text-sm text-gray-700">Mẹ: {String(selected.metadata.motherName)}</p>
                      )}
                    </div>
                  </div>
                )}
                {!!selected.metadata.phone && (
                  <div className="flex items-start gap-3">
                    <span className="text-lg mt-0.5">📞</span>
                    <div>
                      <p className="text-xs text-gray-400 font-medium">Số điện thoại</p>
                      <p className="text-sm text-gray-700 mt-0.5">{String(selected.metadata.phone)}</p>
                    </div>
                  </div>
                )}
              </div>
            )}

            {selected.description && (
              <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-wrap">{selected.description}</p>
            )}

            {(() => {
              const sharedTrips = travelEntries.filter((t) => {
                try { return JSON.parse(String(t.metadata.companions || "[]")).includes(selected.id); } catch { return false; }
              });
              if (sharedTrips.length === 0) return null;
              return (
                <div>
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">✈️ Chuyến đi cùng nhau</p>
                  <div className="space-y-2">
                    {sharedTrips.map((trip) => (
                      <button key={trip.id} onClick={() => setSelectedTrip(trip)}
                        className="w-full flex items-center gap-3 bg-teal-50 rounded-xl p-3 text-left active:bg-teal-100 transition">
                        {trip.images[0] ? (
                          <img src={trip.images[0]} alt="" className="w-12 h-12 rounded-lg object-cover flex-shrink-0" />
                        ) : (
                          <div className="w-12 h-12 rounded-lg bg-teal-100 flex items-center justify-center text-xl flex-shrink-0">
                            {trip.emoji || "🗺️"}
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-800 leading-snug">{trip.title}</p>
                          {!!trip.metadata.location && (
                            <p className="text-xs text-teal-600 mt-0.5">📍 {String(trip.metadata.location)}</p>
                          )}
                          <p className="text-xs text-gray-400 mt-0.5">
                            {formatDateRange(trip.date, trip.metadata.endDate as string)}
                          </p>
                        </div>
                        <svg className="w-4 h-4 text-teal-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </button>
                    ))}
                  </div>
                </div>
              );
            })()}

            <p className="text-xs text-gray-300">Ghi bởi {selected.author.name}</p>
          </div>
        </div>
      )}

      <div className="px-4 pt-6">
        <div className="flex items-center justify-between mb-5">
          <h1 className="text-2xl font-semibold text-gray-900">Bạn bè</h1>
          <button
            onClick={() => setShowModal(true)}
            className="w-8 h-8 rounded-full bg-pink-500 text-white flex items-center justify-center text-lg font-light"
          >
            +
          </button>
        </div>

        {entries.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-100 p-8 text-center">
            <p className="text-3xl mb-2">👫</p>
            <p className="text-sm text-gray-400">Chưa có bạn bè nào được ghi lại</p>
            <button onClick={() => setShowModal(true)} className="mt-3 text-sm text-pink-500 font-medium">
              Thêm người bạn đầu tiên →
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {sortedEntries.map((entry, index) => (
              <div key={entry.id} className="bg-white rounded-xl border border-gray-100 overflow-hidden">
                <button
                  onClick={() => setSelected(entry)}
                  className="w-full p-4 flex items-center gap-3 text-left active:bg-gray-50 transition"
                >
                  <span className="text-sm font-bold text-gray-300 w-5 text-center flex-shrink-0">
                    {index + 1}
                  </span>
                  {entry.images[0] ? (
                    <img src={entry.images[0]} alt="" className="w-14 h-14 rounded-2xl object-cover flex-shrink-0" />
                  ) : (
                    <div className="w-14 h-14 rounded-2xl bg-pink-50 flex items-center justify-center text-2xl flex-shrink-0">
                      {entry.emoji || "👫"}
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-base font-medium text-gray-800">{entry.title}</p>
                    {!!entry.metadata.address && (
                      <p className="text-xs text-gray-400 mt-0.5 truncate">🏠 {String(entry.metadata.address)}</p>
                    )}
                    {(!!entry.metadata.fatherName || !!entry.metadata.motherName) && (
                      <p className="text-xs text-gray-400 mt-0.5">
                        👨‍👩‍👦 {[entry.metadata.fatherName, entry.metadata.motherName].filter(Boolean).map(String).join(" · ")}
                      </p>
                    )}
                  </div>
                  {(tripCounts[entry.id] || 0) > 0 && (
                    <span className="flex-shrink-0 text-xs font-semibold px-2.5 py-1 rounded-full bg-teal-50 text-teal-600">
                      ✈️ {tripCounts[entry.id]} chuyến
                    </span>
                  )}
                </button>
                <div className="flex border-t border-gray-50">
                  <button
                    onClick={() => setEditingEntry(entry)}
                    className="flex-1 py-2.5 text-sm text-purple-500 font-medium hover:bg-purple-50 transition"
                  >
                    Sửa
                  </button>
                  <div className="w-px bg-gray-100" />
                  <button
                    onClick={() => deleteEntry(entry.id)}
                    className="flex-1 py-2.5 text-sm text-red-400 font-medium hover:bg-red-50 transition"
                  >
                    Xóa
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </PageShell>
  );
}
