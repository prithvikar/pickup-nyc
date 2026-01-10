import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { ProfileForm } from "./profile-form";

export default async function ProfilePage() {
    const supabase = await createClient();

    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
        redirect("/login");
    }

    const { data: profile } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();

    return (
        <div className="flex min-h-screen flex-col items-center p-4 pt-24 pb-24 bg-zinc-950">
            <div className="w-full max-w-md space-y-8">
                <div>
                    <h2 className="text-3xl font-bold text-tennis-green drop-shadow-[0_0_10px_rgba(204,255,0,0.3)]">
                        Player Profile
                    </h2>
                    <p className="mt-2 text-zinc-400">
                        Manage your identity on the court.
                    </p>
                </div>

                <div className="glassmorphism rounded-2xl p-6 border border-white/10">
                    <ProfileForm user={user} initialProfile={profile} />
                </div>

                <form action="/auth/signout" method="post">
                    <button className="w-full py-3 text-red-500 hover:text-red-400 text-sm font-semibold transition-colors">
                        Sign Out
                    </button>
                </form>
            </div>
        </div>
    );
}
