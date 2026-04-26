import { useState, useMemo, useCallback } from 'react';
import type { ChessVariation, TrainerResult } from '@/types/chess';
import { Chessboard, PieceDropHandlerArgs } from 'react-chessboard';
import {
    parsePgnFromFen,
    fenAtIndexFromFen,
    buildLastMoveStyles,
    isCorrectMove,
} from '@/app/lib/utils/chess';

// ─── Move Trainer ─────────────────────────────────────────────────────────────
export function MoveTrainer({ variation }: { variation: ChessVariation }) {
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
