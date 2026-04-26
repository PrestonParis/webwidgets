import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { CookieOptions } from '@supabase/ssr';

export async function GET() {
    const cookieStore = await cookies();
    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                get(name: string) {
                    return cookieStore.get(name)?.value;
                },
                set(name: string, value: string, options: CookieOptions) {
                    cookieStore.set(name, value, options);
                },
                remove(name: string, options: CookieOptions) {
                    cookieStore.set(name, '', { ...options, maxAge: 0 });
                },
            },
        },
    );

    const {
        data: { session },
    } = await supabase.auth.getSession();
    if (!session) return NextResponse.json(null, { status: 401 });

    // Most recently *viewed* game (falls back to most recently updated)
    const { data, error } = await supabase
        .from('chess_games')
        .select('*')
        .eq('user_id', session.user.id)
        .order('last_viewed_at', { ascending: false, nullsFirst: false })
        .limit(1)
        .maybeSingle();

    if (error) return NextResponse.json(null, { status: 500 });
    return NextResponse.json(data);
}
