import { unstable_cache } from 'next/cache';
import { NextResponse } from 'next/server';
import { createClients } from '@/lib/supabase/serverClient';
import { getUserOrThrow } from '@/lib/supabase/getUser';
import { createAdminClient } from '@/lib/supabase/adminClient';
import type { ChessGame } from '@/features/chess/types/chess';

// Only the columns that compose ChessGame — avoids pulling full SELECT *
const CHESS_GAME_COLUMNS =
    'id, user_id, title, white, black, result, event, site, played_at, pgn, current_move_index, last_viewed_at, created_at, updated_at';

const getCachedLatestGame = unstable_cache(
    async (userId: string): Promise<ChessGame | null> => {
        const admin = createAdminClient();
        const { data } = await admin
            .from('chess_games')
            .select(CHESS_GAME_COLUMNS)
            .eq('user_id', userId)
            .order('last_viewed_at', { ascending: false, nullsFirst: false })
            .limit(1)
            .maybeSingle();
        return data as ChessGame | null;
    },
    ['chess-latest'],
    { revalidate: 30, tags: ['chess-latest'] },
);

export async function GET() {
    const { supabase } = await createClients();
    try {
        const user = await getUserOrThrow(supabase);
        const game = await getCachedLatestGame(user.id);
        return NextResponse.json(game);
    } catch {
        return NextResponse.json(null, { status: 401 });
    }
}
