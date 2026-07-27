"use client";

import dynamic from "next/dynamic";
import { Entry } from "@/lib/types";

const WorldMapInner = dynamic(() => import("./WorldMapInner"), {
  ssr: false,
  loading: () => (
    <div className="h-[450px] bg-amber-50 rounded-xl flex items-center justify-center">
      <div className="w-6 h-6 rounded-full border-2 border-amber-700 border-t-transparent animate-spin" />
    </div>
  ),
});

interface Props {
  entries: Entry[];
  onLocationClick?: (loc: string) => void;
}

export function WorldMap({ entries, onLocationClick }: Props) {
  return <WorldMapInner entries={entries} onLocationClick={onLocationClick} />;
}
