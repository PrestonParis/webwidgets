'use client';
import { useState, useEffect, useTransition } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { supabase } from '@/app/lib/supabase';
import { ChessGame } from '@/types/chess';
import { Chess } from 'chess.js';
import Header from '@/components/Global/Header';

// ─── PGN parser: extract headers + validate ───────────────────────────────────
function parsePgnHeaders(pgn: string): Partial<ChessGame> {
    const get = (tag: string) => {
        const m = pgn.match(new RegExp(`\\[${tag}\\s+"([^"]*)"\\]`));
        return m?.[1] ?? null;
    };
    return {
        white: get('White') || 'White',
        black: get('Black') || 'Black',
        result: get('Result') || null,
        event: get('Event') || null,
        site: get('Site') || null,
        played_at:
            get('Date')?.replace(/\./g, '-').replace(/\?/g, '01') || null,
    };
}

function validatePgn(pgn: string): string | null {
    try {
        const chess = new Chess();
        chess.loadPgn(pgn);
        return null; // valid
    } catch (e) {
        return (e as Error).message;
    }
}

// ─── Import Modal ─────────────────────────────────────────────────────────────
function ImportModal({
    onClose,
    onImported,
}: {
    onClose: () => void;
    onImported: (game: ChessGame) => void;
}) {
    const [pgn, setPgn] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [saving, setSaving] = useState(false);

    const handleImport = async () => {
        const trimmed = pgn.trim();
        if (!trimmed) {
            setError('Paste a PGN first.');
            return;
        }

        const validationError = validatePgn(trimmed);
        if (validationError) {
            setError(`Invalid PGN: ${validationError}`);
            return;
        }

        setSaving(true);
        setError(null);

        const {
            data: { user },
        } = await supabase.auth.getUser();
        if (!user) {
            setError('Not signed in.');
            setSaving(false);
            return;
        }

        const headers = parsePgnHeaders(trimmed);
        const { data, error: dbError } = await supabase
            .from('chess_games')
            .insert({ user_id: user.id, pgn: trimmed, ...headers })
            .select()
            .single();

        setSaving(false);
        if (dbError) {
            setError(dbError.message);
            return;
        }
        onImported(data as ChessGame);
        onClose();
    };

    // Close on backdrop click
    const handleBackdrop = (e: React.MouseEvent<HTMLDivElement>) => {
        if (e.target === e.currentTarget) onClose();
    };

    return (
        <div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            onClick={handleBackdrop}
        >
            <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-2xl w-full max-w-lg shadow-2xl">
                <div className="flex justify-between items-center px-6 py-4 border-b border-zinc-100 dark:border-zinc-800">
                    <h2 className="font-semibold text-zinc-900 dark:text-zinc-100">
                        Import PGN
                    </h2>
                    <button
                        onClick={onClose}
                        className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 transition-colors text-xl leading-none"
                    >
                        ×
                    </button>
                </div>

                <div className="p-6 space-y-4">
                    <textarea
                        autoFocus
                        placeholder={`[Event "World Championship"]\n[White "Kasparov"]\n[Black "Karpov"]\n\n1. e4 e5 2. Nf3 ...`}
                        value={pgn}
                        onChange={(e) => {
                            setPgn(e.target.value);
                            setError(null);
                        }}
                        rows={10}
                        className="w-full bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl px-4 py-3 text-sm font-mono text-zinc-800 dark:text-zinc-100 placeholder:text-zinc-400 focus:outline-none focus:border-blue-500 resize-none"
                    />

                    {error && (
                        <p className="text-sm text-red-500 bg-red-50 dark:bg-red-950/30 px-3 py-2 rounded-lg">
                            {error}
                        </p>
                    )}

                    <div className="flex justify-end gap-3">
                        <button
                            onClick={onClose}
                            className="px-4 py-2 text-sm text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300 transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleImport}
                            disabled={saving || !pgn.trim()}
                            className="px-5 py-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-sm font-medium rounded-lg transition-colors"
                        >
                            {saving ? 'Importing…' : 'Import Game'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

// ─── Result badge ─────────────────────────────────────────────────────────────
function ResultBadge({ result }: { result: string | null }) {
    if (!result)
        return <span className="text-zinc-400 font-mono text-xs">*</span>;
    const colors: Record<string, string> = {
        '1-0': 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400',
        '0-1': 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400',
        '1/2-1/2':
            'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400',
    };
    return (
        <span
            className={`font-mono text-xs px-2 py-0.5 rounded-md ${colors[result] ?? 'text-zinc-400'}`}
        >
            {result}
        </span>
    );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
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
                {/* Header */}
                <header className="flex justify-between items-end mb-8">
                    <div>
                        <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">
                            Chess Library
                        </h1>
                        <p className="text-zinc-500 text-sm mt-0.5">
                            Your imported games and analysis positions.{' '}
                            <Link
                                href="/chess/studies"
                                className="text-blue-600 hover:underline"
                            >
                                View Studies →
                            </Link>
                        </p>
                    </div>
                    <button
                        onClick={() => setShowImport(true)}
                        className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                    >
                        Import PGN
                    </button>
                </header>

                {/* Table */}
                {loading ? (
                    <div className="space-y-2">
                        {[...Array(4)].map((_, i) => (
                            <div
                                key={i}
                                className="h-14 bg-zinc-100 dark:bg-zinc-800 rounded-xl animate-pulse"
                            />
                        ))}
                    </div>
                ) : games.length === 0 ? (
                    <div className="text-center py-24 border border-dashed border-zinc-200 dark:border-zinc-800 rounded-2xl">
                        <p className="text-4xl mb-4">♟</p>
                        <p className="text-zinc-600 dark:text-zinc-400 font-medium mb-1">
                            No games yet
                        </p>
                        <p className="text-sm text-zinc-400 mb-6">
                            Import a PGN from Lichess, Chess.com, or any game
                            file.
                        </p>
                        <button
                            onClick={() => setShowImport(true)}
                            className="bg-blue-600 hover:bg-blue-500 text-white px-5 py-2.5 rounded-lg text-sm font-medium transition-colors"
                        >
                            Import your first game
                        </button>
                    </div>
                ) : (
                    <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl overflow-hidden">
                        <table className="w-full text-left text-sm">
                            <thead className="bg-zinc-50 dark:bg-zinc-800/50 text-zinc-500 border-b border-zinc-200 dark:border-zinc-800">
                                <tr>
                                    <th className="px-6 py-3 font-medium">
                                        Players
                                    </th>
                                    <th className="px-6 py-3 font-medium">
                                        Result
                                    </th>
                                    <th className="px-6 py-3 font-medium">
                                        Event
                                    </th>
                                    <th className="px-6 py-3 font-medium">
                                        Played
                                    </th>
                                    <th className="px-6 py-3" />
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                                {games.map((game) => (
                                    <tr
                                        key={game.id}
                                        className="hover:bg-zinc-50 dark:hover:bg-zinc-800/30 transition-colors group"
                                    >
                                        <td className="px-6 py-4">
                                            <div className="font-medium text-zinc-900 dark:text-zinc-100">
                                                {game.white}{' '}
                                                <span className="text-zinc-400 font-normal">
                                                    vs
                                                </span>{' '}
                                                {game.black}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <ResultBadge result={game.result} />
                                        </td>
                                        <td className="px-6 py-4 text-zinc-500 max-w-50 truncate">
                                            {game.event || 'Casual Game'}
                                        </td>
                                        <td className="px-6 py-4 text-zinc-500 whitespace-nowrap">
                                            {game.played_at
                                                ? new Date(
                                                      game.played_at,
                                                  ).toLocaleDateString()
                                                : '—'}
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center justify-end gap-4">
                                                <button
                                                    onClick={() =>
                                                        handleDelete(game.id)
                                                    }
                                                    disabled={
                                                        deletingId === game.id
                                                    }
                                                    className="text-zinc-300 dark:text-zinc-700 hover:text-red-500 dark:hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100 text-xs disabled:opacity-30"
                                                >
                                                    {deletingId === game.id
                                                        ? 'Deleting…'
                                                        : 'Delete'}
                                                </button>
                                                <Link
                                                    href={`/chess/${game.id}`}
                                                    className="text-blue-600 hover:underline font-medium whitespace-nowrap"
                                                >
                                                    Analyze →
                                                </Link>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>

                        {/* Footer count */}
                        <div className="px-6 py-3 border-t border-zinc-100 dark:border-zinc-800 text-xs text-zinc-400">
                            {games.length} game{games.length !== 1 ? 's' : ''}
                        </div>
                    </div>
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
