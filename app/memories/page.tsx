"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { PageShell } from "@/components/PageShell";
import { EntryModal } from "@/components/EntryModal";
import { Entry } from "@/lib/types";
import { formatDateRangeLong } from "@/lib/utils";
import toast from "react-hot-toast";

export default function MemoriesPage() {
  const { status } = useSession();
  const router = useRouter();
  const [entries, setEntries] = useState<Entry[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [editingEntry, setEditingEntry] = useState<Entry | null>(null);
  const [selected, setSelected] = useState<Entry | null>(null);

  useEffect(() => {
    if (status === "unauthenticated") router.push("/login");
  }, [status, router]);

  async function fetchEntries() {
    const res = await fetch("/api/entries?type=MEMORY");
    if (res.ok) setEntries(await res.json());
  }

  useEffect(() => {
    if (status === "authenticated") fetchEntries();
  }, [status]);

  async function deleteEntry(id: string) {
    if (!window.confirm("Xóa kỷ niệm này?")) return;
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
          defaultType="MEMORY"
          entry={editingEntry ?? undefined}
          onClose={() => { setShowModal(false); setEditingEntry(null); }}
          onSaved={fetchEntries}
        />
      )}

      {/* Full-screen detail view */}
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
                <img key={i} src={img} alt="" className="h-56 rounded-xl object-cover flex-shrink-0" />
              ))}
            </div>
          )}

          <div className="px-4 py-2">
            <div className="flex items-center gap-3 mb-4">
              {selected.emoji && <span className="text-3xl">{selected.emoji}</span>}
              <div>
                <p className="text-base font-semibold text-gray-800">{selected.title}</p>
                <p className="text-xs text-gray-400">
                  {formatDateRangeLong(selected.date, selected.metadata.endDate as string)}
                </p>
              </div>
            </div>
            {selected.description && (
              <p className="text-sm text-gray-600 leading-relaxed">{selected.description}</p>
            )}
            <p className="text-xs text-gray-300 mt-4">Ghi bởi {selected.author.name}</p>
          </div>
        </div>
      )}

      <div className="px-4 pt-6">
        <div className="flex items-center justify-between mb-5">
          <h1 className="text-xl font-semibold text-gray-900">Kỷ niệm</h1>
          <button
            onClick={() => setShowModal(true)}
            className="w-8 h-8 rounded-full bg-coral-600 text-white flex items-center justify-center text-lg font-light"
          >
            +
          </button>
        </div>

        {entries.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-100 p-8 text-center">
            <p className="text-3xl mb-2">💛</p>
            <p className="text-sm text-gray-400">Chưa có kỷ niệm nào được ghi lại</p>
            <button onClick={() => setShowModal(true)} className="mt-3 text-sm text-coral-600 font-medium">
              Ghi lại kỷ niệm đầu tiên →
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {entries.map((entry) => (
              <div
                key={entry.id}
                className="bg-white rounded-xl border border-gray-100 overflow-hidden"
              >
                <button
                  onClick={() => setSelected(entry)}
                  className="w-full p-4 flex items-start gap-3 text-left active:bg-gray-50 transition"
                >
                  {entry.images[0] ? (
                    <img src={entry.images[0]} alt="" className="w-14 h-14 rounded-xl object-cover flex-shrink-0" />
                  ) : (
                    <div className="w-14 h-14 rounded-xl bg-coral-50 flex items-center justify-center text-2xl flex-shrink-0">
                      {entry.emoji || "💛"}
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-800 leading-snug">{entry.title}</p>
                    {entry.description && (
                      <p className="text-xs text-gray-400 mt-1 leading-relaxed line-clamp-2">{entry.description}</p>
                    )}
                    <div className="flex items-center gap-2 mt-1.5">
                      <p className="text-[11px] text-gray-300">
                        {formatDateRangeLong(entry.date, entry.metadata.endDate as string)}
                      </p>
                      <span className="text-[11px] text-gray-300">·</span>
                      <p className="text-[11px] text-gray-300">{entry.author.name}</p>
                    </div>
                  </div>
                  {entry.images.length > 1 && (
                    <span className="text-[11px] text-gray-300 flex-shrink-0">+{entry.images.length - 1}</span>
                  )}
                </button>
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
