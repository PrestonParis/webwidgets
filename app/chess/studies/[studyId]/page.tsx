'use client';
// app/chess/studies/[studyId]/page.tsx
import { useEffect, useState, useMemo, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Chessboard, PieceDropHandlerArgs } from 'react-chessboard';
import { supabase } from '@/app/lib/supabase';
import {
    parsePgnFromFen,
    fenAtIndexFromFen,
    buildLastMoveStyles,
    isCorrectMove,
} from '@/app/lib/utils/chess';
import type { ChessStudy, ChessVariation, TrainerResult } from '@/types/chess';

const STARTING_FEN = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';

// ─── Inline Move Trainer ──────────────────────────────────────────────────────
function StudyTrainer({
    variation,
    onBack,
}: {
    variation: ChessVariation;
    onBack: () => void;
}) {
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

            // 1. Guard against null values
            if (!sourceSquare || !targetSquare) return false;

            // 2. TypeScript now knows these are strings
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

    const hintSquares: Record<string, React.CSSProperties> = useMemo(() => {
        if (result !== 'hint' || !moves[index]) return {};
        return {
            [moves[index].from]: { backgroundColor: 'rgba(99,179,237,0.55)' },
        };
    }, [result, index, moves]);

    return (
        <div className="flex flex-col lg:flex-row gap-8 items-start">
            {/* Board */}
            <div className="flex-1 space-y-4">
                <div className="rounded-xl overflow-hidden shadow-2xl">
                    <Chessboard
                        options={{
                            position: fen,
                            squareStyles: { ...squareStyles, ...hintSquares },
                            onPieceDrop: done ? undefined : handleDrop,
                        }}
                    />
                </div>

                {/* Progress bar */}
                <div className="flex gap-1">
                    {moves.map((_, i) => (
                        <div
                            key={i}
                            className={`h-1.5 flex-1 rounded-full transition-all duration-300 ${
                                i < index
                                    ? 'bg-blue-500'
                                    : i === index
                                      ? 'bg-blue-400'
                                      : 'bg-zinc-700'
                            }`}
                        />
                    ))}
                </div>
            </div>

            {/* Panel */}
            <div className="lg:w-72 space-y-4">
                <button
                    onClick={onBack}
                    className="text-xs text-zinc-500 hover:text-zinc-300 transition-colors"
                >
                    ← Back to variations
                </button>

                <div>
                    <h2 className="font-semibold text-zinc-100 text-lg">
                        {variation.title}
                    </h2>
                    {variation.annotation && (
                        <p className="text-sm text-zinc-400 mt-1 leading-relaxed">
                            {variation.annotation}
                        </p>
                    )}
                </div>

                {result && (
                    <div
                        className={`text-center text-sm font-medium py-2.5 rounded-lg ${
                            result === 'correct'
                                ? 'bg-green-900/50 text-green-300'
                                : result === 'incorrect'
                                  ? 'bg-red-900/50 text-red-300'
                                  : 'bg-blue-900/50 text-blue-300'
                        }`}
                    >
                        {result === 'correct' && '✓ Correct!'}
                        {result === 'incorrect' && '✗ Try again'}
                        {result === 'hint' && `Move from ${moves[index]?.from}`}
                    </div>
                )}

                {done ? (
                    <div className="text-center py-6 space-y-3 bg-zinc-900 rounded-xl border border-zinc-800">
                        <div className="text-4xl">🎉</div>
                        <p className="text-zinc-300 font-medium">Complete!</p>
                        <p className="text-xs text-zinc-500">
                            Practiced {variation.practiced_count + 1} time
                            {variation.practiced_count + 1 !== 1 ? 's' : ''}
                        </p>
                        <button
                            onClick={() => {
                                setIndex(0);
                                setDone(false);
                                setResult(null);
                            }}
                            className="text-sm px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition-colors"
                        >
                            Again
                        </button>
                    </div>
                ) : (
                    <div className="flex gap-2">
                        <button
                            onClick={() => setResult('hint')}
                            className="flex-1 py-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-sm transition-colors"
                        >
                            Hint
                        </button>
                        <button
                            onClick={() => {
                                setIndex(0);
                                setResult(null);
                            }}
                            className="flex-1 py-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-sm transition-colors"
                        >
                            Reset
                        </button>
                    </div>
                )}

                <div className="text-xs text-zinc-600 pt-2 border-t border-zinc-800">
                    Move {index} of {moves.length}
                </div>
            </div>
        </div>
    );
}

