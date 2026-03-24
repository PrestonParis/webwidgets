import { supabase } from "@/lib/supabase";
import { NextResponse } from "next/server";

export async function POST() {
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const now = new Date().toISOString();

    const { error } = await supabase
        .from("recovery_profiles")
        .upsert({
            user_id: user.id,
            start_time: now
        });

    if (error) return NextResponse.json({ error });

    return NextResponse.json({ success: true, start_time: now });
}