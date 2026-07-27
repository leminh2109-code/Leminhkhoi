"use client";

import { useEffect, useRef, useState } from "react";
import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { PageShell } from "@/components/PageShell";
import { EntryModal } from "@/components/EntryModal";
import { Entry } from "@/lib/types";
import { getKhoiAge, formatDateRange, formatDateRangeLong, ENTRY_TYPE_LABELS, getTravelLocations } from "@/lib/utils";
import { ImageLightbox } from "@/components/ImageLightbox";
import toast from "react-hot-toast";

const TYPE_COLORS: Record<string, string> = {
  MEMORY: "bg-amber-50",
  TRAVEL: "bg-teal-50",
  SKILL: "bg-amber-50",
  EDUCATION: "bg-amber-50",
  BOOK: "bg-orange-50",
  SCHOOL: "bg-blue-50",
  FRIEND: "bg-pink-50",
  HEALTH: "bg-green-50",
};

const TYPE_DOT: Record<string, string> = {
  MEMORY: "bg-amber-400",
  TRAVEL: "bg-teal-500",
  SKILL: "bg-amber-500",
  EDUCATION: "bg-amber-500",
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

  const [coverImage, setCoverImage] = useState("/khoi1.jpeg");
  const [coverPos, setCoverPos] = useState({ x: 50, y: 0 });
  const [editingCover, setEditingCover] = useState(false);
  const coverFileRef = useRef<HTMLInputElement>(null);
  const dragRef = useRef<{ startX: number; startY: number; posX: number; posY: number } | null>(null);
  const coverPosRef = useRef({ x: 50, y: 0 });

  useEffect(() => {
    const img = localStorage.getItem("coverImage");
    const pos = localStorage.getItem("coverPos");
    if (img) setCoverImage(img);
    if (pos) {
      try {
        const p = JSON.parse(pos);
        setCoverPos(p);
        coverPosRef.current = p;
      } catch {}
    }
  }, []);

  async function handleCoverFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = "";
    const toastId = toast.loading("Đang tải ảnh...");
    const fd = new FormData();
    fd.append("file", file);
    const res = await fetch("/api/upload", { method: "POST", body: fd });
    if (res.ok) {
      const { url } = await res.json();
      const newPos = { x: 50, y: 30 };
      setCoverImage(url);
      setCoverPos(newPos);
      coverPosRef.current = newPos;
      localStorage.setItem("coverImage", url);
      localStorage.setItem("coverPos", JSON.stringify(newPos));
      setEditingCover(true);
      toast.success("Đã đổi ảnh bìa!", { id: toastId });
    } else {
      toast.error("Upload thất bại", { id: toastId });
    }
  }

  function onCoverDragStart(e: React.MouseEvent | React.TouchEvent) {
    const pt = "touches" in e ? e.touches[0] : e;
    dragRef.current = { startX: pt.clientX, startY: pt.clientY, posX: coverPosRef.current.x, posY: coverPosRef.current.y };
  }

  function onCoverDragMove(e: React.MouseEvent | React.TouchEvent) {
    if (!dragRef.current) return;
    const pt = "touches" in e ? e.touches[0] : e;
    const dx = pt.clientX - dragRef.current.startX;
    const dy = pt.clientY - dragRef.current.startY;
    const newX = Math.max(0, Math.min(100, dragRef.current.posX - dx * 0.15));
    const newY = Math.max(0, Math.min(100, dragRef.current.posY - dy * 0.15));
    const newPos = { x: newX, y: newY };
    coverPosRef.current = newPos;
    setCoverPos(newPos);
  }

  function onCoverDragEnd() {
    if (!dragRef.current) return;
    dragRef.current = null;
    localStorage.setItem("coverPos", JSON.stringify(coverPosRef.current));
  }

  function saveCoverPos() {
    dragRef.current = null;
    setEditingCover(false);
    localStorage.setItem("coverPos", JSON.stringify(coverPosRef.current));
  }

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

  const travelSlide = allEntries.filter((e) => e.type === "TRAVEL").slice(0, 10);
  const memoriesSlide = allEntries.filter((e) => e.type === "MEMORY").slice(0, 10);
  const educationSlide = allEntries
    .filter((e) => ["SKILL", "BOOK", "SCHOOL", "EDUCATION"].includes(e.type))
    .slice(0, 10);

  if (status === "loading" || loading) {
    return (
      <PageShell>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="w-8 h-8 rounded-full border-2 border-amber-700 border-t-transparent animate-spin" />
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
            <button onClick={() => { setEditingEntry(selected); setSelected(null); }} className="text-sm text-amber-700 font-medium">Sửa</button>
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

      {/* ── COVER IMAGE HERO ── */}
      <div
        className="relative w-full overflow-hidden select-none"
        style={{
          height: 220,
          cursor: editingCover ? "grab" : undefined,
          touchAction: editingCover ? "none" : undefined,
        }}
        onMouseDown={editingCover ? onCoverDragStart : undefined}
        onMouseMove={editingCover ? onCoverDragMove : undefined}
        onMouseUp={editingCover ? onCoverDragEnd : undefined}
        onMouseLeave={editingCover ? onCoverDragEnd : undefined}
        onTouchStart={editingCover ? onCoverDragStart : undefined}
        onTouchMove={editingCover ? onCoverDragMove : undefined}
        onTouchEnd={editingCover ? onCoverDragEnd : undefined}
      >
        <img
          src={coverImage}
          alt="cover"
          draggable={false}
          className="w-full h-full object-cover"
          style={{ objectPosition: `${coverPos.x}% ${coverPos.y}%` }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/20 to-transparent" />

        {/* Drag hint shown while repositioning */}
        {editingCover && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 pointer-events-none">
            <div className="bg-black/50 rounded-full px-4 py-2 text-white text-sm font-medium">
              ↔ Kéo để di chuyển ảnh
            </div>
          </div>
        )}

        {/* Top bar */}
        <div className="absolute top-0 left-0 right-0 flex items-center justify-between px-4 pt-12">
          <p className="text-white font-bold text-base tracking-wide">Nhật ký Khôi</p>
          {editingCover ? (
            <button
              onClick={(e) => { e.stopPropagation(); saveCoverPos(); }}
              className="bg-white text-gray-900 text-sm font-semibold rounded-full px-4 py-1.5 shadow-lg"
            >
              Xong
            </button>
          ) : (
            <div className="flex items-center gap-3">
              <button onClick={handleShare} className="text-amber-300 text-sm font-medium">
                {shareCopied ? "✓ Đã copy!" : "🔗 Chia sẻ"}
              </button>
              <button onClick={() => signOut({ callbackUrl: "/login" })} className="text-white/60 text-sm">
                Đăng xuất
              </button>
            </div>
          )}
        </div>

        {/* Profile + name + edit cover button at bottom */}
        {!editingCover && (
          <div className="absolute bottom-0 left-0 right-0 flex items-end gap-3 px-4 pb-4">
            <div className="w-14 h-14 rounded-full flex-shrink-0 overflow-hidden border-2 border-amber-400 shadow-lg">
              <img src="/khoi-icon.png" alt="Khôi" className="w-full h-full object-cover object-top" />
            </div>
            <div className="pb-0.5 flex-1">
              <p className="text-white font-bold text-lg leading-tight">Lê Minh Khôi</p>
              <p className="text-amber-300 text-xs mt-0.5">{getKhoiAge()} · Sinh 6/2/2022</p>
            </div>
            <button
              onClick={() => coverFileRef.current?.click()}
              className="flex-shrink-0 bg-black/40 backdrop-blur-sm text-white text-xs font-semibold rounded-full px-3 py-1.5 border border-white/30 active:scale-95 transition-transform"
            >
              📷 Đổi ảnh
            </button>
          </div>
        )}

        {/* Hidden file input */}
        <input
          ref={coverFileRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleCoverFile}
        />
      </div>

      <div className="pb-2">
        {/* Stats row — floating buttons */}
        <div className="flex gap-2 px-4 py-4">
          {[
            { label: "Kỷ niệm", value: stats.memories, href: "/memories", onClick: undefined },
            { label: "Du lịch", value: stats.travel, href: "/travel", onClick: undefined },
            { label: "Kỹ năng", value: stats.skills, href: "/education", onClick: undefined },
            { label: "Bạn bè", value: stats.friends, href: "/friends", onClick: undefined },
            { label: "Quốc gia", value: stats.countries || "–", href: undefined, onClick: () => stats.countries > 0 && setShowCountriesModal(true) },
          ].map((s, i) => {
            const inner = (
              <div className="flex flex-col items-center py-2.5 px-1">
                <p className="font-bold text-base leading-none text-amber-500">{s.value}</p>
                <p className="text-[9px] mt-1 leading-tight whitespace-nowrap" style={{ color: "var(--text-2)" }}>{s.label}</p>
              </div>
            );
            const cls = "flex-1 rounded-xl shadow-sm active:scale-95 transition-transform border";
            const style = { backgroundColor: "var(--bg-card)", borderColor: "var(--border-2)" };
            return s.href ? (
              <Link key={i} href={s.href} className={cls} style={style}>{inner}</Link>
            ) : (
              <button key={i} onClick={s.onClick} className={cls} style={style}>{inner}</button>
            );
          })}
        </div>

        {/* Du lịch carousel */}
        {travelSlide.length > 0 && (
          <div className="mb-5">
            <div className="flex items-center justify-between px-4 mb-2">
              <h2 className="text-sm font-semibold" style={{ color: "var(--text)" }}>✈️ Du lịch</h2>
              <Link href="/travel" className="text-xs text-teal-500 font-medium">Xem tất cả →</Link>
            </div>
            <div className="flex gap-2.5 overflow-x-auto scrollbar-hide px-4 pb-1">
              {travelSlide.map((entry) => (
                <button key={entry.id} onClick={() => setSelected(entry)}
                  className="flex-shrink-0 flex flex-col rounded-2xl overflow-hidden active:opacity-90 transition text-left border"
                  style={{ width: 130, backgroundColor: "var(--bg-card)", borderColor: "var(--border)" }}>
                  <div className="flex-shrink-0 bg-teal-900/20" style={{ height: 115 }}>
                    {entry.images[0]
                      ? <img src={entry.images[0]} alt={entry.title} className="w-full h-full object-cover" />
                      : <div className="w-full h-full flex items-center justify-center text-4xl">{entry.emoji || "🗺️"}</div>
                    }
                  </div>
                  <div className="px-2.5 pt-2 pb-2.5 flex flex-col gap-0.5">
                    <p className="text-[11px] font-semibold leading-snug line-clamp-2" style={{ color: "var(--text)" }}>{entry.title}</p>
                    {getTravelLocations(entry.metadata).length > 0 && (
                      <p className="text-teal-500 text-[9px] truncate">
                        📍 {getTravelLocations(entry.metadata).join(" · ")}
                      </p>
                    )}
                    <p className="text-[9px]" style={{ color: "var(--text-3)" }}>
                      {new Date(entry.date).toLocaleDateString("vi-VN", { month: "numeric", year: "numeric" })}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Kỷ niệm carousel */}
        {memoriesSlide.length > 0 && (
          <div className="mb-5">
            <div className="flex items-center justify-between px-4 mb-2">
              <h2 className="text-sm font-semibold" style={{ color: "var(--text)" }}>💛 Kỷ niệm</h2>
              <Link href="/memories" className="text-xs text-amber-500 font-medium">Xem tất cả →</Link>
            </div>
            <div className="flex gap-2.5 overflow-x-auto scrollbar-hide px-4 pb-1">
              {memoriesSlide.map((entry) => (
                <button key={entry.id} onClick={() => setSelected(entry)}
                  className="flex-shrink-0 flex flex-col rounded-2xl overflow-hidden active:opacity-90 transition text-left border"
                  style={{ width: 130, backgroundColor: "var(--bg-card)", borderColor: "var(--border)" }}>
                  <div className="flex-shrink-0 bg-amber-900/20" style={{ height: 115 }}>
                    {entry.images[0]
                      ? <img src={entry.images[0]} alt={entry.title} className="w-full h-full object-cover" />
                      : <div className="w-full h-full flex items-center justify-center text-4xl">{entry.emoji || "💛"}</div>
                    }
                  </div>
                  <div className="px-2.5 pt-2 pb-2.5 flex flex-col gap-0.5">
                    <p className="text-[11px] font-semibold leading-snug line-clamp-2" style={{ color: "var(--text)" }}>{entry.title}</p>
                    <p className="text-[9px]" style={{ color: "var(--text-3)" }}>
                      {new Date(entry.date).toLocaleDateString("vi-VN", { month: "numeric", year: "numeric" })}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Học tập carousel */}
        {educationSlide.length > 0 && (
          <div className="mb-5">
            <div className="flex items-center justify-between px-4 mb-2">
              <h2 className="text-sm font-semibold" style={{ color: "var(--text)" }}>📚 Học tập</h2>
              <Link href="/education" className="text-xs text-amber-500 font-medium">Xem tất cả →</Link>
            </div>
            <div className="flex gap-2.5 overflow-x-auto scrollbar-hide px-4 pb-1">
              {educationSlide.map((entry) => (
                <button key={entry.id} onClick={() => setSelected(entry)}
                  className="flex-shrink-0 rounded-2xl p-3 text-left transition flex flex-col gap-1.5 border"
                  style={{ width: 150, backgroundColor: "var(--bg-card)", borderColor: "var(--border)" }}>
                  <span className="text-2xl">{entry.emoji || "📌"}</span>
                  <p className="text-xs font-semibold leading-snug line-clamp-2" style={{ color: "var(--text)" }}>{entry.title}</p>
                  <p className="text-[10px] mt-auto" style={{ color: "var(--text-3)" }}>
                    {new Date(entry.date).toLocaleDateString("vi-VN", { month: "numeric", year: "numeric" })}
                  </p>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Recent activity */}
        <div className="px-4">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold" style={{ color: "var(--text)" }}>🕐 Gần đây</h2>
            <button onClick={() => setShowModal(true)} className="text-sm text-amber-500 font-medium">
              + Thêm mới
            </button>
          </div>

          {entries.length === 0 ? (
            <div className="rounded-2xl border p-8 text-center" style={{ backgroundColor: "var(--bg-card)", borderColor: "var(--border)" }}>
              <p className="text-3xl mb-2">📝</p>
              <p className="text-sm" style={{ color: "var(--text-2)" }}>Chưa có ghi chép nào.</p>
              <button onClick={() => setShowModal(true)} className="mt-3 text-sm text-amber-500 font-medium">
                Thêm kỷ niệm đầu tiên →
              </button>
            </div>
          ) : (
            <div className="space-y-1.5">
              {entries.map((entry) => (
                <button
                  key={entry.id}
                  onClick={() => setSelected(entry)}
                  className="w-full rounded-2xl border p-3.5 flex items-center gap-3 text-left transition"
                  style={{ backgroundColor: "var(--bg-card)", borderColor: "var(--border)" }}
                >
                  <div className="flex-shrink-0 w-6">
                    <div className={`w-2.5 h-2.5 rounded-full ${TYPE_DOT[entry.type] || "bg-gray-300"}`} />
                  </div>
                  {entry.images.length > 0 ? (
                    <img src={entry.images[0]} alt="" className="w-10 h-10 rounded-xl object-cover flex-shrink-0" />
                  ) : (
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center text-lg flex-shrink-0" style={{ backgroundColor: "var(--bg-card2)" }}>
                      {entry.emoji || "📌"}
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium leading-snug truncate" style={{ color: "var(--text)" }}>{entry.title}</p>
                    <p className="text-[11px] mt-0.5" style={{ color: "var(--text-3)" }}>
                      {formatDateRange(entry.date, entry.metadata.endDate as string)}
                      <span className="mx-1">·</span>
                      {ENTRY_TYPE_LABELS[entry.type]}
                    </p>
                  </div>
                  <svg className="w-3.5 h-3.5 flex-shrink-0" style={{ color: "var(--text-3)" }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
