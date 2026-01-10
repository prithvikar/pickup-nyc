"use client";

import { Court, STATUS_COLORS } from "@/data/courts";
import { X, Users, Locate, Loader2, Music } from "lucide-react";
import { clsx } from "clsx";
import { useState } from "react";
import { getCurrentPosition } from "@/lib/geolocation";
import { QueueList } from "./QueueList";
import { createClient } from "@/lib/supabase/client";

interface CourtDrawerProps {
    court: Court | null;
    onClose: () => void;
}

type DrawerMode = "DETAILS" | "REPORT" | "CHECKIN";

export function CourtDrawer({ court, onClose }: CourtDrawerProps) {
    const [mode, setMode] = useState<DrawerMode>("DETAILS");
    const [loadingMsg, setLoadingMsg] = useState<string | null>(null);
    const [errorMsg, setErrorMsg] = useState<string | null>(null);
    const [successMsg, setSuccessMsg] = useState<string | null>(null);

    if (!court) return null;

    const handleReport = async (status: string) => {
        setLoadingMsg("Verifying location...");
        setErrorMsg(null);
        setSuccessMsg(null);

        try {
            const position = await getCurrentPosition();

            setLoadingMsg("Submitting report...");
            const response = await fetch("/api/reports", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    courtId: court.id,
                    status,
                    latitude: position.latitude,
                    longitude: position.longitude,
                    courtLat: court.location[0],
                    courtLong: court.location[1],
                }),
            });

            const data = await response.json();
            if (!response.ok) throw new Error(data.error || "Failed to submit report");

            setSuccessMsg("Status updated! Thanks for contributing.");
            setTimeout(() => {
                setMode("DETAILS");
                setSuccessMsg(null);
            }, 2000);

        } catch (err: any) {
            setErrorMsg(err.message);
        } finally {
            setLoadingMsg(null);
        }
    };

    const handleCheckIn = async (status: "PLAYING" | "WAITING") => {
        setLoadingMsg("Checking you in...");
        setErrorMsg(null);
        try {
            const response = await fetch("/api/checkin", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    courtId: court.id,
                    status,
                    partySize: 1
                }),
            });

            const data = await response.json();
            if (!response.ok) throw new Error(data.error || "Check-in failed");

            setSuccessMsg("You're checked in!");
            setMode("DETAILS");
            setTimeout(() => setSuccessMsg(null), 3000);
        } catch (err: any) {
            setErrorMsg(err.message);
        } finally {
            setLoadingMsg(null);
        }
    };

    return (
        <div className="fixed inset-x-0 bottom-0 z-50 transition-transform duration-300 ease-out translate-y-0">
            <div className="mx-auto max-w-2xl rounded-t-3xl border-t border-white/10 bg-glass-black/95 backdrop-blur-2xl shadow-[0_-10px_40px_rgba(0,0,0,0.5)] p-6 pb-24 md:pb-6 max-h-[85vh] overflow-y-auto">

                <div className="mx-auto mb-6 h-1 w-12 rounded-full bg-zinc-700" />

                <div className="flex items-start justify-between">
                    <div>
                        <span className="text-xs font-bold uppercase tracking-wider text-zinc-500">
                            {court.borough}
                        </span>
                        <h2 className="text-2xl font-bold text-white tracking-tight">{court.name}</h2>
                    </div>
                    <button
                        onClick={() => {
                            setMode("DETAILS");
                            onClose();
                        }}
                        className="rounded-full bg-zinc-800 p-1 text-zinc-400 hover:bg-zinc-700 hover:text-white"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Status Badge */}
                <div className="mt-4 flex items-center space-x-3">
                    <div
                        className="flex items-center space-x-2 rounded-full px-3 py-1 text-sm font-bold text-black shadow-lg"
                        style={{ backgroundColor: STATUS_COLORS[court.status] }}
                    >
                        <span className="relative flex h-2 w-2">
                            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-black opacity-75"></span>
                            <span className="relative inline-flex h-2 w-2 rounded-full bg-black"></span>
                        </span>
                        <span>{court.status}</span>
                    </div>

                    <div className="flex items-center space-x-1 text-zinc-400 text-sm">
                        <Users size={16} />
                        <span>{court.activePlayers} players</span>
                    </div>
                </div>

                {/* Main Content Area */}
                <div className="mt-6">
                    {successMsg && (
                        <div className="mb-4 rounded-lg bg-green-500/10 p-3 text-sm text-green-400 border border-green-500/20 animate-in fade-in slide-in-from-top-2">
                            {successMsg}
                        </div>
                    )}

                    {errorMsg && (
                        <div className="mb-4 rounded-lg bg-red-500/10 p-3 text-sm text-red-400 border border-red-500/20 animate-in fade-in slide-in-from-top-2">
                            {errorMsg}
                        </div>
                    )}

                    {mode === "DETAILS" && (
                        <div className="animate-in fade-in slide-in-from-bottom-4">
                            <QueueList courtId={court.id} />

                            <div className="mt-6 grid grid-cols-2 gap-3">
                                <div className="rounded-xl border border-white/5 bg-white/5 p-3">
                                    <div className="text-xs text-zinc-500">Surface</div>
                                    <div className="font-medium text-white">{court.surface}</div>
                                </div>
                                <div className="rounded-xl border border-white/5 bg-white/5 p-3">
                                    <div className="text-xs text-zinc-500">Lights</div>
                                    <div className={clsx("font-medium", court.lights ? "text-tennis-green" : "text-zinc-600")}>
                                        {court.lights ? "Yes" : "No"}
                                    </div>
                                </div>
                            </div>

                            <div className="mt-6 flex flex-col gap-3">
                                <button
                                    onClick={() => setMode("CHECKIN")}
                                    className="w-full rounded-xl bg-tennis-green py-3.5 font-bold text-black shadow-[0_0_20px_rgba(204,255,0,0.2)] hover:shadow-[0_0_30px_rgba(204,255,0,0.4)] hover:scale-[1.02] transition-all active:scale-95"
                                >
                                    Check In Here
                                </button>
                                <button
                                    onClick={() => setMode("REPORT")}
                                    className="w-full rounded-xl bg-zinc-800 py-3.5 font-bold text-white shadow-lg hover:bg-zinc-700 transition-all border border-white/5"
                                >
                                    Report Status Update
                                </button>
                            </div>
                        </div>
                    )}

                    {mode === "REPORT" && (
                        <div className="animate-in fade-in slide-in-from-bottom-4">
                            <div className="mb-4 flex items-center justify-between">
                                <h3 className="text-lg font-bold text-white">Current Status?</h3>
                                <button onClick={() => setMode("DETAILS")} className="text-xs text-zinc-400 hover:text-white">Cancel</button>
                            </div>

                            {loadingMsg && (
                                <div className="mb-4 flex items-center justify-center space-x-2 rounded-lg bg-blue-500/10 p-3 text-blue-400">
                                    <Loader2 className="animate-spin" size={16} />
                                    <span className="text-sm">{loadingMsg}</span>
                                </div>
                            )}

                            <div className="grid grid-cols-2 gap-3">
                                {(["OPEN", "BUSY", "FULL", "CLOSED"] as const).map((status) => (
                                    <button
                                        key={status}
                                        disabled={!!loadingMsg}
                                        onClick={() => handleReport(status)}
                                        className="flex flex-col items-center justify-center rounded-xl border border-white/5 bg-zinc-900/50 p-4 transition-all hover:bg-zinc-800 hover:border-white/10 disabled:opacity-50"
                                    >
                                        <div
                                            className="mb-2 h-4 w-4 rounded-full shadow-[0_0_10px_currentColor]"
                                            style={{ color: STATUS_COLORS[status], backgroundColor: STATUS_COLORS[status] }}
                                        />
                                        <span className="text-sm font-bold text-zinc-300">{status}</span>
                                    </button>
                                ))}
                            </div>
                            <p className="mt-4 text-center text-[10px] text-zinc-600">
                                <Locate className="inline h-3 w-3 mr-1" />
                                GPS verification required (&lt; 100m)
                            </p>
                        </div>
                    )}

                    {mode === "CHECKIN" && (
                        <div className="animate-in fade-in slide-in-from-bottom-4">
                            <div className="mb-4 flex items-center justify-between">
                                <h3 className="text-lg font-bold text-white">Check In</h3>
                                <button onClick={() => setMode("DETAILS")} className="text-xs text-zinc-400 hover:text-white">Cancel</button>
                            </div>

                            {loadingMsg && (
                                <div className="mb-4 flex items-center justify-center space-x-2 rounded-lg bg-blue-500/10 p-3 text-blue-400">
                                    <Loader2 className="animate-spin" size={16} />
                                    <span className="text-sm">{loadingMsg}</span>
                                </div>
                            )}

                            <div className="grid grid-cols-2 gap-3">
                                <button
                                    disabled={!!loadingMsg}
                                    onClick={() => handleCheckIn("PLAYING")}
                                    className="flex flex-col items-center justify-center rounded-xl border border-tennis-green/20 bg-tennis-green/10 p-6 transition-all hover:bg-tennis-green/20 hover:border-tennis-green/40 disabled:opacity-50"
                                >
                                    <Music size={32} className="mb-3 text-tennis-green" />
                                    <span className="font-bold text-white">Playing Now</span>
                                    <span className="text-xs text-zinc-400 mt-1">I'm on a court</span>
                                </button>

                                <button
                                    disabled={!!loadingMsg}
                                    onClick={() => handleCheckIn("WAITING")}
                                    className="flex flex-col items-center justify-center rounded-xl border border-blue-500/20 bg-blue-500/10 p-6 transition-all hover:bg-blue-500/20 hover:border-blue-500/40 disabled:opacity-50"
                                >
                                    <Users size={32} className="mb-3 text-blue-400" />
                                    <span className="font-bold text-white">Waiting</span>
                                    <span className="text-xs text-zinc-400 mt-1">I'm in line</span>
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
