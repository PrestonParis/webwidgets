import { supabase } from '@/lib/db/supabase';
import { ChessGame } from '@/types/chess';

export const chessService = {
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
};
