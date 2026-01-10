import { NextResponse } from "next/server";

// Check if Supabase is configured
const isSupabaseConfigured = () => {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    return url && !url.includes('your-project-ref') && url.startsWith('https://');
};

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { courtId, status, partySize, lookingForGame } = body;

        // If Supabase isn't configured, return mock success
        if (!isSupabaseConfigured()) {
            console.log(`[MOCK] Check-in: Court ${courtId}, Status ${status}, LFG: ${lookingForGame}`);
            return NextResponse.json({ success: true, message: "Checked in (mock mode)" });
        }

        const { createClient } = await import("@/lib/supabase/server");
        const supabase = await createClient();

        // Check auth
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        // Call the RPC function 
        const { data, error } = await supabase.rpc("check_in", {
            p_court_id: courtId,
            p_status: status,
            p_party_size: partySize || 1,
            p_looking_for_game: lookingForGame || false
        });

        if (error) throw error;

        if (!data.success) {
            return NextResponse.json({ error: data.message }, { status: 400 });
        }

        return NextResponse.json(data);
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
