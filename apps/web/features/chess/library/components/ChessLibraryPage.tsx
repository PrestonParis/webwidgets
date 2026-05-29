'use client';
import { useState } from 'react';
import Header from '@/features/ui/components/Header';
import { ImportModal } from '@/features/chess/library/components/ImportModal';
import ChessLibraryHeader from '@/features/chess/library/components/ChessLibraryHeader';
import ChessLibraryState from '@/features/chess/library/components/ChessLibraryState';
import ChessGamesTable from '@/features/chess/library/components/ChessGamesTable';
import { useChessGames } from '@/features/chess/library/hooks/useChessGames';
import { AnalysisBoard } from '@/features/chess/analysis/components/AnalysisBoard';

type LibraryTab = 'library' | 'analysis';

export default function ChessLibraryPage() {
    const [tab, setTab] = useState<LibraryTab>('library');
    const [showImport, setShowImport] = useState(false);
    const { games, loading, deletingId, handleImported, handleDelete } =
        useChessGames();

    return (
        <>
            <Header />
            <div className="p-8 max-w-5xl mx-auto">
                {/* Tab switcher */}
                <div className="flex items-center gap-1 bg-zinc-900 rounded-lg p-1 w-fit mb-6">
                    {(['library', 'analysis'] as LibraryTab[]).map((t) => (
                        <button
                            key={t}
                            onClick={() => setTab(t)}
                            className={`px-4 py-1.5 rounded-md text-sm font-medium capitalize transition-colors ${
                                tab === t
                                    ? 'bg-zinc-700 text-zinc-100'
                                    : 'text-zinc-500 hover:text-zinc-300'
                            }`}
                        >
                            {t}
                        </button>
                    ))}
                </div>

                {tab === 'library' && (
                    <>
                        <ChessLibraryHeader
                            onImport={() => setShowImport(true)}
                        />

                        <ChessLibraryState
                            loading={loading}
                            hasGames={games.length > 0}
                            onImport={() => setShowImport(true)}
                        />

                        {!loading && games.length > 0 && (
                            <ChessGamesTable
                                games={games}
                                deletingId={deletingId}
                                onDelete={(id) => {
                                    void handleDelete(id);
                                }}
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
                    </>
                )}

                {tab === 'analysis' && (
                    <div>
                        <div className="mb-6">
                            <h2 className="text-xl font-semibold text-zinc-100">
                                Analysis Board
                            </h2>
                            <p className="text-sm text-zinc-500 mt-1">
                                Free analysis — moves are saved to your browser
                                automatically.
                            </p>
                        </div>
                        <AnalysisBoard
                            storageKey="chess-library-analysis"
                            showExport
                        />
                    </div>
                )}
            </div>
        </>
    );
}
