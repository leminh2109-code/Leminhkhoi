"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { PageShell } from "@/components/PageShell";
import { EntryModal } from "@/components/EntryModal";
import { Entry } from "@/lib/types";
import { formatDateRangeLong } from "@/lib/utils";
import toast from "react-hot-toast";

export default function HealthPage() {
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
    const res = await fetch("/api/entries?type=HEALTH");
    if (res.ok) setEntries(await res.json());
  }

  useEffect(() => {
    if (status === "authenticated") fetchEntries();
  }, [status]);

  async function deleteEntry(id: string) {
    if (!window.confirm("Xóa mục này?")) return;
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
          defaultType="HEALTH"
          entry={editingEntry ?? undefined}
          onClose={() => { setShowModal(false); setEditingEntry(null); }}
          onSaved={fetchEntries}
        />
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
                <img key={i} src={img} alt="" className="h-56 rounded-xl object-cover flex-shrink-0" />
              ))}
            </div>
          )}

          <div className="px-4 py-4 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-14 h-14 rounded-2xl bg-green-50 flex items-center justify-center text-3xl flex-shrink-0">
                {selected.emoji || "🏥"}
              </div>
              <div>
                <p className="text-lg font-semibold text-gray-800">{selected.title}</p>
                <p className="text-xs text-gray-400 mt-0.5">
                  {formatDateRangeLong(selected.date, selected.metadata.endDate as string)}
                </p>
              </div>
            </div>

            {/* Stats row */}
            {(!!selected.metadata.height || !!selected.metadata.weight) && (
              <div className="flex gap-3">
                {!!selected.metadata.height && (
                  <div className="flex-1 bg-green-50 rounded-2xl p-4 text-center">
                    <p className="text-2xl font-semibold text-green-700">{String(selected.metadata.height)}</p>
                    <p className="text-xs text-green-500 mt-0.5">cm — Chiều cao</p>
                  </div>
                )}
                {!!selected.metadata.weight && (
                  <div className="flex-1 bg-blue-50 rounded-2xl p-4 text-center">
                    <p className="text-2xl font-semibold text-blue-700">{String(selected.metadata.weight)}</p>
                    <p className="text-xs text-blue-500 mt-0.5">kg — Cân nặng</p>
                  </div>
                )}
              </div>
            )}

            {(!!selected.metadata.doctor || !!selected.metadata.diagnosis || !!selected.metadata.medication) && (
              <div className="bg-gray-50 rounded-2xl p-4 space-y-3">
                {!!selected.metadata.doctor && (
                  <div className="flex items-start gap-3">
                    <span className="text-lg mt-0.5">👨‍⚕️</span>
                    <div>
                      <p className="text-xs text-gray-400 font-medium">Bác sĩ / Cơ sở y tế</p>
                      <p className="text-sm text-gray-700 mt-0.5">{String(selected.metadata.doctor)}</p>
                    </div>
                  </div>
                )}
                {!!selected.metadata.diagnosis && (
                  <div className="flex items-start gap-3">
                    <span className="text-lg mt-0.5">🩺</span>
                    <div>
                      <p className="text-xs text-gray-400 font-medium">Chẩn đoán / Lý do khám</p>
                      <p className="text-sm text-gray-700 mt-0.5">{String(selected.metadata.diagnosis)}</p>
                    </div>
                  </div>
                )}
                {!!selected.metadata.medication && (
                  <div className="flex items-start gap-3">
                    <span className="text-lg mt-0.5">💊</span>
                    <div>
                      <p className="text-xs text-gray-400 font-medium">Thuốc</p>
                      <p className="text-sm text-gray-700 mt-0.5">{String(selected.metadata.medication)}</p>
                    </div>
                  </div>
                )}
              </div>
            )}

            {selected.description && (
              <p className="text-sm text-gray-600 leading-relaxed">{selected.description}</p>
            )}
            <p className="text-xs text-gray-300">Ghi bởi {selected.author.name}</p>
          </div>
        </div>
      )}

      <div className="px-4 pt-6">
        <div className="flex items-center justify-between mb-5">
          <h1 className="text-2xl font-semibold text-gray-900">Sức khỏe</h1>
          <button
            onClick={() => setShowModal(true)}
            className="w-8 h-8 rounded-full bg-green-500 text-white flex items-center justify-center text-lg font-light"
          >
            +
          </button>
        </div>

        {entries.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-100 p-8 text-center">
            <p className="text-3xl mb-2">🏥</p>
            <p className="text-sm text-gray-400">Chưa có mục sức khỏe nào</p>
            <button onClick={() => setShowModal(true)} className="mt-3 text-sm text-green-600 font-medium">
              Thêm lần khám đầu tiên →
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {entries.map((entry) => (
              <div key={entry.id} className="bg-white rounded-xl border border-gray-100 overflow-hidden">
                <button
                  onClick={() => setSelected(entry)}
                  className="w-full p-4 flex items-start gap-3 text-left active:bg-gray-50 transition"
                >
                  <div className="w-11 h-11 rounded-xl bg-green-50 flex items-center justify-center text-xl flex-shrink-0">
                    {entry.emoji || "🏥"}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-base font-medium text-gray-800">{entry.title}</p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {formatDateRangeLong(entry.date, entry.metadata.endDate as string)}
                    </p>
                    {(!!entry.metadata.height || !!entry.metadata.weight) && (
                      <p className="text-xs text-green-600 mt-0.5">
                        {[
                          entry.metadata.height ? `${String(entry.metadata.height)} cm` : null,
                          entry.metadata.weight ? `${String(entry.metadata.weight)} kg` : null,
                        ].filter(Boolean).join(" · ")}
                      </p>
                    )}
                    {!!entry.metadata.diagnosis && (
                      <p className="text-xs text-gray-400 mt-0.5 truncate">{String(entry.metadata.diagnosis)}</p>
                    )}
                  </div>
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
