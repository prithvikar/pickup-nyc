"use client";

import { createClient } from "@/lib/supabase/client";
import { useState } from "react";
import { Loader2 } from "lucide-react";
import { User } from "@supabase/supabase-js";

export function ProfileForm({ user, initialProfile }: { user: User; initialProfile: any }) {
    const [username, setUsername] = useState(initialProfile?.username || "");
    const [avatarUrl, setAvatarUrl] = useState(initialProfile?.avatar_url || "");
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

    const updateProfile = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setMessage(null);

        const supabase = createClient();
        const updates = {
            id: user.id,
            username,
            avatar_url: avatarUrl,
            updated_at: new Date().toISOString(),
        };

        const { error } = await supabase.from("profiles").upsert(updates);

        if (error) {
            setMessage({ type: "error", text: error.message });
        } else {
            setMessage({ type: "success", text: "Profile updated successfully!" });
        }
        setLoading(false);
    };

    return (
        <form onSubmit={updateProfile} className="space-y-6">
            <div>
                <label htmlFor="email" className="block text-sm font-medium text-zinc-500">
                    Email
                </label>
                <input
                    id="email"
                    type="text"
                    value={user.email}
                    disabled
                    className="mt-1 block w-full rounded-lg border border-white/5 bg-white/5 px-4 py-3 text-zinc-500 cursor-not-allowed"
                />
            </div>

            <div>
                <label htmlFor="username" className="block text-sm font-medium text-zinc-300">
                    Username
                </label>
                <input
                    id="username"
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="mt-1 block w-full rounded-lg border border-white/10 bg-black/50 px-4 py-3 text-white placeholder-zinc-500 focus:border-tennis-green focus:outline-none focus:ring-1 focus:ring-tennis-green transition-all"
                />
            </div>

            <div>
                <label htmlFor="avatar_url" className="block text-sm font-medium text-zinc-300">
                    Avatar URL
                </label>
                <input
                    id="avatar_url"
                    type="text"
                    value={avatarUrl}
                    onChange={(e) => setAvatarUrl(e.target.value)}
                    className="mt-1 block w-full rounded-lg border border-white/10 bg-black/50 px-4 py-3 text-white placeholder-zinc-500 focus:border-tennis-green focus:outline-none focus:ring-1 focus:ring-tennis-green transition-all"
                    placeholder="https://example.com/me.jpg"
                />
            </div>


            {message && (
                <div
                    className={`rounded-lg p-3 text-sm ${message.type === "success"
                            ? "bg-green-500/10 text-green-400 border border-green-500/20"
                            : "bg-red-500/10 text-red-400 border border-red-500/20"
                        }`}
                >
                    {message.text}
                </div>
            )}

            <button
                type="submit"
                disabled={loading}
                className="flex w-full justify-center rounded-lg bg-white px-4 py-3 text-sm font-bold text-black transition-all hover:bg-zinc-200 disabled:opacity-50"
            >
                {loading ? <Loader2 className="animate-spin" /> : "Update Profile"}
            </button>
        </form>
    );
}
