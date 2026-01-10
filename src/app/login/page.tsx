"use client";

import { createClient } from "@/lib/supabase/client";
import { useState } from "react";
import { Loader2 } from "lucide-react";

export default function LoginPage() {
    const [email, setEmail] = useState("");
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setMessage(null);

        const supabase = createClient();
        const { error } = await supabase.auth.signInWithOtp({
            email,
            options: {
                emailRedirectTo: `${window.location.origin}/auth/callback`,
            },
        });

        if (error) {
            setMessage({ type: "error", text: error.message });
        } else {
            setMessage({ type: "success", text: "Magic link sent! Check your email." });
        }
        setLoading(false);
    };

    return (
        <div className="flex min-h-screen items-center justify-center bg-zinc-950 p-4">
            <div className="glassmorphism w-full max-w-md rounded-2xl p-8 border border-white/10 shadow-2xl">
                <div className="mb-8 text-center">
                    <h1 className="text-3xl font-bold text-tennis-green drop-shadow-[0_0_10px_rgba(204,255,0,0.3)]">
                        Pickup NYC
                    </h1>
                    <p className="mt-2 text-zinc-400">Enter the court.</p>
                </div>

                <form onSubmit={handleLogin} className="space-y-6">
                    <div>
                        <label htmlFor="email" className="block text-sm font-medium text-zinc-300">
                            Email
                        </label>
                        <input
                            id="email"
                            type="email"
                            required
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="mt-2 block w-full rounded-lg border border-white/10 bg-black/50 px-4 py-3 text-white placeholder-zinc-500 focus:border-tennis-green focus:outline-none focus:ring-1 focus:ring-tennis-green transition-all"
                            placeholder="player@example.com"
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
                        className="group relative flex w-full justify-center rounded-lg bg-tennis-green px-4 py-3 text-sm font-bold text-black transition-all hover:bg-tennis-green/90 hover:shadow-[0_0_15px_rgba(204,255,0,0.4)] disabled:cursor-not-allowed disabled:opacity-50"
                    >
                        {loading ? <Loader2 className="animate-spin" /> : "Send Magic Link"}
                    </button>
                </form>

                <div className="mt-6 text-center text-xs text-zinc-600">
                    By continuing, you agree to our Terms of Service.
                </div>
            </div>
        </div>
    );
}
