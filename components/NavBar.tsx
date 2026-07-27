"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/dashboard", label: "Trang chủ", icon: "🏠" },
  { href: "/friends", label: "Bạn bè", icon: "👫" },
  { href: "/profile", label: "Cá nhân", icon: "👤" },
];

export function NavBar() {
  const pathname = usePathname();
  const [copied, setCopied] = useState(false);

  async function handleShare() {
    const url = `${window.location.origin}/family`;
    if (navigator.share) {
      try { await navigator.share({ title: "Nhật ký Khôi", url }); } catch {}
      return;
    }
    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <>
      {/* Desktop: sidebar */}
      <aside className="hidden md:flex fixed left-0 top-0 h-full w-56 flex-col bg-white border-r border-gray-100 z-50 py-8 px-4">
        <div className="mb-8 px-2">
          <div className="w-11 h-11 rounded-2xl overflow-hidden mb-3 flex-shrink-0">
            <img src="/khoi-icon.png" alt="Khôi" className="w-full h-full object-cover object-center" />
          </div>
          <p className="font-semibold text-gray-900 text-sm leading-tight">Nhật ký Khôi</p>
          <p className="text-xs text-gray-400 mt-0.5">Lê Minh Khôi</p>
        </div>

        <nav className="flex flex-col gap-1 flex-1">
          {navItems.map((item) => {
            const active = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors",
                  active
                    ? "bg-amber-50 text-amber-700"
                    : "text-gray-500 hover:bg-gray-50 hover:text-gray-700"
                )}
              >
                <span className="text-lg leading-none">{item.icon}</span>
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* Share button at bottom of sidebar */}
        <button
          onClick={handleShare}
          className="mt-4 flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm font-medium text-amber-700 hover:bg-amber-50 transition w-full"
        >
          <span className="text-lg leading-none">🔗</span>
          {copied ? "✓ Đã copy link!" : "Chia sẻ với gia đình"}
        </button>
      </aside>

      {/* Mobile: bottom nav */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-amber-100 z-50" style={{ paddingBottom: "env(safe-area-inset-bottom)" }}>
        <div className="flex justify-around px-2 pt-2 pb-2">
          {navItems.map((item) => {
            const active = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex flex-col items-center gap-0.5 flex-1 py-1.5 px-2 rounded-xl transition-colors",
                  active ? "text-amber-700" : "text-gray-400"
                )}
              >
                <span className="text-2xl leading-none">{item.icon}</span>
                <span className={cn("text-[10px] font-semibold leading-tight", active ? "text-amber-700" : "text-gray-400")}>
                  {item.label}
                </span>
              </Link>
            );
          })}
        </div>
      </nav>
    </>
  );
}
