"use client";

import { useEffect, useState } from "react";
import { getKhoiAge, formatDateRange, formatDateRangeLong, ENTRY_TYPE_LABELS } from "@/lib/utils";
import { Entry } from "@/lib/types";

const TYPE_TABS = [
  { value: "", label: "Tất cả", emoji: "✨" },
  { value: "MEMORY", label: "Kỷ niệm", emoji: "💛" },
  { value: "TRAVEL", label: "Du lịch", emoji: "✈️" },
  { value: "EDUCATION", label: "Học tập", emoji: "📚" },
  { value: "SKILL", label: "Kỹ năng", emoji: "⭐" },
  { value: "SCHOOL", label: "Trường học", emoji: "🏫" },
  { value: "FRIEND", label: "Bạn bè", emoji: "👫" },
];

const TYPE_COLORS: Record<string, string> = {
  MEMORY: "bg-amber-50",
  TRAVEL: "bg-teal-50",
  EDUCATION: "bg-purple-50",
  SKILL: "bg-purple-50",
  SCHOOL: "bg-blue-50",
  FRIEND: "bg-pink-50",
  BOOK: "bg-orange-50",
};

export default function FamilyPage() {
  const [entries, setEntries] = useState<Entry[]>([]);
  const [tab, setTab] = useState("");
  const [selected, setSelected] = useState<Entry | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    const url = tab ? `/api/family?type=${tab}` : "/api/family";
    fetch(url)
      .then((r) => r.json())
      .then((data) => { setEntries(data); setLoading(false); });
  }, [tab]);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Detail overlay */}
      {selected && (
        <div className="fixed inset-0 z-50 bg-white overflow-y-auto">
          <div className="sticky top-0 bg-white border-b border-gray-100 px-4 py-4 flex items-center gap-3">
            <button onClick={() => setSelected(null)} className="text-gray-400 p-1">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <h2 className="text-base font-semibold text-gray-800 flex-1 truncate">{selected.title}</h2>
          </div>

          {selected.images.length > 0 && (
            <div className="overflow-x-auto flex gap-2 p-4">
              {selected.images.map((img, i) => (
                <img key={i} src={img} alt="" className="h-64 rounded-2xl object-cover flex-shrink-0 shadow-sm" />
              ))}
            </div>
          )}

          <div className="px-4 py-4">
            <div className="flex items-start gap-3 mb-4">
              {selected.emoji && <span className="text-4xl mt-1">{selected.emoji}</span>}
              <div>
                <p className="text-xl font-semibold text-gray-900 leading-snug">{selected.title}</p>
                <p className="text-sm text-gray-400 mt-1">
                  {formatDateRangeLong(selected.date, selected.metadata.endDate as string)}
                </p>
                <span className="inline-block mt-1 text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-500">
                  {ENTRY_TYPE_LABELS[selected.type]}
                </span>
              </div>
            </div>
            {selected.description && (
              <p className="text-base text-gray-700 leading-relaxed whitespace-pre-wrap">{selected.description}</p>
            )}
            <p className="text-xs text-gray-300 mt-6">Ghi bởi {selected.author.name}</p>
          </div>
        </div>
      )}

      {/* Hero header */}
      <div className="bg-[#534AB7] px-4 pt-10 pb-6">
        <div className="max-w-lg mx-auto">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-20 h-20 rounded-2xl overflow-hidden border-2 border-white/30 flex-shrink-0 shadow-lg">
              <img src="/khoi-icon.png" alt="Khôi" className="w-full h-full object-cover object-top" />
            </div>
            <div className="text-white">
              <p className="text-2xl font-bold leading-tight">Lê Minh Khôi</p>
              <p className="text-purple-200 text-sm mt-1">{getKhoiAge()} · Sinh 6/2/2022</p>
              <p className="text-purple-200 text-xs mt-0.5">Hà Nội, Việt Nam</p>
            </div>
          </div>
          <p className="text-purple-200 text-sm leading-relaxed">
            ✨ Đây là nhật ký hành trình lớn lên của Khôi — được Bố Mẹ lưu lại để chia sẻ cùng gia đình.
          </p>
        </div>
      </div>

      {/* Stats bar */}
      <div className="bg-white border-b border-gray-100 px-4 py-3">
        <div className="max-w-lg mx-auto flex items-center justify-around text-center">
          {[
            { label: "Kỷ niệm", value: entries.filter(e => e.type === "MEMORY").length, color: "text-amber-500" },
            { label: "Du lịch", value: entries.filter(e => e.type === "TRAVEL").length, color: "text-teal-500" },
            { label: "Học tập", value: entries.filter(e => ["EDUCATION","SKILL","SCHOOL"].includes(e.type)).length, color: "text-purple-500" },
            { label: "Bạn bè", value: entries.filter(e => e.type === "FRIEND").length, color: "text-pink-500" },
          ].map(s => (
            <div key={s.label}>
              <p className={`text-xl font-bold ${s.color}`}>{s.value}</p>
              <p className="text-xs text-gray-400">{s.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Tabs */}
      <div className="sticky top-0 z-10 bg-white border-b border-gray-100 shadow-sm">
        <div className="max-w-lg mx-auto overflow-x-auto scrollbar-hide flex gap-1 px-3 py-2">
          {TYPE_TABS.map(t => (
            <button
              key={t.value}
              onClick={() => setTab(t.value)}
              className={`flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                tab === t.value
                  ? "bg-[#534AB7] text-white"
                  : "bg-gray-100 text-gray-500 hover:bg-gray-200"
              }`}
            >
              <span>{t.emoji}</span>
              <span>{t.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Entries */}
      <div className="max-w-lg mx-auto px-4 py-4 pb-10">
        {loading ? (
          <div className="flex justify-center py-16">
            <div className="w-8 h-8 rounded-full border-2 border-[#534AB7] border-t-transparent animate-spin" />
          </div>
        ) : entries.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-3xl mb-2">📝</p>
            <p className="text-gray-400">Chưa có mục nào</p>
          </div>
        ) : (
          <div className="space-y-3">
            {entries.map((entry) => (
              <button
                key={entry.id}
                onClick={() => setSelected(entry)}
                className="w-full bg-white rounded-2xl border border-gray-100 overflow-hidden text-left active:bg-gray-50 transition shadow-sm"
              >
                <div className="flex items-start gap-3 p-4">
                  {entry.images.length > 0 ? (
                    <img
                      src={entry.images[0]}
                      alt=""
                      className="w-16 h-16 rounded-xl object-cover flex-shrink-0"
                    />
                  ) : (
                    <div className={`w-16 h-16 rounded-xl ${TYPE_COLORS[entry.type] || "bg-gray-50"} flex items-center justify-center text-3xl flex-shrink-0`}>
                      {entry.emoji || "📌"}
                    </div>
                  )}
                  <div className="flex-1 min-w-0 py-0.5">
                    <p className="text-base font-semibold text-gray-800 leading-snug">{entry.title}</p>
                    <p className="text-xs text-gray-400 mt-1">
                      {formatDateRange(entry.date, entry.metadata.endDate as string)}
                      {" · "}{ENTRY_TYPE_LABELS[entry.type]}
                    </p>
                    {entry.description && (
                      <p className="text-sm text-gray-500 mt-1.5 line-clamp-2 leading-relaxed">
                        {entry.description}
                      </p>
                    )}
                  </div>
                  <svg className="w-4 h-4 text-gray-300 flex-shrink-0 mt-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
                {entry.images.length > 1 && (
                  <div className="px-4 pb-3 flex gap-1.5">
                    {entry.images.slice(1, 4).map((img, i) => (
                      <img key={i} src={img} alt="" className="w-14 h-10 rounded-lg object-cover" />
                    ))}
                    {entry.images.length > 4 && (
                      <div className="w-14 h-10 rounded-lg bg-gray-100 flex items-center justify-center text-xs text-gray-400">
                        +{entry.images.length - 4}
                      </div>
                    )}
                  </div>
                )}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="text-center pb-8 px-4">
        <p className="text-xs text-gray-300">Nhật ký Khôi · Được tạo với yêu thương 💜</p>
      </div>
    </div>
  );
}
