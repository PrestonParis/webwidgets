'use client';
// app/chess/[id]/page.tsx  (or wherever your game detail route lives)
// This is a CLIENT component. The library listing page you showed is a server
// component — keep that as-is and link to this page via the "Analyze" link.

import { useEffect, useState, useMemo, useCallback, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Chessboard, PieceDropHandlerArgs } from 'react-chessboard';
import { supabase } from '@/app/lib/supabase';
import {
    parsePgn,
    parsePgnFromFen,
    fenAtIndex,
    fenAtIndexFromFen,
    buildLastMoveStyles,
    isCorrectMove,
} from '@/app/lib/utils/chess';
import type {
    ChessGame,
    ChessVariation,
    ParsedMove,
    TrainerResult,
} from '@/types/chess';

// ─── Tab type ────────────────────────────────────────────────────────────────
type Tab = 'review' | 'trainer' | 'studies';

// ─── Move List ────────────────────────────────────────────────────────────────
function MoveList({
    moves,
    currentIndex,
    onSelect,
}: {
    moves: ParsedMove[];
    currentIndex: number;
    onSelect: (i: number) => void;
}) {
    const ref = useRef<HTMLDivElement>(null);

    // Scroll active move into view
    useEffect(() => {
        const el = ref.current?.querySelector('[data-active="true"]');
        el?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    }, [currentIndex]);

    const pairs: [ParsedMove, ParsedMove | null][] = [];
    for (let i = 0; i < moves.length; i += 2) {
        pairs.push([moves[i], moves[i + 1] ?? null]);
    }

    return (
        <div
            ref={ref}
            className="overflow-y-auto flex-1 pr-1 text-sm font-mono"
        >
            {pairs.map(([white, black], pairIdx) => {
                const wi = pairIdx * 2 + 1; // 1-based index for white
                const bi = pairIdx * 2 + 2; // 1-based index for black
                return (
                    <div
                        key={pairIdx}
                        className="flex gap-1 items-baseline py-0.5"
                    >
                        <span className="text-zinc-500 w-8 shrink-0 text-right select-none">
                            {pairIdx + 1}.
                        </span>
                        <button
                            data-active={currentIndex === wi}
                            onClick={() => onSelect(wi)}
                            className={`px-2 py-0.5 rounded transition-colors ${
                                currentIndex === wi
                                    ? 'bg-blue-600 text-white'
                                    : 'text-zinc-200 hover:bg-zinc-700'
                            }`}
                        >
                            {white.san}
                        </button>
                        {black && (
                            <button
                                data-active={currentIndex === bi}
                                onClick={() => onSelect(bi)}
                                className={`px-2 py-0.5 rounded transition-colors ${
                                    currentIndex === bi
                                        ? 'bg-blue-600 text-white'
                                        : 'text-zinc-200 hover:bg-zinc-700'
                                }`}
                            >
                                {black.san}
                            </button>
                        )}
                    </div>
                );
            })}
        </div>
    );
}