// ─── Add Variation to Study Modal ─────────────────────────────────────────────
function AddStudyVariationModal({
    studyId,
    onClose,
    onSaved,
}: {
    studyId: string;
    onClose: () => void;
    onSaved: (v: ChessVariation) => void;
}) {
    const [title, setTitle] = useState('');
    const [startFen, setStartFen] = useState(STARTING_FEN);
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
                study_id: studyId,
                title: title.trim(),
                pgn: pgn.trim(),
                start_fen: startFen.trim() || STARTING_FEN,
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
            <div className="bg-zinc-900 border border-zinc-700 rounded-xl w-full max-w-lg p-6 space-y-4">
                <h2 className="font-semibold text-zinc-100">
                    Add Variation to Study
                </h2>

                <input
                    placeholder="Title (e.g. 'Ruy Lopez: Berlin Defense')"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-500 focus:outline-none focus:border-blue-500"
                />

                <div>
                    <label className="text-xs text-zinc-500 block mb-1">
                        Starting FEN (leave blank for starting position)
                    </label>
                    <input
                        placeholder={STARTING_FEN}
                        value={startFen === STARTING_FEN ? '' : startFen}
                        onChange={(e) =>
                            setStartFen(e.target.value || STARTING_FEN)
                        }
                        className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-500 font-mono focus:outline-none focus:border-blue-500"
                    />
                </div>

                <div>
                    <label className="text-xs text-zinc-500 block mb-1">
                        PGN moves (just the moves, e.g. e4 e5 Nf3 Nc6)
                    </label>
                    <textarea
                        placeholder="e4 e5 Nf3 Nc6 Bb5 a6..."
                        value={pgn}
                        onChange={(e) => setPgn(e.target.value)}
                        rows={3}
                        className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-500 font-mono focus:outline-none focus:border-blue-500"
                    />
                </div>

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

// ─── Main Study Page ──────────────────────────────────────────────────────────
export default function StudyDetailPage() {
    const { studyId } = useParams<{ studyId: string }>();
    const router = useRouter();

    const [study, setStudy] = useState<ChessStudy | null>(null);
    const [variations, setVariations] = useState<ChessVariation[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeVariation, setActiveVariation] =
        useState<ChessVariation | null>(null);
    const [showAddModal, setShowAddModal] = useState(false);

    useEffect(() => {
        if (!studyId) return;
        Promise.all([
            supabase
                .from('chess_studies')
                .select('*')
                .eq('id', studyId)
                .single(),
            supabase
                .from('chess_variations')
                .select('*')
                .eq('study_id', studyId)
                .order('created_at'),
        ]).then(([studyRes, varRes]) => {
            if (studyRes.data) setStudy(studyRes.data as ChessStudy);
            if (varRes.data) setVariations(varRes.data as ChessVariation[]);
            setLoading(false);
        });
    }, [studyId]);

    const handleVariationSaved = (v: ChessVariation) => {
        setVariations((prev) => [...prev, v]);
    };

    const handleVariationDelete = async (id: string) => {
        await supabase.from('chess_variations').delete().eq('id', id);
        setVariations((prev) => prev.filter((v) => v.id !== id));
        if (activeVariation?.id === id) setActiveVariation(null);
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-zinc-950">
                <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-zinc-950 text-zinc-100 p-6 max-w-6xl mx-auto">
            {/* Header */}
            <div className="flex items-start justify-between mb-8">
                <div>
                    <button
                        onClick={() => router.push('/chess/studies')}
                        className="text-sm text-zinc-500 hover:text-zinc-300 mb-2 block transition-colors"
                    >
                        ← Studies
                    </button>
                    <h1 className="text-2xl font-bold">
                        {study?.title ?? 'Study'}
                    </h1>
                    {study?.description && (
                        <p className="text-zinc-500 text-sm mt-1">
                            {study.description}
                        </p>
                    )}
                </div>
                <button
                    onClick={() => setShowAddModal(true)}
                    className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                >
                    + Add Variation
                </button>
            </div>

            {/* Active trainer */}
            {activeVariation ? (
                <StudyTrainer
                    variation={activeVariation}
                    onBack={() => setActiveVariation(null)}
                />
            ) : (
                <>
                    {variations.length === 0 ? (
                        <div className="text-center py-24 text-zinc-600">
                            <p className="text-4xl mb-4">♜</p>
                            <p>No variations yet. Add one to start training.</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {variations.map((v) => (
                                <div
                                    key={v.id}
                                    className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 flex flex-col gap-3 group hover:border-zinc-700 transition-colors"
                                >
                                    <div className="flex justify-between items-start">
                                        <h3 className="font-medium text-zinc-100">
                                            {v.title}
                                        </h3>
                                        <button
                                            onClick={() =>
                                                handleVariationDelete(v.id)
                                            }
                                            className="text-zinc-700 hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100 text-xs ml-2"
                                        >
                                            ✕
                                        </button>
                                    </div>

                                    {v.annotation && (
                                        <p className="text-xs text-zinc-500 leading-relaxed flex-1">
                                            {v.annotation}
                                        </p>
                                    )}

                                    <div className="text-xs text-zinc-600 font-mono truncate">
                                        {v.pgn.slice(0, 60)}
                                        {v.pgn.length > 60 ? '…' : ''}
                                    </div>

                                    <div className="flex justify-between items-center">
                                        <span className="text-xs text-zinc-600">
                                            {v.practiced_count}× practiced
                                        </span>
                                        <button
                                            onClick={() =>
                                                setActiveVariation(v)
                                            }
                                            className="text-sm px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition-colors"
                                        >
                                            Train →
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </>
            )}

            {showAddModal && studyId && (
                <AddStudyVariationModal
                    studyId={studyId}
                    onClose={() => setShowAddModal(false)}
                    onSaved={handleVariationSaved}
                />
            )}
        </div>
    );
}
