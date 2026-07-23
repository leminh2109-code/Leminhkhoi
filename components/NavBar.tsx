"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/dashboard", label: "Trang chủ", icon: "🏠" },
  { href: "/education", label: "Học tập", icon: "📚" },
  { href: "/travel", label: "Du lịch", icon: "✈️" },
  { href: "/memories", label: "Kỷ niệm", icon: "💛" },
];

export function NavBar() {
  const pathname = usePathname();

  return (
    <>
      {/* Desktop: sidebar */}
      <aside className="hidden md:flex fixed left-0 top-0 h-full w-56 flex-col bg-white border-r border-gray-100 z-50 py-8 px-4">
        <div className="mb-8 px-2">
          <div className="w-11 h-11 rounded-2xl bg-[#534AB7] flex items-center justify-center text-2xl mb-3">
            👶
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
                    ? "bg-purple-50 text-[#534AB7]"
                    : "text-gray-500 hover:bg-gray-50 hover:text-gray-700"
                )}
              >
                <span className="text-lg leading-none">{item.icon}</span>
                {item.label}
              </Link>
            );
          })}
        </nav>
      </aside>

      {/* Mobile: bottom nav */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 safe-bottom z-50">
        <div className="flex justify-around px-2 pt-2 pb-3">
          {navItems.map((item) => {
            const active = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex flex-col items-center gap-1 min-w-[60px] py-1 px-3 rounded-xl transition-colors",
                  active ? "text-[#534AB7]" : "text-gray-400 hover:text-gray-600"
                )}
              >
                <span className="text-xl leading-none">{item.icon}</span>
                <span className={cn("text-[10px] font-medium", active ? "text-[#534AB7]" : "text-gray-400")}>
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