// ─── Variation Panel ──────────────────────────────────────────────────────────
function VariationPanel({
    variations,
    currentMoveIndex,
    onSelect,
    onAdd,
    onDelete,
}: {
    variations: ChessVariation[];
    currentMoveIndex: number;
    onSelect: (v: ChessVariation) => void;
    onAdd: () => void;
    onDelete: (id: string) => void;
}) {
    const relevant = variations.filter(
        (v) => v.branch_move_index === currentMoveIndex,
    );
    const others = variations.filter(
        (v) => v.branch_move_index !== currentMoveIndex,
    );

    return (
        <div className="space-y-3">
            <div className="flex justify-between items-center">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
                    Variations
                </h3>
                <button
                    onClick={onAdd}
                    className="text-xs text-blue-500 hover:text-blue-400 transition-colors"
                >
                    + Add here
                </button>
            </div>

            {relevant.length === 0 && (
                <p className="text-xs text-zinc-600 italic">
                    No variations at move {currentMoveIndex}.
                </p>
            )}

            <div className="space-y-2">
                {relevant.map((v) => (
                    <div
                        key={v.id}
                        className="bg-zinc-800 rounded-lg p-3 group"
                    >
                        <div className="flex justify-between items-start mb-1">
                            <button
                                onClick={() => onSelect(v)}
                                className="text-xs font-medium text-zinc-100 hover:text-blue-400 transition-colors text-left"
                            >
                                {v.title}
                            </button>
                            <button
                                onClick={() => onDelete(v.id)}
                                className="text-zinc-600 hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100 text-xs"
                            >
                                ✕
                            </button>
                        </div>
                        {v.annotation && (
                            <p className="text-[11px] text-zinc-500 leading-relaxed">
                                {v.annotation}
                            </p>
                        )}
                        <div className="flex gap-3 mt-2 text-[10px] text-zinc-600">
                            <span>Practiced: {v.practiced_count}×</span>
                            {v.last_practiced && (
                                <span>
                                    Last:{' '}
                                    {new Date(
                                        v.last_practiced,
                                    ).toLocaleDateString()}
                                </span>
                            )}
                        </div>
                    </div>
                ))}
            </div>

            {others.length > 0 && (
                <details className="text-xs text-zinc-600">
                    <summary className="cursor-pointer hover:text-zinc-400">
                        {others.length} other variation
                        {others.length !== 1 ? 's' : ''} in this game
                    </summary>
                    <div className="mt-2 space-y-1 pl-2 border-l border-zinc-800">
                        {others.map((v) => (
                            <button
                                key={v.id}
                                onClick={() => onSelect(v)}
                                className="block text-left hover:text-zinc-300 transition-colors"
                            >
                                Move {v.branch_move_index}: {v.title}
                            </button>
                        ))}
                    </div>
                </details>
            )}
        </div>
    );
}

// ─── Move Trainer ─────────────────────────────────────────────────────────────
function MoveTrainer({ variation }: { variation: ChessVariation }) {
    const moves = useMemo(
        () => parsePgnFromFen(variation.pgn, variation.start_fen),
        [variation],
    );
    const [index, setIndex] = useState(0);
    const [result, setResult] = useState<TrainerResult | null>(null);
    const [done, setDone] = useState(false);

    const fen = fenAtIndexFromFen(moves, index, variation.start_fen);
    const squareStyles = buildLastMoveStyles(moves, index);

    const handleDrop = useCallback(
        ({ sourceSquare, targetSquare }: PieceDropHandlerArgs) => {
            if (done) return false;
            if (!targetSquare) return false;
            const correct = isCorrectMove(
                moves,
                index,
                sourceSquare,
                targetSquare,
            );
            if (correct) {
                setResult('correct');
                setTimeout(() => {
                    setResult(null);
                    if (index + 1 >= moves.length) {
                        setDone(true);
                    } else {
                        setIndex((i) => i + 1);
                    }
                }, 700);
            } else {
                setResult('incorrect');
                setTimeout(() => setResult(null), 900);
            }
            return correct;
        },
        [done, index, moves],
    );

    const handleHint = () => {
        setResult('hint');
        setTimeout(() => setResult(null), 1800);
    };

    const handleReset = () => {
        setIndex(0);
        setResult(null);
        setDone(false);
    };

    const hintSquares: Record<string, React.CSSProperties> = useMemo(() => {
        if (result !== 'hint' || !moves[index]) return {};
        return {
            [moves[index].from]: { backgroundColor: 'rgba(99,179,237,0.55)' },
        };
    }, [result, index, moves]);

    return (
        <div className="space-y-4">
            <div className="flex justify-between items-center">
                <div>
                    <h3 className="font-semibold text-zinc-100">
                        {variation.title}
                    </h3>
                    {variation.annotation && (
                        <p className="text-xs text-zinc-500 mt-0.5">
                            {variation.annotation}
                        </p>
                    )}
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={handleHint}
                        disabled={done}
                        className="text-xs px-3 py-1.5 rounded bg-zinc-700 hover:bg-zinc-600 text-zinc-200 disabled:opacity-40 transition-colors"
                    >
                        Hint
                    </button>
                    <button
                        onClick={handleReset}
                        className="text-xs px-3 py-1.5 rounded bg-zinc-700 hover:bg-zinc-600 text-zinc-200 transition-colors"
                    >
                        Reset
                    </button>
                </div>
            </div>

            {/* Status banner */}
            {result && (
                <div
                    className={`text-center text-sm font-medium py-2 rounded-lg transition-all ${
                        result === 'correct'
                            ? 'bg-green-900/50 text-green-300'
                            : result === 'incorrect'
                              ? 'bg-red-900/50 text-red-300'
                              : 'bg-blue-900/50 text-blue-300'
                    }`}
                >
                    {result === 'correct' && '✓ Correct!'}
                    {result === 'incorrect' && '✗ Try again'}
                    {result === 'hint' &&
                        `Hint: move from ${moves[index]?.from}`}
                </div>
            )}

            {done ? (
                <div className="text-center py-8 space-y-3">
                    <div className="text-4xl">🎉</div>
                    <p className="text-zinc-300 font-medium">
                        Variation complete!
                    </p>
                    <button
                        onClick={handleReset}
                        className="text-sm px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition-colors"
                    >
                        Practice Again
                    </button>
                </div>
            ) : (
                <div className="rounded-lg overflow-hidden shadow-lg">
                    <Chessboard
                        options={{
                            position: fen,
                            squareStyles: { ...squareStyles, ...hintSquares },
                            onPieceDrop: handleDrop,
                        }}
                    />
                </div>
            )}

            {/* Move progress */}
            <div className="flex gap-1">
                {moves.map((_, i) => (
                    <div
                        key={i}
                        className={`h-1 flex-1 rounded-full transition-colors ${
                            i < index
                                ? 'bg-blue-500'
                                : i === index
                                  ? 'bg-blue-400 animate-pulse'
                                  : 'bg-zinc-700'
                        }`}
                    />
                ))}
            </div>
        </div>
    );
}

