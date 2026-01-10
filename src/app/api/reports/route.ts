import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
    const supabase = await createClient();

    // Check auth
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const body = await request.json();
        const { courtId, status, latitude, longitude, courtLat, courtLong } = body;

        // Call the RPC function we defined in the migration
        const { data, error } = await supabase.rpc("submit_report", {
            p_court_id: courtId,
            p_status: status,
            p_lat: latitude,
            p_long: longitude,
            p_court_lat: courtLat,
            p_court_long: courtLong,
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
