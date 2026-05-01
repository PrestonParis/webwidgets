import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/lib/db/supabase';
import type { ChessGame, GameVariation } from '@/features/chess/types/chess';

// Used by app/chess/[id]/ChessGamesView and chess/studies/[studyId]/page
// To be combined with useChessGames in future
export function useChessGame(id: string) {
    const [game, setGame] = useState<ChessGame | null>(null);
    const [_, setMoveIndex] = useState(0);
    const [variations, setVariations] = useState<GameVariation[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!id) return;
        async function load() {
            const [gameRes, varRes] = await Promise.all([
                supabase.from('chess_games').select('*').eq('id', id).single(),
                supabase
                    .from('chess_variations')
                    .select('*')
                    .eq('game_id', id)
                    .order('branch_move_index'),
            ]);
            if (gameRes.data) {
                setGame(gameRes.data as ChessGame);
                setMoveIndex(gameRes.data.current_move_index ?? 0);
            }
            if (varRes.data) setVariations(varRes.data as GameVariation[]);
            setLoading(false);

            await supabase
                .from('chess_games')
                .update({ last_viewed_at: new Date().toISOString() })
                .eq('id', id);
        }
        load();
    }, [id]);

    const persistMoveIndex = useCallback(
        async (index: number) => {
            if (!id) return;
            await supabase
                .from('chess_games')
                .update({ current_move_index: index })
                .eq('id', id);
        },
        [id],
    );

    const deleteVariation = useCallback(async (vid: string) => {
        await supabase.from('chess_variations').delete().eq('id', vid);
        setVariations((prev) => prev.filter((v) => v.id !== vid));
    }, []);

    const addVariation = useCallback((v: GameVariation) => {
        setVariations((prev) => [...prev, v]);
    }, []);

    return {
        game,
        variations,
        loading,
        persistMoveIndex,
        deleteVariation,
        addVariation,
    };
}
