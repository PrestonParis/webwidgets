import { useState, useEffect, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { ChessGame } from '@/features/chess/types/chess';
import { gameService } from '@/features/chess/library/api/gameService';

// Used by app/chess/ChessPage.tsx to manage the list of games and related actions
// To be combined with useChessGame in guide page and game view into a single useChessController hook that manages all chess-related state and actions
export function useChessGames() {
    const router = useRouter();
    const [games, setGames] = useState<ChessGame[]>([]);
    const [loading, setLoading] = useState(true);
    const [deletingId, setDeletingId] = useState<string | null>(null);
    const [, startTransition] = useTransition();

    useEffect(() => {
        gameService
            .fetchGames()
            .then(setGames)
            .finally(() => setLoading(false));
    }, []);

    const handleImported = (game: ChessGame) => {
        setGames((prev) => [game, ...prev]);
        startTransition(() => router.push(`/chess/${game.id}`));
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Delete this game and all its variations?')) return;

        setDeletingId(id);
        try {
            await gameService.deleteGame(id);
            setGames((prev) => prev.filter((g) => g.id !== id));
        } catch (error) {
            console.error('Failed to delete game:', error);
        } finally {
            setDeletingId(null);
        }
    };

    return { games, loading, deletingId, handleImported, handleDelete };
}
