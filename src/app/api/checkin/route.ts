import { NextRequest, NextResponse } from "next/server";

// Check if Supabase is configured
const isSupabaseConfigured = () => {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    return url && !url.includes('your-project-ref') && url.startsWith('https://');
};

// In-memory mock storage for check-ins (persists during server session)
interface MockCheckIn {
    id: string;
    courtId: number;
    username: string;
    avatar_url: string | null;
    status: "PLAYING" | "WAITING";
    party_size: number;
    looking_for_game: boolean;
    created_at: string;
    is_current_user?: boolean;
}

const mockCheckIns: MockCheckIn[] = [];
let mockIdCounter = 1;

// POST: Create new check-in
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
            const newCheckin: MockCheckIn = {
                id: `mock-${mockIdCounter++}`,
                courtId,
                username: "You",
                avatar_url: null,
                status,
                party_size: partySize || 1,
                looking_for_game: lookingForGame || false,
                created_at: new Date().toISOString(),
                is_current_user: true
            };
            mockCheckIns.push(newCheckin);

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
        const queue = mockCheckIns
            .filter(c => c.courtId === parseInt(courtId))
            .map(c => ({ ...c, is_current_user: c.username === "You" }));
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

// PATCH: Update check-in status (WAITING -> PLAYING)
export async function PATCH(request: Request) {
    try {
        const body = await request.json();
        const { courtId, status } = body;

        if (!isSupabaseConfigured()) {
            console.log(`[MOCK] Status update: Court ${courtId} -> ${status}`);

            const checkin = mockCheckIns.find(c => c.username === "You" && c.courtId === courtId);
            if (checkin) {
                checkin.status = status;
            }
            return NextResponse.json({ success: true, message: "Status updated (mock mode)" });
        }

        const { createClient } = await import("@/lib/supabase/server");
        const supabase = await createClient();

        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        // Update user's check-in status
        const { error } = await supabase
            .from("checkins")
            .update({ status })
            .eq("user_id", user.id)
            .eq("court_id", courtId);

        if (error) throw error;

        return NextResponse.json({ success: true });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

// DELETE: Leave queue (remove check-in)
export async function DELETE(request: NextRequest) {
    const searchParams = request.nextUrl.searchParams;
    const courtId = searchParams.get("courtId");

    if (!courtId) {
        return NextResponse.json({ error: "Missing courtId" }, { status: 400 });
    }

    if (!isSupabaseConfigured()) {
        console.log(`[MOCK] Leave queue: Court ${courtId}`);

        const index = mockCheckIns.findIndex(c => c.username === "You" && c.courtId === parseInt(courtId));
        if (index >= 0) {
            mockCheckIns.splice(index, 1);
        }
        return NextResponse.json({ success: true, message: "Left queue (mock mode)" });
    }

    try {
        const { createClient } = await import("@/lib/supabase/server");
        const supabase = await createClient();

        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { error } = await supabase
            .from("checkins")
            .delete()
            .eq("user_id", user.id)
            .eq("court_id", parseInt(courtId));

        if (error) throw error;

        return NextResponse.json({ success: true });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
