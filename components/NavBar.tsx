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
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 safe-bottom z-50">
      <div className="max-w-lg mx-auto flex justify-around px-2 pt-2 pb-3">
        {navItems.map((item) => {
          const active = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-col items-center gap-1 min-w-[60px] py-1 px-3 rounded-xl transition",
                active ? "text-purple-700" : "text-gray-400 hover:text-gray-600"
              )}
            >
              <span className="text-xl leading-none">{item.icon}</span>
              <span className={cn("text-[10px] font-medium", active ? "text-purple-700" : "text-gray-400")}>
                {item.label}
              </span>
              {active && <div className="absolute bottom-0 w-1 h-1 rounded-full bg-purple-600" />}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
