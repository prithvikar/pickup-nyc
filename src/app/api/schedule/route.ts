import { NextRequest, NextResponse } from "next/server";

// Check if Supabase is configured
const isSupabaseConfigured = () => {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    return url && !url.includes('your-project-ref') && url.startsWith('https://');
};

// In-memory mock storage for demo purposes
const mockSlots: Map<string, "OPEN" | "TAKEN"> = new Map();

// GET: Fetch slots for a specific court and date range
export async function GET(request: NextRequest) {
    const searchParams = request.nextUrl.searchParams;
    const courtId = searchParams.get("courtId");
    const startTime = searchParams.get("startTime");
    const endTime = searchParams.get("endTime");

    if (!courtId || !startTime || !endTime) {
        return NextResponse.json({ error: "Missing parameters" }, { status: 400 });
    }

    // If Supabase isn't configured, return mock data from memory
    if (!isSupabaseConfigured()) {
        const mockData: any[] = [];
        // Return any slots we have in memory for this court
        mockSlots.forEach((status, key) => {
            if (key.startsWith(`${courtId}-`)) {
                const parts = key.split('-');
                mockData.push({
                    id: key,
                    court_id: parseInt(courtId),
                    court_number: parseInt(parts[1]),
                    start_time: parts.slice(2).join('-'), // Rejoin ISO time
                    status
                });
            }
        });
        return NextResponse.json(mockData);
    }

    try {
        const { createClient } = await import("@/lib/supabase/server");
        const supabase = await createClient();

        const { data, error } = await supabase.rpc("get_court_schedule", {
            p_court_id: parseInt(courtId),
            p_start_time: startTime,
            p_end_time: endTime,
        });

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json(data);
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}

// POST: Toggle a slot status
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { courtId, courtNumber, startTime, status, lat, long, courtLat, courtLong } = body;

        // Basic Geofence Check (200m for testing)
        const R = 6371e3;
        const φ1 = lat * Math.PI / 180;
        const φ2 = courtLat * Math.PI / 180;
        const Δφ = (courtLat - lat) * Math.PI / 180;
        const Δλ = (courtLong - long) * Math.PI / 180;

        const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
            Math.cos(φ1) * Math.cos(φ2) *
            Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        const distance = R * c;

        if (distance > 200) {
            return NextResponse.json({ error: `Too far away (${Math.round(distance)}m). Must be at the court.` }, { status: 403 });
        }

        // If Supabase isn't configured, use mock storage
        if (!isSupabaseConfigured()) {
            const key = `${courtId}-${courtNumber}-${startTime}`;
            mockSlots.set(key, status);
            return NextResponse.json({ success: true, data: { slot_id: key, status: 'mock' } });
        }

        const { createClient } = await import("@/lib/supabase/server");
        const supabase = await createClient();

        const { data: { user }, error: authError } = await supabase.auth.getUser();
        if (authError || !user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { data, error } = await supabase.rpc("toggle_court_slot", {
            p_court_id: courtId,
            p_court_number: courtNumber,
            p_start_time: startTime,
            p_status: status
        });

        if (error) throw error;

        return NextResponse.json({ success: true, data });

    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
