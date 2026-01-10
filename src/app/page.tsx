"use client";

import dynamic from "next/dynamic";
import { useState } from "react";
import { CourtDrawer } from "@/components/courts/CourtDrawer";
import { Court } from "@/data/courts";

const Map = dynamic(() => import("@/components/map/Map"), {
  ssr: false,
  loading: () => (
    <div className="flex h-screen items-center justify-center bg-zinc-950 text-tennis-green font-mono">
      Initializing Map Systems...
    </div>
  ),
});

export default function Home() {
  const [selectedCourt, setSelectedCourt] = useState<Court | null>(null);

  return (
    <main className="relative h-screen w-full bg-zinc-950 overflow-hidden">
      <div className="absolute top-6 left-1/2 -translate-x-1/2 z-50 pointer-events-none">
        <h1 className="text-4xl font-bold tracking-tighter sm:text-5xl md:text-6xl text-tennis-green drop-shadow-[0_0_15px_rgba(204,255,0,0.5)] bg-black/20 backdrop-blur-sm px-6 py-2 rounded-full border border-white/10">
          Pickup NYC
        </h1>
      </div>

      <Map onSelectCourt={setSelectedCourt} />

      <CourtDrawer
        court={selectedCourt}
        onClose={() => setSelectedCourt(null)}
      />
    </main>
  );
}
