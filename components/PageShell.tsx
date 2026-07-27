"use client";

import { NavBar } from "./NavBar";

export function PageShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen" style={{ backgroundColor: "var(--bg)" }}>
      <NavBar />
      <main className="pb-32 md:ml-56 md:pb-8">
        <div className="max-w-lg mx-auto md:max-w-3xl md:mx-0 md:px-8">
          {children}
        </div>
      </main>
    </div>
  );
}
