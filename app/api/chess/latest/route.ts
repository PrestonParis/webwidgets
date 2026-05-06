import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { CookieOptions } from '@supabase/ssr';
import type { ChessGame } from '@/features/chess/types/chess';
import { z } from 'zod';

const chessGameSchema = z.object({
    id: z.string(),
    user_id: z.string(),
    white: z.string(),
    black: z.string(),
    pgn: z.string(),
    result: z.string(),
    opening: z.string().nullable().optional(),
    event: z.string().nullable().optional(),
    site: z.string().nullable().optional(),
    utc_date: z.string().nullable().optional(),
    utc_time: z.string().nullable().optional(),
    time_control: z.string().nullable().optional(),
    eco: z.string().nullable().optional(),
    white_elo: z.number().nullable().optional(),
    black_elo: z.number().nullable().optional(),
    date_played: z.string().nullable().optional(),
    source: z.string().nullable().optional(),
    imported_at: z.string().nullable().optional(),
    created_at: z.string(),
    updated_at: z.string(),
    current_move_index: z.number().nullable().optional(),
    last_viewed_at: z.string().nullable().optional(),
});

const authResponseSchema = z.object({
    data: z.object({
        user: z.object({ id: z.string() }).nullable(),
    }),
});

const supabaseQuerySchema = z.object({
    data: z.unknown().nullable(),
    error: z.unknown().nullable(),
});

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

    const authResultUnknown: unknown = await supabase.auth.getUser();
    const authResult = authResponseSchema.safeParse(authResultUnknown);
    const user = authResult.success ? authResult.data.data.user : null;
    if (!user) return NextResponse.json(null, { status: 401 });

    // Most recently *viewed* game (falls back to most recently updated)
    const queryUnknown: unknown = await supabase
        .from('chess_games')
        .select('*')
        .eq('user_id', user.id)
        .order('last_viewed_at', { ascending: false, nullsFirst: false })
        .limit(1)
        .maybeSingle();
    const query = supabaseQuerySchema.safeParse(queryUnknown);
    const rawData = query.success ? query.data.data : null;
    const error = query.success
        ? query.data.error
        : { message: 'Invalid response' };
    const parsed = chessGameSchema.safeParse(rawData);
    const data: ChessGame | null = parsed.success
        ? (parsed.data as ChessGame)
        : null;

    if (error) return NextResponse.json(null, { status: 500 });
    return NextResponse.json(data);
}
