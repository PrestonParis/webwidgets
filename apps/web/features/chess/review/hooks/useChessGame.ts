import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/lib/db/supabase';
import type { ChessGame } from '@/features/chess/types/chess';
import { useGameVariations } from './useGameVariations';

export function useChessGame(id: string) {
    const [game, setGame] = useState<ChessGame | null>(null);
    const [loading, setLoading] = useState(true);

    const {
        variations,
        setVariations,
        deleteVariation,
        addVariation,
        createVariationFromMove,
        updateVariationAnnotation,
    } = useGameVariations(id);

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
            }
            if (varRes.data)
                setVariations(
                    varRes.data as ReturnType<
                        typeof useGameVariations
                    >['variations'],
                );
            setLoading(false);
            await supabase
                .from('chess_games')
                .update({ last_viewed_at: new Date().toISOString() })
                .eq('id', id);
        }
        void load();
    }, [id, setVariations]);

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

    const updateGamePgn = useCallback(
        async (newPgn: string) => {
            if (!id) return;
            setGame((prev) => (prev ? { ...prev, pgn: newPgn } : prev));
            await supabase
                .from('chess_games')
                .update({ pgn: newPgn })
                .eq('id', id);
        },
        [id],
    );

    const updateGameTitle = useCallback(
        async (title: string) => {
            if (!id) return;
            setGame((prev) => (prev ? { ...prev, title } : prev));
            await supabase.from('chess_games').update({ title }).eq('id', id);
        },
        [id],
    );

    return {
        game,
        variations,
        loading,
        persistMoveIndex,
        updateGamePgn,
        updateGameTitle,
        deleteVariation,
        addVariation,
        createVariationFromMove,
        updateVariationAnnotation,
    };
}
