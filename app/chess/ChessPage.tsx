'use client';
import { useState, useEffect, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/app/lib/supabase';
import { ChessGame } from '@/types/chess';
import Header from '@/components/Global/Header';
import { ImportModal } from '@/components/Chess/ImportModal';
import ChessLibraryHeader from '@/components/Chess/ChessLibraryHeader';
import ChessLibraryState from '@/components/Chess/ChessLibraryState';
import ChessGamesTable from '@/components/Chess/ChessGamesTable';

export default function ChessLibraryPage() {
    const router = useRouter();
    const [games, setGames] = useState<ChessGame[]>([]);
    const [loading, setLoading] = useState(true);
    const [showImport, setShowImport] = useState(false);
    const [deletingId, setDeletingId] = useState<string | null>(null);
    const [, startTransition] = useTransition();

    useEffect(() => {
        supabase
            .from('chess_games')
            .select('*')
            .order('updated_at', { ascending: false })
            .then(({ data }) => {
                setGames((data as ChessGame[]) ?? []);
                setLoading(false);
            });
    }, []);

    const handleImported = (game: ChessGame) => {
        setGames((prev) => [game, ...prev]);
        // Navigate straight to the game
        startTransition(() => router.push(`/chess/${game.id}`));
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Delete this game and all its variations?')) return;
        setDeletingId(id);
        await supabase.from('chess_games').delete().eq('id', id);
        setGames((prev) => prev.filter((g) => g.id !== id));
        setDeletingId(null);
    };

    return (
        <>
            <Header />

            <div className="p-8 max-w-5xl mx-auto">
                <ChessLibraryHeader onImport={() => setShowImport(true)} />

                <ChessLibraryState
                    loading={loading}
                    hasGames={games.length > 0}
                    onImport={() => setShowImport(true)}
                />

                {!loading && games.length > 0 && (
                    <ChessGamesTable
                        games={games}
                        deletingId={deletingId}
                        onDelete={handleDelete}
                    />
                )}

                {showImport && (
                    <ImportModal
                        onClose={() => setShowImport(false)}
                        onImported={handleImported}
                    />
                )}
            </div>
        </>
    );
}
