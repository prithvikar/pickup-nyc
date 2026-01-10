import { createClient } from "@/lib/supabase/server";
import { getCurrentPosition } from "@/lib/geolocation"; // You might need to move this logic or replicate it server-side if checking geofence here
import { NextRequest, NextResponse } from "next/server";

// GET: Fetch slots for a specific court and date range
export async function GET(request: NextRequest) {
    const searchParams = request.nextUrl.searchParams;
    const courtId = searchParams.get("courtId");
    const startTime = searchParams.get("startTime"); // ISO String
    const endTime = searchParams.get("endTime"); // ISO String

    if (!courtId || !startTime || !endTime) {
        return NextResponse.json({ error: "Missing parameters" }, { status: 400 });
    }

    const supabase = await createClient();

    // Use the RPC we defined
    const { data, error } = await supabase.rpc("get_court_schedule", {
        p_court_id: parseInt(courtId),
        p_start_time: startTime,
        p_end_time: endTime,
    });

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data);
}

// POST: Toggle a slot status
export async function POST(request: NextRequest) {
    const supabase = await createClient();

    // Auth check
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const body = await request.json();
        const { courtId, courtNumber, startTime, status, lat, long, courtLat, courtLong } = body;

        // Basic Geofence Check (100m) - Reusing logic concept from Reports
        // NOTE: Ideally we use a shared util for distance, but calculating here for simplicity
        const R = 6371e3; // metres
        const φ1 = lat * Math.PI / 180;
        const φ2 = courtLat * Math.PI / 180;
        const Δφ = (courtLat - lat) * Math.PI / 180;
        const Δλ = (courtLong - long) * Math.PI / 180;

        const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
            Math.cos(φ1) * Math.cos(φ2) *
            Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        const distance = R * c;

        // Allowing some buffer for testing, but typically 100m
        if (distance > 200) {
            return NextResponse.json({ error: `Too far away (${Math.round(distance)}m). Must be at the court.` }, { status: 403 });
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
