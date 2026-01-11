import { NextRequest, NextResponse } from "next/server";

// Check if Supabase is configured
const isSupabaseConfigured = () => {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    return url && !url.includes('your-project-ref') && url.startsWith('https://');
};

// In-memory mock storage for check-ins (persists during server session)
interface MockCheckIn {
    courtId: number;
    username: string;
    avatar_url: string | null;
    status: "PLAYING" | "WAITING";
    party_size: number;
    looking_for_game: boolean;
    created_at: string;
}

const mockCheckIns: MockCheckIn[] = [];

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { courtId, status, partySize, lookingForGame } = body;

        // If Supabase isn't configured, use mock storage
        if (!isSupabaseConfigured()) {
            console.log(`[MOCK] Check-in: Court ${courtId}, Status ${status}, LFG: ${lookingForGame}`);

            // Remove any existing check-in for this "user" (simulated single user)
            const existingIndex = mockCheckIns.findIndex(c => c.username === "You");
            if (existingIndex >= 0) {
                mockCheckIns.splice(existingIndex, 1);
            }

            // Add new check-in
            mockCheckIns.push({
                courtId,
                username: "You",
                avatar_url: null,
                status,
                party_size: partySize || 1,
                looking_for_game: lookingForGame || false,
                created_at: new Date().toISOString()
            });

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

// GET: Fetch queue for a court (mock mode support)
export async function GET(request: NextRequest) {
    const searchParams = request.nextUrl.searchParams;
    const courtId = searchParams.get("courtId");

    if (!courtId) {
        return NextResponse.json({ error: "Missing courtId" }, { status: 400 });
    }

    // If Supabase isn't configured, return mock data
    if (!isSupabaseConfigured()) {
        const queue = mockCheckIns.filter(c => c.courtId === parseInt(courtId));
        return NextResponse.json(queue);
    }

    try {
        const { createClient } = await import("@/lib/supabase/server");
        const supabase = await createClient();

        const { data, error } = await supabase.rpc("get_court_queue", {
            p_court_id: parseInt(courtId)
        });

        if (error) throw error;

        return NextResponse.json(data || []);
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
