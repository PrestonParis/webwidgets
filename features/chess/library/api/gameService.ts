import { supabase } from '@/lib/db/supabase';
import { ChessGame } from '@/features/chess/types/chess';

export const gameService = {
    async fetchGames() {
        const { data, error } = await supabase
            .from('chess_games')
            .select('*')
            .order('updated_at', { ascending: false });

        if (error) throw error;
        return (data as ChessGame[]) ?? [];
    },

    async deleteGame(id: string) {
        const { error } = await supabase
            .from('chess_games')
            .delete()
            .eq('id', id);

        if (error) throw error;
    },

    async importGame(userId: string, pgn: string, headers: Partial<ChessGame>) {
        const { data, error } = await supabase
            .from('chess_games')
            .insert({ user_id: userId, pgn, ...headers })
            .select()
            .single();

        if (error) throw error;
        return data as ChessGame;
    },
};
