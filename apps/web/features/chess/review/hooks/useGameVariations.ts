import { useState, useCallback } from 'react';
import { supabase } from '@/lib/db/supabase';
import { useAuthContext } from '@/features/auth/components/AuthContext';
import type { GameVariation } from '@/features/chess/types/variation';

export function useGameVariations(gameId: string) {
    const { user } = useAuthContext();
    const [variations, setVariations] = useState<GameVariation[]>([]);

    const deleteVariation = useCallback(async (vid: string) => {
        await supabase.from('chess_variations').delete().eq('id', vid);
        setVariations((prev) => prev.filter((v) => v.id !== vid));
    }, []);

    const addVariation = useCallback((v: GameVariation) => {
        setVariations((prev) => [...prev, v]);
    }, []);

    const createVariationFromMove = useCallback(
        async (
            branchIndex: number,
            pgn: string,
            startFen: string,
            title: string,
        ): Promise<GameVariation | null> => {
            if (!user?.id || !gameId) return null;
            const result = await supabase
                .from('chess_variations')
                .insert({
                    user_id: user.id,
                    game_id: gameId,
                    title,
                    pgn,
                    start_fen: startFen,
                    branch_move_index: branchIndex,
                    annotation: null,
                })
                .select()
                .single();
            if (result.error) return null;
            const variation = result.data as GameVariation;
            setVariations((prev) => [...prev, variation]);
            return variation;
        },
        [gameId, user],
    );

    const updateVariationAnnotation = useCallback(
        async (variationId: string, annotation: string) => {
            await supabase
                .from('chess_variations')
                .update({ annotation: annotation || null })
                .eq('id', variationId);
            setVariations((prev) =>
                prev.map((v) =>
                    v.id === variationId
                        ? { ...v, annotation: annotation || null }
                        : v,
                ),
            );
        },
        [],
    );

    return {
        variations,
        setVariations,
        deleteVariation,
        addVariation,
        createVariationFromMove,
        updateVariationAnnotation,
    };
}
