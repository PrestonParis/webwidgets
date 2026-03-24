import { supabase } from "@/lib/supabase";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
    const body = await req.json();
    const { intensity, trigger, note } = body;

    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { error } = await supabase.from("urges").insert({
        user_id: user.id,
        intensity,
        trigger,
        note
    });

    if (error) return NextResponse.json({ error });

    return NextResponse.json({ success: true });
}