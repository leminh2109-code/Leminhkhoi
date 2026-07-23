"use client";

import { NavBar } from "./NavBar";

export function PageShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-gray-50">
      <NavBar />
      {/* Mobile: pb-24 cho bottom nav. Desktop: ml-56 cho sidebar, pb-8 */}
      <main className="pb-24 md:ml-56 md:pb-8">
        <div className="max-w-lg mx-auto md:max-w-3xl md:mx-0 md:px-8">
          {children}
        </div>
      </main>
    </div>
  );
}
