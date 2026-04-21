import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
    const { searchParams, origin } = new URL(request.url);
    const code = searchParams.get("code");
    const next = searchParams.get("next") ?? "/";
    const safeNext = next.startsWith("/") ? next : "/";

    if (code) {
        const cookieStore = await cookies();
        const supabase = createServerClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                getAll() {
                    return cookieStore.getAll();
                },
                setAll(cookiesToSet) {
                    try {
                    cookiesToSet.forEach(({ name, value, options }) =>
                        cookieStore.set(name, value, options)
                    );
                    } catch (err) {
                    console.error("Failed to set cookies:", err);
                    }
                },
            },
        }
        );
        // Exchange the auth code for a session (and set cookies)
        const { data, error } = await supabase.auth.exchangeCodeForSession(code);
        
        if (!error && data?.session) {
            const { provider_token, provider_refresh_token } = data.session;

            if (provider_token) {
                // Create a separate Supabase client with Service Role Key to store tokens securely
                const supabaseAdmin = createServerClient(
                    process.env.NEXT_PUBLIC_SUPABASE_URL!,
                    process.env.SUPABASE_SERVICE_ROLE_KEY!,
                    { cookies: { getAll() { return []; }, setAll() {} } }
                );

                // Store the Google tokens in your database
                await supabaseAdmin.from("user_tokens").upsert({
                    user_id: data.session.user.id,
                    access_token: provider_token,
                    refresh_token: provider_refresh_token ?? null,
                    updated_at: new Date().toISOString(),
                }, { onConflict: "user_id" });
            }
            return NextResponse.redirect(`${origin}${safeNext}`);
        }

        console.error("Auth exchange failed:", error?.message);
    }

    return NextResponse.redirect(`${origin}/auth/auth-code-error`);
}