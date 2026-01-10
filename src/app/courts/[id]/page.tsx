"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { COURTS, STATUS_COLORS } from "@/data/courts";
import { ArrowLeft, Loader2, MapPin, Clock } from "lucide-react";
import { clsx } from "clsx";
import { getCurrentPosition } from "@/lib/geolocation";
import { format, addHours, startOfHour, setHours } from "date-fns";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

// Generate 8 AM to 9 PM slots
const HOURS = Array.from({ length: 14 }, (_, i) => i + 8); // 8, 9, ... 21

interface Slot {
    id: string;
    court_number: number;
    start_time: string;
    status: "OPEN" | "TAKEN";
}

export default function CourtSchedulePage() {
    const params = useParams();
    const router = useRouter();
    const courtId = Number(params.id);
    const court = COURTS.find((c) => c.id === courtId);

    const [slots, setSlots] = useState<Slot[]>([]);
    const [loading, setLoading] = useState(true);
    const [processing, setProcessing] = useState<string | null>(null); // "courtNumer-hour" key
    const [error, setError] = useState<string | null>(null);

    // Today's date basic setup
    const today = new Date();
    const startOfDay = setHours(new Date(), 8); // 8 AM
    const endOfDay = setHours(new Date(), 22); // 10 PM (to include 9PM slot)

    useEffect(() => {
        if (!court) return;
        fetchSlots();
    }, [court]);

    const fetchSlots = async () => {
        try {
            const res = await fetch(`/api/schedule?courtId=${courtId}&startTime=${startOfDay.toISOString()}&endTime=${endOfDay.toISOString()}`);
            if (res.ok) {
                const data = await res.json();
                setSlots(data);
            }
        } catch (err) {
            console.error("Failed to fetch slots", err);
        } finally {
            setLoading(false);
        }
    };

    const handleSlotClick = async (courtNumber: number, hour: number, currentStatus: "OPEN" | "TAKEN") => {
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
                    courtId,
                    courtNumber,
                    startTime: startTime.toISOString(),
                    status: newStatus,
                    lat: position.latitude,
                    long: position.longitude,
                    courtLat: court!.location[0],
                    courtLong: court!.location[1],
                }),
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data.error || "Failed to update");

            // Optimistic update or refetch
            fetchSlots();

        } catch (err: any) {
            setError(err.message);
            setTimeout(() => setError(null), 3000);
        } finally {
            setProcessing(null);
        }
    };

    // Render Logic
    if (!court) return <div className="p-8 text-white">Court not found</div>;

    const getSlotStatus = (courtNum: number, hour: number): "OPEN" | "TAKEN" => {
        // Find if we have a record
        const timeCheck = setHours(new Date(), hour);
        timeCheck.setMinutes(0, 0, 0);
        const isoStart = timeCheck.toISOString();

        // Simple ISO string comparison might need care with timezones, 
        // but for MVP we assume matching logic on client/server or exact string match if carefully handled.
        // Better to compare timestamps.
        const found = slots.find(s => s.court_number === courtNum && new Date(s.start_time).getHours() === hour);
        return found ? found.status : "OPEN"; // Default to OPEN if no record
    };

    return (
        <div className="min-h-screen bg-zinc-950 pb-20">
            {/* Header */}
            <div className="sticky top-0 z-10 border-b border-white/10 bg-zinc-950/80 p-4 backdrop-blur-md">
                <div className="flex items-center space-x-4">
                    <Link href="/" className="rounded-full bg-zinc-800 p-2 text-white hover:bg-zinc-700">
                        <ArrowLeft size={20} />
                    </Link>
                    <div>
                        <h1 className="text-xl font-bold text-white leading-tight">{court.name}</h1>
                        <p className="text-xs text-zinc-400">Daily Schedule • {format(today, "EEE, MMM d")}</p>
                    </div>
                </div>

                {error && (
                    <div className="mt-2 text-xs text-red-400 animate-pulse bg-red-900/20 p-2 rounded">
                        {error}
                    </div>
                )}
            </div>

            {/* Grid Container */}
            <div className="overflow-x-auto p-4">
                <div className="min-w-[800px]"> {/* Force width to allow scrolling */}

                    {/* Column Headers (Courts) */}
                    <div className="mb-2 flex ml-[60px]"> {/* Margin left for Time column */}
                        {Array.from({ length: court.totalCourts }).map((_, i) => (
                            <div key={i} className="flex-1 text-center text-xs font-bold text-zinc-500 uppercase">
                                Ct {i + 1}
                            </div>
                        ))}
                    </div>

                    {/* Rows (Hours) */}
                    {HOURS.map((hour) => (
                        <div key={hour} className="flex items-stretch mb-2">
                            {/* Time Label */}
                            <div className="w-[60px] text-xs font-mono text-zinc-500 py-3 pr-2 text-right">
                                {format(setHours(new Date(), hour), "h a")}
                            </div>

                            {/* Slots */}
                            {Array.from({ length: court.totalCourts }).map((_, i) => {
                                const courtNum = i + 1;
                                const status = getSlotStatus(courtNum, hour);
                                const isProcessing = processing === `${courtNum}-${hour}`;
                                const isTaken = status === "TAKEN";

                                return (
                                    <button
                                        key={i}
                                        disabled={isProcessing}
                                        onClick={() => handleSlotClick(courtNum, hour, status)}
                                        className={clsx(
                                            "flex-1 mx-1 h-12 rounded-lg transition-all border flex items-center justify-center relative",
                                            isTaken
                                                ? "bg-red-500/10 border-red-500/30 text-red-500"
                                                : "bg-tennis-green/10 border-tennis-green/30 text-tennis-green hover:bg-tennis-green/20",
                                            isProcessing && "opacity-50 cursor-wait"
                                        )}
                                    >
                                        {isProcessing ? (
                                            <Loader2 size={14} className="animate-spin" />
                                        ) : (
                                            <span className="text-[10px] font-bold">
                                                {isTaken ? "TAKEN" : "OPEN"}
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
    );
}
