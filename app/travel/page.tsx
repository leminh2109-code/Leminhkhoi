"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { PageShell } from "@/components/PageShell";
import { EntryModal } from "@/components/EntryModal";
import { Entry } from "@/lib/types";
import { formatDateRange } from "@/lib/utils";
import toast from "react-hot-toast";

export default function TravelPage() {
  const { status } = useSession();
  const router = useRouter();
  const [entries, setEntries] = useState<Entry[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [editingEntry, setEditingEntry] = useState<Entry | null>(null);

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
      fetchEntries();
    } else {
      toast.error("Xóa thất bại");
    }
  }

  const uniqueLocations = new Set(entries.map((e) => String(e.metadata.location || "")).filter(Boolean)).size;
  const uniqueCountries = new Set(entries.map((e) => String(e.metadata.country || "")).filter(Boolean)).size;

  return (
    <PageShell>
      {(showModal || editingEntry) && (
        <EntryModal
          defaultType="TRAVEL"
          entry={editingEntry ?? undefined}
          onClose={() => { setShowModal(false); setEditingEntry(null); }}
          onSaved={fetchEntries}
        />
      )}

      <div className="px-4 pt-6">
        <div className="flex items-center justify-between mb-5">
          <h1 className="text-xl font-semibold text-gray-900">Du lịch</h1>
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
              <div>
                <p className="text-3xl font-semibold">{entries.length}</p>
                <p className="text-teal-200 text-xs mt-0.5">Số chuyến</p>
              </div>
              <div>
                <p className="text-3xl font-semibold">{uniqueLocations || "–"}</p>
                <p className="text-teal-200 text-xs mt-0.5">Địa điểm</p>
              </div>
              <div>
                <p className="text-3xl font-semibold">{uniqueCountries || "–"}</p>
                <p className="text-teal-200 text-xs mt-0.5">Quốc gia</p>
              </div>
            </div>
          </div>
        )}

        {entries.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-100 p-8 text-center">
            <p className="text-3xl mb-2">✈️</p>
            <p className="text-sm text-gray-400">Chưa có chuyến đi nào</p>
            <button onClick={() => setShowModal(true)} className="mt-3 text-sm text-teal-600 font-medium">
              Thêm chuyến đi đầu tiên →
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {entries.map((entry) => (
              <div key={entry.id} className="bg-white rounded-xl border border-gray-100 overflow-hidden">
                {entry.images[0] ? (
                  <img src={entry.images[0]} alt={entry.title} className="w-full h-40 object-cover" />
                ) : (
                  <div className="w-full h-28 bg-teal-50 flex items-center justify-center">
                    <span className="text-5xl">{entry.emoji || "🗺️"}</span>
                  </div>
                )}
                <div className="p-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-sm font-semibold text-gray-800">{entry.title}</p>
                      {!!entry.metadata.location && (
                        <p className="text-xs text-teal-600 mt-0.5">📍 {String(entry.metadata.location)}</p>
                      )}
                      <p className="text-xs text-gray-400 mt-1">
                        {formatDateRange(entry.date, entry.metadata.endDate as string)}
                      </p>
                    </div>
                    {(entry.metadata.isFirstTime === true || entry.metadata.isFirstTime === "true") && (
                      <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-teal-50 text-teal-600 flex-shrink-0">
                        Lần đầu ✨
                      </span>
                    )}
                  </div>
                  {entry.description && (
                    <p className="text-xs text-gray-500 mt-2 leading-relaxed">{entry.description}</p>
                  )}
                  {entry.images.length > 1 && (
                    <div className="flex gap-1.5 mt-3 overflow-x-auto scrollbar-hide">
                      {entry.images.slice(1).map((img, i) => (
                        <img key={i} src={img} alt="" className="w-16 h-16 rounded-lg object-cover flex-shrink-0" />
                      ))}
                    </div>
                  )}
                </div>
                <div className="flex border-t border-gray-50">
                  <button
                    onClick={() => setEditingEntry(entry)}
                    className="flex-1 py-2 text-xs text-purple-500 font-medium hover:bg-purple-50 transition"
                  >
                    Sửa
                  </button>
                  <div className="w-px bg-gray-100" />
                  <button
                    onClick={() => deleteEntry(entry.id)}
                    className="flex-1 py-2 text-xs text-red-400 font-medium hover:bg-red-50 transition"
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
