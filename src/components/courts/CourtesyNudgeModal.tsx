"use client";

import { useState, useEffect, useCallback } from "react";
import { Clock, Play, LogOut, X, AlertTriangle } from "lucide-react";
import { clsx } from "clsx";

interface CourtesyNudgeModalProps {
    isOpen: boolean;
    courtId: number;
    onStillWaiting: () => void;
    onPlayingNow: () => void;
    onLeaveQueue: () => void;
    onAutoRemove: () => void;
}

const NUDGE_TIMEOUT_MS = 2 * 60 * 1000; // 2 minutes

export function CourtesyNudgeModal({
    isOpen,
    courtId,
    onStillWaiting,
    onPlayingNow,
    onLeaveQueue,
    onAutoRemove
}: CourtesyNudgeModalProps) {
    const [timeLeft, setTimeLeft] = useState(NUDGE_TIMEOUT_MS);

    useEffect(() => {
        if (!isOpen) {
            setTimeLeft(NUDGE_TIMEOUT_MS);
            return;
        }

        const interval = setInterval(() => {
            setTimeLeft(prev => {
                if (prev <= 1000) {
                    clearInterval(interval);
                    onAutoRemove();
                    return 0;
                }
                return prev - 1000;
            });
        }, 1000);

        return () => clearInterval(interval);
    }, [isOpen, onAutoRemove]);

    if (!isOpen) return null;

    const seconds = Math.ceil(timeLeft / 1000);
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 pointer-events-auto">
            <div className="w-full max-w-sm transform rounded-2xl border border-yellow-500/30 bg-zinc-900 p-6 shadow-2xl animate-in zoom-in-95 fade-in duration-200">
                {/* Header */}
                <div className="flex items-center space-x-3 mb-4">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-yellow-500/20">
                        <AlertTriangle className="text-yellow-500" size={20} />
                    </div>
                    <div>
                        <h3 className="text-lg font-bold text-white">Still Waiting?</h3>
                        <p className="text-xs text-zinc-400">You've been in the queue for 45+ minutes</p>
                    </div>
                </div>

                {/* Timer */}
                <div className="mb-6 flex items-center justify-center space-x-2 rounded-lg bg-yellow-500/10 py-3 border border-yellow-500/20">
                    <Clock size={16} className="text-yellow-500" />
                    <span className="font-mono text-lg font-bold text-yellow-500">
                        {minutes}:{remainingSeconds.toString().padStart(2, '0')}
                    </span>
                    <span className="text-xs text-yellow-400">until auto-removal</span>
                </div>

                {/* Buttons */}
                <div className="space-y-2">
                    <button
                        onClick={onStillWaiting}
                        className="w-full flex items-center justify-center gap-2 rounded-xl bg-blue-500 py-3 font-bold text-white transition-all hover:bg-blue-600 active:scale-95"
                    >
                        <Clock size={16} />
                        Still Waiting
                    </button>

                    <button
                        onClick={onPlayingNow}
                        className="w-full flex items-center justify-center gap-2 rounded-xl bg-tennis-green py-3 font-bold text-black transition-all hover:bg-tennis-green/90 active:scale-95"
                    >
                        <Play size={16} />
                        I'm Playing Now
                    </button>

                    <button
                        onClick={onLeaveQueue}
                        className="w-full flex items-center justify-center gap-2 rounded-xl bg-zinc-800 py-3 font-bold text-zinc-300 transition-all hover:bg-zinc-700 active:scale-95"
                    >
                        <LogOut size={16} />
                        Leave Queue
                    </button>
                </div>

                {/* Policy reminder */}
                <p className="mt-4 text-center text-[10px] text-zinc-500">
                    If no action is taken, you'll be automatically removed from the queue to keep it accurate for others.
                </p>
            </div>
        </div>
    );
}