// ─── Add Variation Modal ──────────────────────────────────────────────────────
function AddVariationModal({
    gameId,
    branchIndex,
    startFen,
    onClose,
    onSaved,
}: {
    gameId: string;
    branchIndex: number;
    startFen: string;
    onClose: () => void;
    onSaved: (v: ChessVariation) => void;
}) {
    const [title, setTitle] = useState('');
    const [pgn, setPgn] = useState('');
    const [annotation, setAnnotation] = useState('');
    const [saving, setSaving] = useState(false);

    const handleSave = async () => {
        if (!title.trim() || !pgn.trim()) return;
        setSaving(true);
        const {
            data: { user },
        } = await supabase.auth.getUser();
        if (!user) {
            setSaving(false);
            return;
        }

        const { data, error } = await supabase
            .from('chess_variations')
            .insert({
                user_id: user.id,
                game_id: gameId,
                title: title.trim(),
                pgn: pgn.trim(),
                start_fen: startFen,
                branch_move_index: branchIndex,
                annotation: annotation.trim() || null,
            })
            .select()
            .single();

        setSaving(false);
        if (!error && data) {
            onSaved(data as ChessVariation);
            onClose();
        }
    };

    return (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
            <div className="bg-zinc-900 border border-zinc-700 rounded-xl w-full max-w-md p-6 space-y-4">
                <h2 className="font-semibold text-zinc-100">
                    Add Variation at Move {branchIndex}
                </h2>
                <input
                    placeholder="Title (e.g. 'Aggressive Knight Sacrifice')"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-500 focus:outline-none focus:border-blue-500"
                />
                <textarea
                    placeholder="PGN moves (e.g. Nf6 d4 e5 ...)"
                    value={pgn}
                    onChange={(e) => setPgn(e.target.value)}
                    rows={3}
                    className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-500 font-mono focus:outline-none focus:border-blue-500"
                />
                <textarea
                    placeholder="Annotation / explanation (optional)"
                    value={annotation}
                    onChange={(e) => setAnnotation(e.target.value)}
                    rows={2}
                    className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-500 focus:outline-none focus:border-blue-500"
                />
                <div className="flex justify-end gap-3">
                    <button
                        onClick={onClose}
                        className="text-sm px-4 py-2 text-zinc-400 hover:text-zinc-200 transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSave}
                        disabled={saving || !title.trim() || !pgn.trim()}
                        className="text-sm px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg disabled:opacity-50 transition-colors"
                    >
                        {saving ? 'Saving…' : 'Save Variation'}
                    </button>
                </div>
            </div>
        </div>
    );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function ChessGamePage() {
    const { id } = useParams<{ id: string }>();
    const router = useRouter();

    const [game, setGame] = useState<ChessGame | null>(null);
    const [variations, setVariations] = useState<ChessVariation[]>([]);
    const [loading, setLoading] = useState(true);
    const [tab, setTab] = useState<Tab>('review');
    const [moveIndex, setMoveIndex] = useState(0);
    const [activeVariation, setActiveVariation] =
        useState<ChessVariation | null>(null);
    const [showAddModal, setShowAddModal] = useState(false);

    const moves = useMemo(() => (game?.pgn ? parsePgn(game.pgn) : []), [game]);

    const boardFen = useMemo(
        () => fenAtIndex(moves, moveIndex),
        [moves, moveIndex],
    );

    const squareStyles = useMemo(
        () => buildLastMoveStyles(moves, moveIndex),
        [moves, moveIndex],
    );

    // ── Load game + variations ──────────────────────────────────────────────
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
            if (varRes.data) setVariations(varRes.data as ChessVariation[]);
            setLoading(false);

            // Mark as viewed
            await supabase
                .from('chess_games')
                .update({ last_viewed_at: new Date().toISOString() })
                .eq('id', id);
        }
        load();
    }, [id]);

    // ── Keyboard navigation ─────────────────────────────────────────────────
    useEffect(() => {
        const handler = (e: KeyboardEvent) => {
            if (tab !== 'review') return;
            if (e.key === 'ArrowLeft') setMoveIndex((i) => Math.max(0, i - 1));
            if (e.key === 'ArrowRight')
                setMoveIndex((i) => Math.min(moves.length, i + 1));
            if (e.key === 'ArrowUp') setMoveIndex(0);
            if (e.key === 'ArrowDown') setMoveIndex(moves.length);
        };
        window.addEventListener('keydown', handler);
        return () => window.removeEventListener('keydown', handler);
    }, [tab, moves.length]);

    // ── Persist current move index ──────────────────────────────────────────
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

    const handleMoveSelect = (i: number) => {
        setMoveIndex(i);
        persistMoveIndex(i);
    };

    const handleVariationSelect = (v: ChessVariation) => {
        setActiveVariation(v);
        setTab('trainer');
    };

    const handleVariationDeleted = async (vid: string) => {
        await supabase.from('chess_variations').delete().eq('id', vid);
        setVariations((prev) => prev.filter((v) => v.id !== vid));
    };

    const handleVariationSaved = (v: ChessVariation) => {
        setVariations((prev) => [...prev, v]);
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-zinc-950">
                <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    if (!game) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen bg-zinc-950 text-zinc-400 gap-4">
                <p>Game not found.</p>
                <button
                    onClick={() => router.push('/chess')}
                    className="text-blue-500 hover:underline text-sm"
                >
                    ← Back to library
                </button>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-zinc-950 text-zinc-100">
            {/* Header */}
            <div className="border-b border-zinc-800 px-6 py-4 flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => router.push('/chess')}
                        className="text-zinc-500 hover:text-zinc-300 transition-colors text-sm"
                    >
                        ← Library
                    </button>
                    <div>
                        <h1 className="font-semibold text-zinc-100">
                            {game.white}{' '}
                            <span className="text-zinc-500">vs</span>{' '}
                            {game.black}
                        </h1>
                        <p className="text-xs text-zinc-500">
                            {game.event || 'Casual Game'}
                            {game.played_at
                                ? ` · ${new Date(game.played_at).toLocaleDateString()}`
                                : ''}
                            {' · '}
                            <span className="font-mono">
                                {game.result || '*'}
                            </span>
                        </p>
                    </div>
                </div>

                {/* Tabs */}
                <div className="flex gap-1 bg-zinc-900 rounded-lg p-1">
                    {(['review', 'trainer', 'studies'] as Tab[]).map((t) => (
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
            </div>

            {/* Body */}
            <div className="flex gap-0 h-[calc(100vh-73px)]">
                {/* Board column */}
                <div className="flex-1 flex items-center justify-center p-6">
                    <div className="w-full max-w-140 space-y-4">
                        {/* Black player */}
                        <div className="flex items-center gap-2 text-sm">
                            <div className="w-5 h-5 rounded-full bg-zinc-800 border border-zinc-600" />
                            <span className="font-medium">{game.black}</span>
                        </div>

                        <div className="rounded-xl overflow-hidden shadow-2xl">
                            <Chessboard
                                options={{
                                    position:
                                        tab === 'trainer' && activeVariation
                                            ? undefined // trainer manages its own board
                                            : boardFen,
                                    squareStyles: squareStyles,
                                    allowDragging: false,
                                }}
                            />
                        </div>

                        {/* White player */}
                        <div className="flex items-center gap-2 text-sm">
                            <div className="w-5 h-5 rounded-full bg-white border border-zinc-400" />
                            <span className="font-medium">{game.white}</span>
                        </div>

                        {/* Navigation controls (review tab only) */}
                        {tab === 'review' && (
                            <div className="flex items-center justify-center gap-2">
                                <button
                                    onClick={() => handleMoveSelect(0)}
                                    disabled={moveIndex === 0}
                                    className="w-9 h-9 flex items-center justify-center rounded-lg bg-zinc-800 hover:bg-zinc-700 disabled:opacity-30 transition-colors text-lg"
                                    title="Start"
                                >
                                    ⏮
                                </button>
                                <button
                                    onClick={() =>
                                        handleMoveSelect(
                                            Math.max(0, moveIndex - 1),
                                        )
                                    }
                                    disabled={moveIndex === 0}
                                    className="w-9 h-9 flex items-center justify-center rounded-lg bg-zinc-800 hover:bg-zinc-700 disabled:opacity-30 transition-colors text-lg"
                                    title="Previous (←)"
                                >
                                    ◀
                                </button>
                                <span className="text-xs text-zinc-500 w-20 text-center">
                                    {moveIndex === 0
                                        ? 'Start'
                                        : `Move ${moveIndex}`}
                                </span>
                                <button
                                    onClick={() =>
                                        handleMoveSelect(
                                            Math.min(
                                                moves.length,
                                                moveIndex + 1,
                                            ),
                                        )
                                    }
                                    disabled={moveIndex === moves.length}
                                    className="w-9 h-9 flex items-center justify-center rounded-lg bg-zinc-800 hover:bg-zinc-700 disabled:opacity-30 transition-colors text-lg"
                                    title="Next (→)"
                                >
                                    ▶
                                </button>
                                <button
                                    onClick={() =>
                                        handleMoveSelect(moves.length)
                                    }
                                    disabled={moveIndex === moves.length}
                                    className="w-9 h-9 flex items-center justify-center rounded-lg bg-zinc-800 hover:bg-zinc-700 disabled:opacity-30 transition-colors text-lg"
                                    title="End"
                                >
                                    ⏭
                                </button>
                            </div>
                        )}

                        <p className="text-center text-[10px] text-zinc-600">
                            {tab === 'review'
                                ? 'Use ← → arrow keys to navigate'
                                : ''}
                        </p>
                    </div>
                </div>

                {/* Sidebar */}
                <div className="w-72 border-l border-zinc-800 flex flex-col">
                    {tab === 'review' && (
                        <div className="flex flex-col h-full p-4 gap-4">
                            <MoveList
                                moves={moves}
                                currentIndex={moveIndex}
                                onSelect={handleMoveSelect}
                            />
                            <div className="border-t border-zinc-800 pt-4">
                                <VariationPanel
                                    variations={variations}
                                    currentMoveIndex={moveIndex}
                                    onSelect={handleVariationSelect}
                                    onAdd={() => setShowAddModal(true)}
                                    onDelete={handleVariationDeleted}
                                />
                            </div>
                        </div>
                    )}

                    {tab === 'trainer' && (
                        <div className="flex flex-col h-full p-4 gap-4 overflow-y-auto">
                            {activeVariation ? (
                                <>
                                    <button
                                        onClick={() => setActiveVariation(null)}
                                        className="text-xs text-zinc-500 hover:text-zinc-300 self-start transition-colors"
                                    >
                                        ← All variations
                                    </button>
                                    {/* Trainer renders its own board in the main area */}
                                </>
                            ) : (
                                <>
                                    <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
                                        Choose a Variation to Train
                                    </h3>
                                    {variations.length === 0 ? (
                                        <p className="text-xs text-zinc-600 italic">
                                            No variations yet. Add some in the
                                            Review tab.
                                        </p>
                                    ) : (
                                        <div className="space-y-2">
                                            {variations.map((v) => (
                                                <button
                                                    key={v.id}
                                                    onClick={() =>
                                                        handleVariationSelect(v)
                                                    }
                                                    className="w-full text-left bg-zinc-800 hover:bg-zinc-700 rounded-lg p-3 transition-colors"
                                                >
                                                    <div className="text-sm font-medium text-zinc-100">
                                                        {v.title}
                                                    </div>
                                                    <div className="text-xs text-zinc-500 mt-0.5">
                                                        From move{' '}
                                                        {v.branch_move_index} ·{' '}
                                                        {v.practiced_count}×
                                                        practiced
                                                    </div>
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                </>
                            )}
                        </div>
                    )}

                    {tab === 'studies' && <StudiesSidebar gameId={id} />}
                </div>
            </div>

            {/* Trainer overlay — replaces the board area when a variation is active */}
            {tab === 'trainer' && activeVariation && (
                <div className="absolute inset-0 bg-zinc-950 flex">
                    <div className="flex-1 flex items-center justify-center p-6">
                        <div className="w-full max-w-130">
                            <MoveTrainer variation={activeVariation} />
                        </div>
                    </div>
                    <div className="w-72 border-l border-zinc-800 p-4 flex flex-col gap-4 overflow-y-auto">
                        <button
                            onClick={() => setActiveVariation(null)}
                            className="text-xs text-zinc-500 hover:text-zinc-300 self-start transition-colors"
                        >
                            ← All variations
                        </button>
                        <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
                            Other Variations
                        </h3>
                        <div className="space-y-2">
                            {variations
                                .filter((v) => v.id !== activeVariation.id)
                                .map((v) => (
                                    <button
                                        key={v.id}
                                        onClick={() => handleVariationSelect(v)}
                                        className="w-full text-left bg-zinc-800 hover:bg-zinc-700 rounded-lg p-3 transition-colors"
                                    >
                                        <div className="text-sm font-medium text-zinc-100">
                                            {v.title}
                                        </div>
                                        <div className="text-xs text-zinc-500 mt-0.5">
                                            From move {v.branch_move_index} ·{' '}
                                            {v.practiced_count}× practiced
                                        </div>
                                    </button>
                                ))}
                        </div>
                    </div>
                </div>
            )}

            {/* Add variation modal */}
            {showAddModal && (
                <AddVariationModal
                    gameId={id}
                    branchIndex={moveIndex}
                    startFen={boardFen}
                    onClose={() => setShowAddModal(false)}
                    onSaved={handleVariationSaved}
                />
            )}
        </div>
    );
}

// ─── Studies Sidebar (stub — fleshed out in StudiesPage) ──────────────────────
function StudiesSidebar({ gameId }: { gameId: string }) {
    const [studies, setStudies] = useState<{ id: string; title: string }[]>([]);
    const router = useRouter();

    useEffect(() => {
        supabase
            .from('chess_studies')
            .select('id, title')
            .order('updated_at', { ascending: false })
            .then(({ data }) => setStudies(data ?? []));
    }, []);

    return (
        <div className="p-4 space-y-4">
            <div className="flex justify-between items-center">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
                    Studies
                </h3>
                <button
                    onClick={() => router.push('/chess/studies')}
                    className="text-xs text-blue-500 hover:text-blue-400 transition-colors"
                >
                    Manage →
                </button>
            </div>
            {studies.length === 0 ? (
                <p className="text-xs text-zinc-600 italic">No studies yet.</p>
            ) : (
                <div className="space-y-2">
                    {studies.map((s) => (
                        <button
                            key={s.id}
                            onClick={() =>
                                router.push(`/chess/studies/${s.id}`)
                            }
                            className="w-full text-left bg-zinc-800 hover:bg-zinc-700 rounded-lg p-3 transition-colors"
                        >
                            <div className="text-sm font-medium text-zinc-100">
                                {s.title}
                            </div>
                        </button>
                    ))}
                </div>
            )}
            <button
                onClick={async () => {
                    const title = prompt('Study title?');
                    if (!title) return;
                    const {
                        data: { user },
                    } = await supabase.auth.getUser();
                    if (!user) return;
                    const { data } = await supabase
                        .from('chess_studies')
                        .insert({ user_id: user.id, title })
                        .select()
                        .single();
                    if (data) setStudies((prev) => [data, ...prev]);
                }}
                className="w-full text-sm py-2 rounded-lg border border-zinc-700 text-zinc-400 hover:border-zinc-500 hover:text-zinc-200 transition-colors"
            >
                + New Study
            </button>
        </div>
    );
}
