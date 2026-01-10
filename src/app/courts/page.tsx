"use client";

import { useState } from "react";
import { COURTS, STATUS_COLORS } from "@/data/courts";
import { Users, MapPin, Calendar, ChevronDown, ChevronUp, Loader2 } from "lucide-react";
import { clsx } from "clsx";
import { getCurrentPosition } from "@/lib/geolocation";
import { format, setHours } from "date-fns";

const HOURS = Array.from({ length: 14 }, (_, i) => i + 8); // 8 AM to 9 PM

interface Slot {
    id: string;
    court_number: number;
    start_time: string;
    status: "OPEN" | "TAKEN";
}

export default function CourtsPage() {
    const [expandedCourtId, setExpandedCourtId] = useState<number | null>(null);
    const [slots, setSlots] = useState<Slot[]>([]);
    const [loadingSlots, setLoadingSlots] = useState(false);
    const [processing, setProcessing] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    const today = new Date();
    const startOfDay = setHours(new Date(), 8);
    const endOfDay = setHours(new Date(), 22);

    const toggleExpand = async (courtId: number) => {
        if (expandedCourtId === courtId) {
            setExpandedCourtId(null);
            setSlots([]);
            return;
        }

        setExpandedCourtId(courtId);
        setLoadingSlots(true);

        try {
            const res = await fetch(`/api/schedule?courtId=${courtId}&startTime=${startOfDay.toISOString()}&endTime=${endOfDay.toISOString()}`);
            if (res.ok) {
                const data = await res.json();
                setSlots(data);
            }
        } catch (err) {
            console.error("Failed to fetch slots", err);
        } finally {
            setLoadingSlots(false);
        }
    };

    const handleSlotClick = async (court: typeof COURTS[0], courtNumber: number, hour: number, currentStatus: "OPEN" | "TAKEN") => {
        const slotKey = `${courtNumber}-${hour}`;
        setProcessing(slotKey);
        setError(null);

        try {
            const position = await getCurrentPosition();
            const startTime = setHours(new Date(), hour);
            startTime.setMinutes(0, 0, 0);

            const newStatus = currentStatus === "OPEN" ? "TAKEN" : "OPEN";

            const res = await fetch("/api/schedule", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    courtId: court.id,
                    courtNumber,
                    startTime: startTime.toISOString(),
                    status: newStatus,
                    lat: position.latitude,
                    long: position.longitude,
                    courtLat: court.location[0],
                    courtLong: court.location[1],
                }),
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data.error || "Failed to update");

            // Refetch slots
            toggleExpand(court.id);
            toggleExpand(court.id);

        } catch (err: any) {
            setError(err.message);
            setTimeout(() => setError(null), 3000);
        } finally {
            setProcessing(null);
        }
    };

    const getSlotStatus = (courtNum: number, hour: number): "OPEN" | "TAKEN" => {
        const found = slots.find(s => s.court_number === courtNum && new Date(s.start_time).getHours() === hour);
        return found ? found.status : "OPEN";
    };

    return (
        <div className="min-h-screen w-full bg-zinc-950 px-4 py-8 pb-32">
            <h1 className="mb-8 text-3xl font-bold text-white tracking-tight">All Courts</h1>

            <div className="grid gap-4">
                {COURTS.map((court) => {
                    const isExpanded = expandedCourtId === court.id;

                    return (
                        <div
                            key={court.id}
                            className="relative overflow-hidden rounded-2xl border border-white/10 bg-white/5 transition-all"
                        >
                            {/* Header - Always visible */}
                            <button
                                onClick={() => toggleExpand(court.id)}
                                className="w-full p-5 text-left hover:bg-white/5 transition-colors"
                            >
                                <div className="flex items-start justify-between">
                                    <div>
                                        <div className="text-xs font-bold uppercase tracking-wider text-zinc-500 mb-1">
                                            {court.borough}
                                        </div>
                                        <h2 className="text-xl font-bold text-white mb-2">{court.name}</h2>
                                        <div className="flex items-center text-zinc-400 text-sm space-x-3">
                                            <span className="flex items-center">
                                                <MapPin size={14} className="mr-1" />
                                                {court.surface}
                                            </span>
                                            <span className="flex items-center">
                                                <Calendar size={14} className="mr-1" />
                                                {court.totalCourts} courts
                                            </span>
                                        </div>
                                    </div>

                                    <div className="flex items-center space-x-3">
                                        <div
                                            className="flex items-center space-x-2 rounded-full px-3 py-1 text-xs font-bold text-black"
                                            style={{ backgroundColor: STATUS_COLORS[court.status] }}
                                        >
                                            <div className="h-2 w-2 rounded-full bg-black animate-pulse" />
                                            <span>{court.status}</span>
                                        </div>
                                        {isExpanded ? <ChevronUp className="text-zinc-400" /> : <ChevronDown className="text-zinc-400" />}
                                    </div>
                                </div>

                                <div className="mt-4 flex items-center justify-between border-t border-white/5 pt-4">
                                    <div className="flex items-center text-zinc-400 text-sm">
                                        <Users size={16} className="mr-2" />
                                        <span>{court.activePlayers} players</span>
                                    </div>
                                    <span className="text-sm font-bold text-tennis-green">
                                        {isExpanded ? "Hide Schedule" : "View Schedule"}
                                    </span>
                                </div>
                            </button>

                            {/* Expandable Schedule Grid */}
                            {isExpanded && (
                                <div className="border-t border-white/10 p-4 bg-zinc-900/50 animate-in slide-in-from-top-2">
                                    <div className="mb-3 flex items-center justify-between">
                                        <h3 className="text-sm font-bold text-zinc-400 uppercase tracking-widest">
                                            Daily Schedule • {format(today, "EEE, MMM d")}
                                        </h3>
                                        {loadingSlots && <Loader2 size={16} className="animate-spin text-zinc-400" />}
                                    </div>

                                    {error && (
                                        <div className="mb-3 text-xs text-red-400 bg-red-900/20 p-2 rounded">
                                            {error}
                                        </div>
                                    )}

                                    <div className="overflow-x-auto">
                                        <div className="min-w-[500px]">
                                            {/* Column Headers */}
                                            <div className="mb-2 flex ml-[50px]">
                                                {Array.from({ length: court.totalCourts }).map((_, i) => (
                                                    <div key={i} className="flex-1 text-center text-[10px] font-bold text-zinc-500 uppercase">
                                                        Ct {i + 1}
                                                    </div>
                                                ))}
                                            </div>

                                            {/* Rows */}
                                            {HOURS.map((hour) => (
                                                <div key={hour} className="flex items-stretch mb-1">
                                                    <div className="w-[50px] text-[10px] font-mono text-zinc-500 py-2 pr-2 text-right">
                                                        {format(setHours(new Date(), hour), "h a")}
                                                    </div>

                                                    {Array.from({ length: court.totalCourts }).map((_, i) => {
                                                        const courtNum = i + 1;
                                                        const status = getSlotStatus(courtNum, hour);
                                                        const isProcessing = processing === `${courtNum}-${hour}`;
                                                        const isTaken = status === "TAKEN";

                                                        return (
                                                            <button
                                                                key={i}
                                                                disabled={isProcessing}
                                                                onClick={() => handleSlotClick(court, courtNum, hour, status)}
                                                                className={clsx(
                                                                    "flex-1 mx-0.5 h-8 rounded transition-all border flex items-center justify-center",
                                                                    isTaken
                                                                        ? "bg-red-500/10 border-red-500/30 text-red-500"
                                                                        : "bg-tennis-green/10 border-tennis-green/30 text-tennis-green hover:bg-tennis-green/20",
                                                                    isProcessing && "opacity-50 cursor-wait"
                                                                )}
                                                            >
                                                                {isProcessing ? (
                                                                    <Loader2 size={10} className="animate-spin" />
                                                                ) : (
                                                                    <span className="text-[8px] font-bold">
                                                                        {isTaken ? "X" : "•"}
                                                                    </span>
                                                                )}
                                                            </button>
                                                        );
                                                    })}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
