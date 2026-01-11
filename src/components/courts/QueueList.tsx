"use client";

import { useEffect, useState, useCallback } from "react";
import { Loader2, User } from "lucide-react";

interface QueueItem {
    username: string;
    avatar_url: string | null;
    status: "PLAYING" | "WAITING";
    party_size: number;
    looking_for_game: boolean;
    created_at: string;
}

interface QueueListProps {
    courtId: number;
    refreshTrigger?: number;
}

export function QueueList({ courtId, refreshTrigger }: QueueListProps) {
    const [queue, setQueue] = useState<QueueItem[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchQueue = useCallback(async () => {
        setLoading(true);
        try {
            // Use API endpoint that works in both mock and real mode
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

        // Simple polling
        const interval = setInterval(fetchQueue, 10000);
        return () => clearInterval(interval);
    }, [fetchQueue, refreshTrigger]);

    if (loading && queue.length === 0) {
        return (
            <div className="flex h-20 items-center justify-center text-zinc-500">
                <Loader2 className="animate-spin" size={16} />
            </div>
        );
    }

    const playing = queue.filter(p => p.status === "PLAYING");
    const waiting = queue.filter(p => p.status === "WAITING");

    if (playing.length === 0 && waiting.length === 0) {
        return (
            <div className="py-8 text-center text-zinc-500">
                <p className="text-sm">No one is here yet.</p>
                <p className="text-xs">Be the first to check in!</p>
            </div>
        );
    }

    const renderItem = (item: QueueItem, index: number) => (
        <div key={index} className="flex items-center justify-between rounded-lg bg-white/5 p-2 px-3">
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
                        <div className="text-sm font-medium text-white">{item.username || "Anonymous"}</div>
                        {item.looking_for_game && (
                            <span className="relative flex h-2 w-2">
                                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-blue-400 opacity-75"></span>
                                <span className="relative inline-flex h-2 w-2 rounded-full bg-blue-500"></span>
                            </span>
                        )}
                    </div>
                    {item.party_size > 1 && (
                        <div className="text-[10px] text-zinc-400"> Party of {item.party_size}</div>
                    )}
                </div>
            </div>
            <div className="text-[10px] text-zinc-500 font-mono">
                {new Date(item.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </div>
        </div>
    );

    return (
        <div className="mt-4 space-y-4">
            {playing.length > 0 && (
                <div>
                    <h4 className="mb-2 text-xs font-bold uppercase tracking-wider text-tennis-green">On Court</h4>
                    <div className="space-y-2">
                        {playing.map(renderItem)}
                    </div>
                </div>
            )}

            {waiting.length > 0 && (
                <div>
                    <h4 className="mb-2 text-xs font-bold uppercase tracking-wider text-blue-400">Waiting List</h4>
                    <div className="space-y-2">
                        {waiting.map(renderItem)}
                    </div>
                </div>
            )}
        </div>
    );
}
