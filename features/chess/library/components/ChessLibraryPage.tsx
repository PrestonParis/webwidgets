'use client';
import { useState } from 'react';
import Header from '@/features/ui/components/Header';
import { ImportModal } from '@/features/chess/library/components/ImportModal';
import ChessLibraryHeader from '@/features/chess/library/components/ChessLibraryHeader';
import ChessLibraryState from '@/features/chess/library/components/ChessLibraryState';
import ChessGamesTable from '@/features/chess/library/components/ChessGamesTable';
import { useChessGames } from '@/features/chess/library/hooks/useChessGames';

export default function ChessLibraryPage() {
    const [showImport, setShowImport] = useState(false);
    const { games, loading, deletingId, handleImported, handleDelete } =
        useChessGames();

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
                        onImported={(game) => {
                            setShowImport(false);
                            handleImported(game);
                        }}
                    />
                )}
            </div>
        </>
    );
}
