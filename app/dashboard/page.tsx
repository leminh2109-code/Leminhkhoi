"use client";

import { useEffect, useState } from "react";
import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { PageShell } from "@/components/PageShell";
import { EntryModal } from "@/components/EntryModal";
import { Entry } from "@/lib/types";
import { getKhoiAge, formatDateRange, formatDateRangeLong, ENTRY_TYPE_LABELS } from "@/lib/utils";
import { ImageLightbox } from "@/components/ImageLightbox";
import toast from "react-hot-toast";

const TYPE_COLORS: Record<string, string> = {
  MEMORY: "bg-amber-50",
  TRAVEL: "bg-teal-50",
  SKILL: "bg-purple-50",
  EDUCATION: "bg-purple-50",
  BOOK: "bg-orange-50",
  SCHOOL: "bg-blue-50",
  FRIEND: "bg-pink-50",
  HEALTH: "bg-green-50",
};

const TYPE_DOT: Record<string, string> = {
  MEMORY: "bg-amber-400",
  TRAVEL: "bg-teal-500",
  SKILL: "bg-purple-500",
  EDUCATION: "bg-purple-500",
  BOOK: "bg-orange-400",
  SCHOOL: "bg-blue-500",
  FRIEND: "bg-pink-400",
  HEALTH: "bg-green-500",
};

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [entries, setEntries] = useState<Entry[]>([]);
  const [allEntries, setAllEntries] = useState<Entry[]>([]);
  const [travelEntries, setTravelEntries] = useState<Entry[]>([]);
  const [showCountriesModal, setShowCountriesModal] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editingEntry, setEditingEntry] = useState<Entry | null>(null);
  const [selected, setSelected] = useState<Entry | null>(null);
  const [loading, setLoading] = useState(true);
  const [shareCopied, setShareCopied] = useState(false);
  const [lightbox, setLightbox] = useState<{ images: string[]; index: number } | null>(null);

  async function handleShare() {
    const url = `${window.location.origin}/family`;
    if (navigator.share) {
      try { await navigator.share({ title: "Nhật ký Khôi", url }); } catch {}
      return;
    }
    await navigator.clipboard.writeText(url);
    setShareCopied(true);
    setTimeout(() => setShareCopied(false), 2000);
  }

  useEffect(() => {
    if (status === "unauthenticated") router.push("/login");
  }, [status, router]);

  async function fetchEntries() {
    const [recentRes, allRes] = await Promise.all([
      fetch("/api/entries?limit=20"),
      fetch("/api/entries?limit=200"),
    ]);
    if (recentRes.ok) setEntries(await recentRes.json());
    if (allRes.ok) {
      const all = await allRes.json();
      setAllEntries(all);
      setTravelEntries(all.filter((e: Entry) => e.type === "TRAVEL"));
    }
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
    memories: allEntries.filter((e) => e.type === "MEMORY").length,
    travel: allEntries.filter((e) => e.type === "TRAVEL").length,
    skills: allEntries.filter((e) => e.type === "SKILL" || e.type === "EDUCATION").length,
    friends: allEntries.filter((e) => e.type === "FRIEND").length,
    countries: new Set(travelEntries.map((e) => String(e.metadata.country || "")).filter(Boolean)).size,
  };

  const countryBreakdown = travelEntries.reduce<Record<string, number>>((acc, e) => {
    const c = String(e.metadata.country || "").trim();
    if (c) acc[c] = (acc[c] || 0) + 1;
    return acc;
  }, {});

  // Entries with photos for carousel
  const photoEntries = entries.filter((e) => e.images.length > 0).slice(0, 10);

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

      {lightbox && <ImageLightbox images={lightbox.images} index={lightbox.index} onClose={() => setLightbox(null)} />}

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
            <button onClick={() => { setEditingEntry(selected); setSelected(null); }} className="text-sm text-purple-600 font-medium">Sửa</button>
            <button onClick={() => deleteEntry(selected.id)} className="text-sm text-red-400 font-medium">Xóa</button>
          </div>
          {selected.images.length > 0 && (
            <div className="overflow-x-auto scrollbar-hide flex gap-2 p-4">
              {selected.images.map((img, i) => (
                <img key={i} src={img} alt="" className="h-56 rounded-xl object-cover flex-shrink-0 cursor-zoom-in"
                  onClick={() => setLightbox({ images: selected.images, index: i })} />
              ))}
            </div>
          )}
          <div className="px-4 py-2">
            <div className="flex items-center gap-3 mb-4">
              {selected.emoji && <span className="text-3xl">{selected.emoji}</span>}
              <div>
                <p className="text-base font-semibold text-gray-800">{selected.title}</p>
                <p className="text-xs text-gray-400 mt-0.5">{formatDateRangeLong(selected.date, selected.metadata.endDate as string)}</p>
                <p className="text-xs text-gray-400">{ENTRY_TYPE_LABELS[selected.type]}</p>
              </div>
            </div>
            {selected.description && (
              <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-wrap">{selected.description}</p>
            )}
            {selected.author && <p className="text-xs text-gray-300 mt-4">Ghi bởi {selected.author.name}</p>}
          </div>
        </div>
      )}

      {/* Countries modal */}
      {showCountriesModal && (
        <div className="fixed inset-0 z-50 flex items-end bg-black/30" onClick={() => setShowCountriesModal(false)}>
          <div className="w-full bg-white rounded-t-2xl px-4 pt-3 pb-10 shadow-xl" onClick={(e) => e.stopPropagation()}>
            <div className="w-8 h-1 bg-gray-200 rounded-full mx-auto mb-4" />
            <h3 className="text-base font-semibold text-gray-800 mb-3">🌏 Quốc gia đã đến</h3>
            <div className="space-y-2">
              {Object.entries(countryBreakdown).sort((a, b) => b[1] - a[1]).map(([country, count]) => (
                <Link key={country} href={`/travel?country=${encodeURIComponent(country)}`}
                  onClick={() => setShowCountriesModal(false)}
                  className="flex items-center justify-between px-4 py-3 bg-gray-50 rounded-xl active:bg-gray-100 transition">
                  <span className="text-sm font-medium text-gray-700">{country}</span>
                  <span className="text-sm text-teal-600 font-semibold">{count} chuyến ›</span>
                </Link>
              ))}
            </div>
          </div>
        </div>
      )}

      <div className="pt-5 pb-2">
        {/* Header */}
        <div className="flex items-center justify-between px-4 mb-4">
          <div>
            <h1 className="text-xl font-bold text-gray-900">Nhật ký Khôi</h1>
            <p className="text-sm text-gray-400 mt-0.5">Xin chào, {session?.user?.name} 👋</p>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={handleShare} className="md:hidden flex items-center gap-1 text-sm text-purple-500 font-medium">
              <span>🔗</span>
              <span>{shareCopied ? "Đã copy!" : "Chia sẻ"}</span>
            </button>
            <button onClick={() => signOut({ callbackUrl: "/login" })} className="text-sm text-gray-400">
              Đăng xuất
            </button>
          </div>
        </div>

        {/* Hero card — photo + name + stats tất cả trong một */}
        <div className="mx-4 bg-[#534AB7] rounded-2xl overflow-hidden mb-5">
          <div className="flex items-center gap-3 px-4 pt-4 pb-3">
            <div className="w-16 h-16 rounded-2xl overflow-hidden flex-shrink-0 border-2 border-white/30 shadow-lg">
              <img src="/khoi-icon.png" alt="Khôi" className="w-full h-full object-cover object-top" />
            </div>
            <div className="text-white">
              <p className="font-bold text-lg leading-tight">Lê Minh Khôi</p>
              <p className="text-purple-200 text-sm mt-0.5">{getKhoiAge()}</p>
              <p className="text-purple-300 text-xs mt-0.5">Sinh 6/2/2022</p>
            </div>
          </div>

          {/* Stats row inside hero */}
          <div className="grid grid-cols-5 border-t border-white/10">
            {[
              { label: "Kỷ niệm", value: stats.memories, href: "/memories", onClick: undefined },
              { label: "Du lịch", value: stats.travel, href: "/travel", onClick: undefined },
              { label: "Kỹ năng", value: stats.skills, href: "/education", onClick: undefined },
              { label: "Bạn bè", value: stats.friends, href: "/friends", onClick: undefined },
              { label: "Quốc gia", value: stats.countries || "–", href: undefined, onClick: () => stats.countries > 0 && setShowCountriesModal(true) },
            ].map((s, i) => {
              const inner = (
                <div className="py-3 text-center">
                  <p className="text-white font-bold text-lg leading-none">{s.value}</p>
                  <p className="text-purple-300 text-[9px] mt-1 leading-tight">{s.label}</p>
                </div>
              );
              return s.href ? (
                <Link key={i} href={s.href} className={`${i > 0 ? "border-l border-white/10" : ""} active:bg-white/10 transition`}>
                  {inner}
                </Link>
              ) : (
                <button key={i} onClick={s.onClick} className={`${i > 0 ? "border-l border-white/10" : ""} active:bg-white/10 transition w-full`}>
                  {inner}
                </button>
              );
            })}
          </div>
        </div>

        {/* Photo carousel */}
        {photoEntries.length > 0 && (
          <div className="mb-5">
            <div className="flex items-center justify-between px-4 mb-2">
              <h2 className="text-sm font-semibold text-gray-700">📸 Ảnh gần đây</h2>
            </div>
            <div className="flex gap-2.5 overflow-x-auto scrollbar-hide px-4 pb-1">
              {photoEntries.map((entry) => (
                <button
                  key={entry.id}
                  onClick={() => setSelected(entry)}
                  className="flex-shrink-0 relative rounded-2xl overflow-hidden active:opacity-90 transition"
                  style={{ width: 120, height: 150 }}
                >
                  <img src={entry.images[0]} alt={entry.title} className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                  <div className="absolute bottom-0 left-0 right-0 p-2">
                    <p className="text-white text-[10px] font-medium leading-tight line-clamp-2">{entry.title}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Recent activity */}
        <div className="px-4">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-gray-700">🕐 Gần đây</h2>
            <button onClick={() => setShowModal(true)} className="text-sm text-purple-600 font-medium">
              + Thêm mới
            </button>
          </div>

          {entries.length === 0 ? (
            <div className="bg-white rounded-2xl border border-gray-100 p-8 text-center">
              <p className="text-3xl mb-2">📝</p>
              <p className="text-sm text-gray-400">Chưa có ghi chép nào.</p>
              <button onClick={() => setShowModal(true)} className="mt-3 text-sm text-purple-600 font-medium">
                Thêm kỷ niệm đầu tiên →
              </button>
            </div>
          ) : (
            <div className="space-y-1.5">
              {entries.map((entry) => (
                <button
                  key={entry.id}
                  onClick={() => setSelected(entry)}
                  className="w-full bg-white rounded-2xl border border-gray-100 p-3.5 flex items-center gap-3 text-left active:bg-gray-50 transition"
                >
                  {/* Type dot */}
                  <div className="flex flex-col items-center gap-1 flex-shrink-0 w-6">
                    <div className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${TYPE_DOT[entry.type] || "bg-gray-300"}`} />
                  </div>

                  {/* Emoji or thumbnail */}
                  {entry.images.length > 0 ? (
                    <img src={entry.images[0]} alt="" className="w-10 h-10 rounded-xl object-cover flex-shrink-0" />
                  ) : (
                    <div className={`w-10 h-10 rounded-xl ${TYPE_COLORS[entry.type] || "bg-gray-50"} flex items-center justify-center text-lg flex-shrink-0`}>
                      {entry.emoji || "📌"}
                    </div>
                  )}

                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-800 leading-snug truncate">{entry.title}</p>
                    <p className="text-[11px] text-gray-400 mt-0.5">
                      {formatDateRange(entry.date, entry.metadata.endDate as string)}
                      <span className="mx-1">·</span>
                      {ENTRY_TYPE_LABELS[entry.type]}
                    </p>
                  </div>

                  <svg className="w-3.5 h-3.5 text-gray-300 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </PageShell>
  );
}
