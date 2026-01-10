"use client";

import { COURTS, STATUS_COLORS } from "@/data/courts";
import { Users, MapPin } from "lucide-react";
import Link from "next/link";

export default function CourtsPage() {
    return (
        <div className="min-h-screen w-full bg-zinc-950 px-4 py-8 pb-32">
            <h1 className="mb-8 text-3xl font-bold text-white tracking-tight">All Courts</h1>

            <div className="grid gap-4">
                {COURTS.map((court) => (
                    <div key={court.id} className="relative overflow-hidden rounded-2xl border border-white/10 bg-white/5 p-5 transition-all hover:bg-white/10">
                        <div className="flex items-start justify-between">
                            <div>
                                <div className="text-xs font-bold uppercase tracking-wider text-zinc-500 mb-1">
                                    {court.borough}
                                </div>
                                <h2 className="text-xl font-bold text-white mb-2">{court.name}</h2>
                                <div className="flex items-center text-zinc-400 text-sm">
                                    <MapPin size={14} className="mr-1" />
                                    <span>{court.surface}</span>
                                </div>
                            </div>

                            <div
                                className="flex items-center space-x-2 rounded-full px-3 py-1 text-xs font-bold text-black"
                                style={{ backgroundColor: STATUS_COLORS[court.status] }}
                            >
                                <div className="h-2 w-2 rounded-full bg-black animate-pulse" />
                                <span>{court.status}</span>
                            </div>
                        </div>

                        <div className="mt-4 flex items-center justify-between border-t border-white/5 pt-4">
                            <div className="flex items-center text-zinc-400 text-sm">
                                <Users size={16} className="mr-2" />
                                <span>{court.activePlayers} players</span>
                            </div>

                            {/* In a real app, this might link to the map with this court selected */}
                            <Link
                                href="/"
                                className="text-sm font-bold text-tennis-green hover:underline"
                            >
                                View on Map &rarr;
                            </Link>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
