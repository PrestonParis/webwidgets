import { supabase } from "@/app/lib/supabase";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
    const body = await req.json();
    const { note } = body;

    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    // log relapse
    await supabase.from("relapses").insert({
        user_id: user.id,
        note
    });

    const now = new Date().toISOString();

    // reset streak
    await supabase
        .from("recovery_profiles")
        .update({ start_time: now })
        .eq("user_id", user.id);

    return NextResponse.json({ success: true, start_time: now });
}