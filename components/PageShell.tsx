"use client";

import { NavBar } from "./NavBar";

export function PageShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-gray-50">
      <main className="max-w-lg mx-auto pb-24">{children}</main>
      <NavBar />
    </div>
  );
}
