"use client";

import { useEffect, useState, useCallback } from "react";
import { Loader2, User, Play, LogOut, Clock } from "lucide-react";
import { clsx } from "clsx";

interface QueueItem {
    id?: string;
    username: string;
    avatar_url: string | null;
    status: "PLAYING" | "WAITING";
    party_size: number;
    looking_for_game: boolean;
    created_at: string;
    is_current_user?: boolean;
}

interface QueueListProps {
    courtId: number;
    refreshTrigger?: number;
    currentUserId?: string;
    onStatusChange?: () => void;
}

// Calculate relative time in minutes
function getWaitDuration(createdAt: string): string {
    const now = new Date();
    const created = new Date(createdAt);
    const diffMs = now.getTime() - created.getTime();
    const diffMins = Math.floor(diffMs / 60000);

    if (diffMins < 1) return "Just joined";
    if (diffMins === 1) return "1 min";
    if (diffMins < 60) return `${diffMins} min`;
    const hours = Math.floor(diffMins / 60);
    const mins = diffMins % 60;
    return `${hours}h ${mins}m`;
}

export function QueueList({ courtId, refreshTrigger, currentUserId, onStatusChange }: QueueListProps) {
    const [queue, setQueue] = useState<QueueItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState<string | null>(null);

    const fetchQueue = useCallback(async () => {
        setLoading(true);
        try {
            const res = await fetch(`/api/checkin?courtId=${courtId}`);
            if (res.ok) {
                const data = await res.json();
                setQueue(Array.isArray(data) ? data : []);
            }
        } catch (err) {
            console.warn("QueueList: Failed to fetch queue", err);
        } finally {
            setLoading(false);
        }
    }, [courtId]);

    useEffect(() => {
        fetchQueue();
        const interval = setInterval(fetchQueue, 10000);
        return () => clearInterval(interval);
    }, [fetchQueue, refreshTrigger]);

    const handleStatusChange = async (newStatus: "PLAYING" | "LEAVE") => {
        setActionLoading(newStatus);
        try {
            if (newStatus === "LEAVE") {
                await fetch(`/api/checkin?courtId=${courtId}`, { method: "DELETE" });
            } else {
                await fetch("/api/checkin", {
                    method: "PATCH",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ courtId, status: newStatus }),
                });
            }
            await fetchQueue();
            onStatusChange?.();
        } catch (err) {
            console.error("Failed to update status", err);
        } finally {
            setActionLoading(null);
        }
    };

    if (loading && queue.length === 0) {
        return (
            <div className="flex h-20 items-center justify-center text-zinc-500">
                <Loader2 className="animate-spin" size={16} />
            </div>
        );
    }

    const playing = queue.filter(p => p.status === "PLAYING");
    const waiting = queue.filter(p => p.status === "WAITING");

    // Check if current user is in the waiting list
    const currentUserInQueue = queue.find(p => p.is_current_user || p.username === "You");
    const isCurrentUserWaiting = currentUserInQueue?.status === "WAITING";

    if (playing.length === 0 && waiting.length === 0) {
        return (
            <div className="py-8 text-center text-zinc-500">
                <p className="text-sm">No one is here yet.</p>
                <p className="text-xs">Be the first to check in!</p>
            </div>
        );
    }

    const renderWaitingItem = (item: QueueItem, index: number) => {
        const isCurrentUser = item.is_current_user || item.username === "You";
        const position = index + 1;

        return (
            <div
                key={index}
                className={clsx(
                    "rounded-lg p-3 transition-all",
                    isCurrentUser
                        ? "bg-blue-500/10 border border-blue-500/30"
                        : "bg-white/5"
                )}
            >
                <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                        {/* Position Badge */}
                        <div className="flex h-7 w-7 items-center justify-center rounded-full bg-blue-500/20 text-xs font-bold text-blue-400">
                            #{position}
                        </div>

                        {/* Avatar */}
                        <div className="relative h-8 w-8 overflow-hidden rounded-full bg-zinc-800 border border-white/10">
                            {item.avatar_url ? (
                                <img src={item.avatar_url} alt={item.username} className="h-full w-full object-cover" />
                            ) : (
                                <div className="flex h-full w-full items-center justify-center text-zinc-500">
                                    <User size={14} />
                                </div>
                            )}
                        </div>

                        <div>
                            <div className="flex items-center space-x-2">
                                <div className="text-sm font-medium text-white">
                                    {item.username || "Anonymous"}
                                    {isCurrentUser && <span className="ml-1 text-blue-400">(You)</span>}
                                </div>
                                {item.looking_for_game && (
                                    <span className="relative flex h-2 w-2">
                                        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-blue-400 opacity-75"></span>
                                        <span className="relative inline-flex h-2 w-2 rounded-full bg-blue-500"></span>
                                    </span>
                                )}
                            </div>
                            {item.party_size > 1 && (
                                <div className="text-[10px] text-zinc-400">Party of {item.party_size}</div>
                            )}
                        </div>
                    </div>

                    {/* Wait Duration */}
                    <div className="flex items-center space-x-1 text-[10px] text-zinc-500">
                        <Clock size={10} />
                        <span>{getWaitDuration(item.created_at)}</span>
                    </div>
                </div>

                {/* Action Buttons for Current User */}
                {isCurrentUser && (
                    <div className="mt-3 flex gap-2">
                        <button
                            onClick={() => handleStatusChange("PLAYING")}
                            disabled={!!actionLoading}
                            className="flex-1 flex items-center justify-center gap-1.5 rounded-lg bg-tennis-green/20 py-2 text-xs font-bold text-tennis-green transition-all hover:bg-tennis-green/30 disabled:opacity-50"
                        >
                            {actionLoading === "PLAYING" ? (
                                <Loader2 size={12} className="animate-spin" />
                            ) : (
                                <Play size={12} />
                            )}
                            I'm Playing Now
                        </button>
                        <button
                            onClick={() => handleStatusChange("LEAVE")}
                            disabled={!!actionLoading}
                            className="flex-1 flex items-center justify-center gap-1.5 rounded-lg bg-zinc-700/50 py-2 text-xs font-bold text-zinc-300 transition-all hover:bg-zinc-700 disabled:opacity-50"
                        >
                            {actionLoading === "LEAVE" ? (
                                <Loader2 size={12} className="animate-spin" />
                            ) : (
                                <LogOut size={12} />
                            )}
                            Leave Queue
                        </button>
                    </div>
                )}
            </div>
        );
    };

    const renderPlayingItem = (item: QueueItem, index: number) => {
        const isCurrentUser = item.is_current_user || item.username === "You";

        return (
            <div
                key={index}
                className={clsx(
                    "flex items-center justify-between rounded-lg p-2 px-3",
                    isCurrentUser
                        ? "bg-tennis-green/10 border border-tennis-green/30"
                        : "bg-white/5"
                )}
            >
                <div className="flex items-center space-x-3">
                    <div className="relative h-8 w-8 overflow-hidden rounded-full bg-zinc-800 border border-white/10">
                        {item.avatar_url ? (
                            <img src={item.avatar_url} alt={item.username} className="h-full w-full object-cover" />
                        ) : (
                            <div className="flex h-full w-full items-center justify-center text-zinc-500">
                                <User size={14} />
                            </div>
                        )}
                    </div>
                    <div>
                        <div className="flex items-center space-x-2">
                            <div className="text-sm font-medium text-white">
                                {item.username || "Anonymous"}
                                {isCurrentUser && <span className="ml-1 text-tennis-green">(You)</span>}
                            </div>
                            {item.looking_for_game && (
                                <span className="relative flex h-2 w-2">
                                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-blue-400 opacity-75"></span>
                                    <span className="relative inline-flex h-2 w-2 rounded-full bg-blue-500"></span>
                                </span>
                            )}
                        </div>
                        {item.party_size > 1 && (
                            <div className="text-[10px] text-zinc-400">Party of {item.party_size}</div>
                        )}
                    </div>
                </div>
                <div className="text-[10px] text-zinc-500 font-mono">
                    {new Date(item.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </div>
            </div>
        );
    };

    return (
        <div className="mt-4 space-y-4">
            {playing.length > 0 && (
                <div>
                    <h4 className="mb-2 text-xs font-bold uppercase tracking-wider text-tennis-green">On Court</h4>
                    <div className="space-y-2">
                        {playing.map(renderPlayingItem)}
                    </div>
                </div>
            )}

            {waiting.length > 0 && (
                <div>
                    <h4 className="mb-2 text-xs font-bold uppercase tracking-wider text-blue-400">
                        Waiting List ({waiting.length})
                    </h4>
                    <div className="space-y-2">
                        {waiting.map(renderWaitingItem)}
                    </div>
                </div>
            )}
        </div>
    );
}
