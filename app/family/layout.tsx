export default function FamilyLayout({ children }: { children: React.ReactNode }) {
  return (
    <div style={{
      "--bg": "#111111",
      "--bg-card": "#1c1c1e",
      "--bg-card2": "#2c2c2e",
      "--text": "#ffffff",
      "--text-2": "#a1a1aa",
      "--text-3": "#71717a",
      "--border": "rgba(255,255,255,0.08)",
      "--border-2": "rgba(255,255,255,0.12)",
    } as React.CSSProperties}>
      {children}
    </div>
  );
}
