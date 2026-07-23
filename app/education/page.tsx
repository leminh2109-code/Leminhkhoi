"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { PageShell } from "@/components/PageShell";
import { EntryModal } from "@/components/EntryModal";
import { Entry, EntryType } from "@/lib/types";
import { formatDateRange } from "@/lib/utils";
import toast from "react-hot-toast";

type Tab = "SKILL" | "BOOK" | "SCHOOL";

export default function EducationPage() {
  const { status } = useSession();
  const router = useRouter();
  const [entries, setEntries] = useState<Entry[]>([]);
  const [tab, setTab] = useState<Tab>("SKILL");
  const [showModal, setShowModal] = useState(false);
  const [defaultType, setDefaultType] = useState<EntryType>("SKILL");
  const [editingEntry, setEditingEntry] = useState<Entry | null>(null);

  useEffect(() => {
    if (status === "unauthenticated") router.push("/login");
  }, [status, router]);

  async function fetchEntries() {
    const res = await fetch("/api/entries");
    if (res.ok) {
      const all: Entry[] = await res.json();
      setEntries(all.filter((e) => ["SKILL", "BOOK", "SCHOOL", "EDUCATION"].includes(e.type)));
    }
  }

  useEffect(() => {
    if (status === "authenticated") fetchEntries();
  }, [status]);

  async function deleteEntry(id: string) {
    if (!window.confirm("Xóa mục này?")) return;
    const res = await fetch(`/api/entries/${id}`, { method: "DELETE" });
    if (res.ok) {
      toast.success("Đã xóa");
      fetchEntries();
    } else {
      toast.error("Xóa thất bại");
    }
  }

  const skills = entries.filter((e) => e.type === "SKILL");
  const books = entries.filter((e) => e.type === "BOOK");
  const schools = entries.filter((e) => e.type === "SCHOOL");

  const tabs: { id: Tab; label: string; emoji: string }[] = [
    { id: "SKILL", label: "Kỹ năng", emoji: "🎯" },
    { id: "BOOK", label: "Sách đã đọc", emoji: "📖" },
    { id: "SCHOOL", label: "Trường học", emoji: "🏫" },
  ];

  function openModal(type: EntryType) {
    setDefaultType(type);
    setShowModal(true);
  }

  const STATUS_COLOR: Record<string, string> = {
    DONE: "bg-teal-50 text-teal-600",
    IN_PROGRESS: "bg-amber-50 text-amber-400",
  };

  return (
    <PageShell>
      {(showModal || editingEntry) && (
        <EntryModal
          defaultType={defaultType}
          entry={editingEntry ?? undefined}
          onClose={() => { setShowModal(false); setEditingEntry(null); }}
          onSaved={fetchEntries}
        />
      )}

      <div className="px-4 pt-6">
        <div className="flex items-center justify-between mb-5">
          <h1 className="text-xl font-semibold text-gray-900">Học tập</h1>
          <button
            onClick={() => openModal(tab)}
            className="w-8 h-8 rounded-full bg-purple-600 text-white flex items-center justify-center text-lg font-light"
          >
            +
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-5 overflow-x-auto scrollbar-hide -mx-4 px-4">
          {tabs.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition flex-shrink-0 ${
                tab === t.id
                  ? "bg-purple-600 text-white"
                  : "bg-white text-gray-500 border border-gray-200"
              }`}
            >
              <span>{t.emoji}</span>
              {t.label}
            </button>
          ))}
        </div>

        {/* Skills */}
        {tab === "SKILL" && (
          <div className="space-y-3">
            {skills.length === 0 ? (
              <EmptyState emoji="🎯" text="Chưa có kỹ năng nào" onAdd={() => openModal("SKILL")} />
            ) : (
              skills.map((e) => {
                const skillStatus = (e.metadata.status as string) || "IN_PROGRESS";
                return (
                  <div key={e.id} className="bg-white rounded-xl border border-gray-100 overflow-hidden">
                    <div className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-3">
                          <span className="text-2xl">{e.emoji || "🎯"}</span>
                          <div>
                            <p className="text-sm font-medium text-gray-800">{e.title}</p>
                            <p className="text-xs text-gray-400 mt-0.5">
                              {formatDateRange(e.date, e.metadata.endDate as string)}
                            </p>
                          </div>
                        </div>
                        <span className={`text-[11px] font-medium px-2 py-0.5 rounded-full ${STATUS_COLOR[skillStatus] || "bg-gray-100 text-gray-500"}`}>
                          {skillStatus === "DONE" ? "Đã xong" : "Đang học"}
                        </span>
                      </div>
                      {e.description && (
                        <p className="text-xs text-gray-500 mt-2 leading-relaxed">{e.description}</p>
                      )}
                    </div>
                    <div className="flex border-t border-gray-50">
                      <button
                        onClick={() => setEditingEntry(e)}
                        className="flex-1 py-2 text-xs text-purple-500 font-medium hover:bg-purple-50 transition"
                      >
                        Sửa
                      </button>
                      <div className="w-px bg-gray-100" />
                      <button
                        onClick={() => deleteEntry(e.id)}
                        className="flex-1 py-2 text-xs text-red-400 font-medium hover:bg-red-50 transition"
                      >
                        Xóa
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}

        {/* Books */}
        {tab === "BOOK" && (
          <div className="space-y-3">
            {books.length === 0 ? (
              <EmptyState emoji="📖" text="Chưa có sách nào" onAdd={() => openModal("BOOK")} />
            ) : (
              books.map((e) => (
                <div key={e.id} className="bg-white rounded-xl border border-gray-100 overflow-hidden">
                  <div className="p-4 flex gap-3">
                    {e.images[0] ? (
                      <img src={e.images[0]} alt="" className="w-14 h-20 rounded-lg object-cover flex-shrink-0" />
                    ) : (
                      <div className="w-14 h-20 rounded-lg bg-amber-50 flex items-center justify-center text-2xl flex-shrink-0">
                        📚
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-800">{e.title}</p>
                      {!!e.metadata.bookAuthor && (
                        <p className="text-xs text-gray-400 mt-0.5">{String(e.metadata.bookAuthor)}</p>
                      )}
                      <p className="text-xs text-gray-400 mt-1">
                        {formatDateRange(e.date, e.metadata.endDate as string)}
                      </p>
                      {e.description && (
                        <p className="text-xs text-gray-500 mt-1.5 leading-relaxed line-clamp-2">{e.description}</p>
                      )}
                    </div>
                  </div>
                  <div className="flex border-t border-gray-50">
                    <button
                      onClick={() => setEditingEntry(e)}
                      className="flex-1 py-2 text-xs text-purple-500 font-medium hover:bg-purple-50 transition"
                    >
                      Sửa
                    </button>
                    <div className="w-px bg-gray-100" />
                    <button
                      onClick={() => deleteEntry(e.id)}
                      className="flex-1 py-2 text-xs text-red-400 font-medium hover:bg-red-50 transition"
                    >
                      Xóa
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* Schools */}
        {tab === "SCHOOL" && (
          <div className="space-y-3">
            {schools.length === 0 ? (
              <EmptyState emoji="🏫" text="Chưa có trường học nào" onAdd={() => openModal("SCHOOL")} />
            ) : (
              schools.map((e) => (
                <div key={e.id} className="bg-white rounded-xl border border-gray-100 overflow-hidden">
                  <div className="p-4">
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-xl bg-purple-50 flex items-center justify-center text-xl flex-shrink-0">
                        🏫
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-semibold text-gray-800">{e.title}</p>
                        {!!e.metadata.schoolName && (
                          <p className="text-xs text-gray-500 mt-0.5">{String(e.metadata.schoolName)}</p>
                        )}
                        {!!e.metadata.class && (
                          <p className="text-xs text-purple-500 mt-0.5">{String(e.metadata.class)}</p>
                        )}
                        <p className="text-xs text-gray-400 mt-1">
                          Từ {formatDateRange(e.date, e.metadata.endDate as string)}
                        </p>
                      </div>
                    </div>
                    {e.description && (
                      <p className="text-xs text-gray-500 mt-2 leading-relaxed">{e.description}</p>
                    )}
                  </div>
                  <div className="flex border-t border-gray-50">
                    <button
                      onClick={() => setEditingEntry(e)}
                      className="flex-1 py-2 text-xs text-purple-500 font-medium hover:bg-purple-50 transition"
                    >
                      Sửa
                    </button>
                    <div className="w-px bg-gray-100" />
                    <button
                      onClick={() => deleteEntry(e.id)}
                      className="flex-1 py-2 text-xs text-red-400 font-medium hover:bg-red-50 transition"
                    >
                      Xóa
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </PageShell>
  );
}

function EmptyState({ emoji, text, onAdd }: { emoji: string; text: string; onAdd: () => void }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-8 text-center">
      <p className="text-3xl mb-2">{emoji}</p>
      <p className="text-sm text-gray-400">{text}</p>
      <button onClick={onAdd} className="mt-3 text-sm text-purple-600 font-medium">
        Thêm ngay →
      </button>
    </div>
  );
}
