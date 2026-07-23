"use client";

import { useEffect, useState } from "react";
import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import { PageShell } from "@/components/PageShell";
import { EntryModal } from "@/components/EntryModal";
import { Entry } from "@/lib/types";
import { getKhoiAge, formatDate, ENTRY_TYPE_LABELS } from "@/lib/utils";

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [entries, setEntries] = useState<Entry[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === "unauthenticated") router.push("/login");
  }, [status, router]);

  async function fetchEntries() {
    const res = await fetch("/api/entries?limit=10");
    if (res.ok) setEntries(await res.json());
    setLoading(false);
  }

  useEffect(() => {
    if (status === "authenticated") fetchEntries();
  }, [status]);

  const stats = {
    memories: entries.filter((e) => e.type === "MEMORY").length,
    travel: entries.filter((e) => e.type === "TRAVEL").length,
    skills: entries.filter((e) => e.type === "SKILL" || e.type === "EDUCATION").length,
    books: entries.filter((e) => e.type === "BOOK").length,
  };

  const TYPE_COLORS: Record<string, string> = {
    MEMORY: "bg-coral-50",
    TRAVEL: "bg-teal-50",
    SKILL: "bg-purple-50",
    EDUCATION: "bg-purple-50",
    BOOK: "bg-amber-50",
    SCHOOL: "bg-purple-50",
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
      {showModal && (
        <EntryModal onClose={() => setShowModal(false)} onSaved={fetchEntries} />
      )}

      <div className="px-4 pt-6 pb-2">
        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <div>
            <h1 className="text-xl font-semibold text-gray-900">Nhật ký Khôi</h1>
            <p className="text-sm text-gray-400 mt-0.5">Xin chào, {session?.user?.name} 👋</p>
          </div>
          <button
            onClick={() => signOut({ callbackUrl: "/login" })}
            className="text-xs text-gray-400 hover:text-gray-600 transition"
          >
            Đăng xuất
          </button>
        </div>

        {/* Hero card */}
        <div className="bg-purple-600 rounded-2xl p-5 mb-5 text-white">
          <div className="flex items-center gap-3">
            <div className="w-14 h-14 rounded-xl bg-white/20 flex items-center justify-center text-3xl">
              👦
            </div>
            <div>
              <p className="font-semibold text-lg leading-tight">Lê Minh Khôi</p>
              <p className="text-purple-200 text-sm">{getKhoiAge()} · Sinh 6/2/2022</p>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-4 gap-2 mb-6">
          {[
            { label: "Kỷ niệm", value: stats.memories, color: "text-coral-600" },
            { label: "Du lịch", value: stats.travel, color: "text-teal-600" },
            { label: "Kỹ năng", value: stats.skills, color: "text-purple-600" },
            { label: "Sách", value: stats.books, color: "text-amber-400" },
          ].map((s) => (
            <div key={s.label} className="bg-white rounded-xl p-3 border border-gray-100 text-center">
              <p className={`text-xl font-semibold ${s.color}`}>{s.value}</p>
              <p className="text-[10px] text-gray-400 mt-0.5">{s.label}</p>
            </div>
          ))}
        </div>

        {/* Recent */}
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold text-gray-700">Gần đây</h2>
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-1 text-xs text-purple-600 font-medium"
          >
            <span className="text-base">+</span> Thêm mới
          </button>
        </div>

        {entries.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-100 p-8 text-center">
            <p className="text-3xl mb-2">📝</p>
            <p className="text-sm text-gray-500">Chưa có ghi chép nào.</p>
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
                className="bg-white rounded-xl border border-gray-100 p-4 flex items-start gap-3"
              >
                <div className={`w-10 h-10 rounded-xl ${TYPE_COLORS[entry.type] || "bg-gray-50"} flex items-center justify-center text-xl flex-shrink-0`}>
                  {entry.emoji || "📌"}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-800 leading-snug">{entry.title}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-[11px] text-gray-400">{formatDate(entry.date)}</span>
                    <span className="text-[11px] text-gray-300">·</span>
                    <span className="text-[11px] text-gray-400">{ENTRY_TYPE_LABELS[entry.type]}</span>
                  </div>
                </div>
                {entry.images.length > 0 && (
                  <img
                    src={entry.images[0]}
                    alt=""
                    className="w-12 h-12 rounded-lg object-cover flex-shrink-0"
                  />
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </PageShell>
  );
}
