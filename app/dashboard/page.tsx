"use client";

import { useEffect, useState } from "react";
import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import { PageShell } from "@/components/PageShell";
import { EntryModal } from "@/components/EntryModal";
import { Entry } from "@/lib/types";
import { getKhoiAge, formatDateRange, formatDateRangeLong, ENTRY_TYPE_LABELS } from "@/lib/utils";
import toast from "react-hot-toast";

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [entries, setEntries] = useState<Entry[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [editingEntry, setEditingEntry] = useState<Entry | null>(null);
  const [selected, setSelected] = useState<Entry | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === "unauthenticated") router.push("/login");
  }, [status, router]);

  async function fetchEntries() {
    const res = await fetch("/api/entries?limit=10");
    if (res.ok) setEntries(await res.json());
    setLoading(false);
  }

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

  useEffect(() => {
    if (status === "authenticated") fetchEntries();
  }, [status]);

  const stats = {
    memories: entries.filter((e) => e.type === "MEMORY").length,
    travel: entries.filter((e) => e.type === "TRAVEL").length,
    skills: entries.filter((e) => e.type === "SKILL" || e.type === "EDUCATION").length,
    friends: entries.filter((e) => e.type === "FRIEND").length,
  };

  const TYPE_COLORS: Record<string, string> = {
    MEMORY: "bg-coral-50",
    TRAVEL: "bg-teal-50",
    SKILL: "bg-purple-50",
    EDUCATION: "bg-purple-50",
    BOOK: "bg-amber-50",
    SCHOOL: "bg-purple-50",
    FRIEND: "bg-pink-50",
  };

  if (status === "loading" || loading) {
    return (
      <PageShell>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="w-8 h-8 rounded-full border-2 border-purple-600 border-t-transparent animate-spin" />
        </div>
      </PageShell>
    );
  }

  return (
    <PageShell>
      {(showModal || editingEntry) && (
        <EntryModal
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

          <div className="px-4 py-2">
            <div className="flex items-center gap-3 mb-4">
              {selected.emoji && <span className="text-3xl">{selected.emoji}</span>}
              <div>
                <p className="text-base font-semibold text-gray-800">{selected.title}</p>
                <p className="text-xs text-gray-400 mt-0.5">
                  {formatDateRangeLong(selected.date, selected.metadata.endDate as string)}
                </p>
                <p className="text-xs text-gray-400">{ENTRY_TYPE_LABELS[selected.type]}</p>
              </div>
            </div>
            {selected.description && (
              <p className="text-sm text-gray-600 leading-relaxed">{selected.description}</p>
            )}
            {selected.author && (
              <p className="text-xs text-gray-300 mt-4">Ghi bởi {selected.author.name}</p>
            )}
          </div>
        </div>
      )}

      <div className="px-4 pt-6 pb-2">
        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">Nhật ký Khôi</h1>
            <p className="text-base text-gray-400 mt-0.5">Xin chào, {session?.user?.name} 👋</p>
          </div>
          <button
            onClick={() => signOut({ callbackUrl: "/login" })}
            className="text-sm text-gray-400 hover:text-gray-600 transition"
          >
            Đăng xuất
          </button>
        </div>

        {/* Hero card */}
        <div className="bg-purple-600 rounded-2xl p-5 mb-5 text-white">
          <div className="flex items-center gap-3">
            <div className="w-14 h-14 rounded-xl overflow-hidden flex-shrink-0 border-2 border-white/30">
              <img src="/khoi.jpg" alt="Khôi" className="w-full h-full object-cover object-top" />
            </div>
            <div>
              <p className="font-semibold text-xl leading-tight">Lê Minh Khôi</p>
              <p className="text-purple-200 text-sm mt-0.5">{getKhoiAge()} · Sinh 6/2/2022</p>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-4 gap-2 mb-6">
          {[
            { label: "Kỷ niệm", value: stats.memories, color: "text-coral-600" },
            { label: "Du lịch", value: stats.travel, color: "text-teal-600" },
            { label: "Kỹ năng", value: stats.skills, color: "text-purple-600" },
            { label: "Bạn bè", value: stats.friends, color: "text-pink-500" },
          ].map((s) => (
            <div key={s.label} className="bg-white rounded-xl p-3 border border-gray-100 text-center">
              <p className={`text-2xl font-semibold ${s.color}`}>{s.value}</p>
              <p className="text-xs text-gray-400 mt-0.5">{s.label}</p>
            </div>
          ))}
        </div>

        {/* Recent */}
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-base font-semibold text-gray-700">Gần đây</h2>
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-1 text-sm text-purple-600 font-medium"
          >
            <span className="text-base">+</span> Thêm mới
          </button>
        </div>

        {entries.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-100 p-8 text-center">
            <p className="text-3xl mb-2">📝</p>
            <p className="text-base text-gray-500">Chưa có ghi chép nào.</p>
            <button
              onClick={() => setShowModal(true)}
              className="mt-3 text-sm text-purple-600 font-medium"
            >
              Thêm kỷ niệm đầu tiên →
            </button>
          </div>
        ) : (
          <div className="space-y-2">
            {entries.map((entry) => (
              <div
                key={entry.id}
                className="bg-white rounded-xl border border-gray-100 overflow-hidden"
              >
                <button
                  onClick={() => setSelected(entry)}
                  className="w-full p-4 flex items-start gap-3 text-left active:bg-gray-50 transition"
                >
                  <div className={`w-11 h-11 rounded-xl ${TYPE_COLORS[entry.type] || "bg-gray-50"} flex items-center justify-center text-xl flex-shrink-0`}>
                    {entry.emoji || "📌"}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-base font-medium text-gray-800 leading-snug">{entry.title}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs text-gray-400">
                        {formatDateRange(entry.date, entry.metadata.endDate as string)}
                      </span>
                      <span className="text-xs text-gray-300">·</span>
                      <span className="text-xs text-gray-400">{ENTRY_TYPE_LABELS[entry.type]}</span>
                    </div>
                  </div>
                  {entry.images.length > 0 && (
                    <img src={entry.images[0]} alt="" className="w-12 h-12 rounded-lg object-cover flex-shrink-0" />
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
