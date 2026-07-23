"use client";

import { SessionProvider } from "next-auth/react";
import { Toaster } from "react-hot-toast";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      {children}
      <Toaster
        position="top-center"
        toastOptions={{
          style: { borderRadius: "12px", fontSize: "14px" },
          success: { iconTheme: { primary: "#0F6E56", secondary: "#fff" } },
        }}
      />
    </SessionProvider>
  );
}
