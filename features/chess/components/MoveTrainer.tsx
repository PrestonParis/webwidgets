'use client';

import { useMemo } from 'react';
import { Chessboard } from 'react-chessboard';
import { useMoveTrainer } from '@/features/chess/hooks/useMoveTrainer';
import { MoveTrainerProps } from '@/types/chess';

export default function MoveTrainer({
    variation,
    layout = 'compact',
    onBack,
}: MoveTrainerProps) {
    const {
        moves,
        index,
        result,
        done,
        fen,
        squareStyles,
        handleMove,
        reset,
        showHint,
    } = useMoveTrainer(variation);

    const hintStyles = useMemo(() => {
        if (result !== 'hint' || !moves[index]) return {};
        return {
            [moves[index].from]: { backgroundColor: 'rgba(59, 130, 246, 0.5)' },
        };
    }, [result, index, moves]);

    const isExpanded = layout === 'expanded';

    return (
        <div
            className={`flex ${isExpanded ? 'flex-col lg:flex-row gap-8' : 'flex-col gap-4'} items-start`}
        >
            {/* Board Section */}
            <div className="flex-1 w-full space-y-4">
                <div className="rounded-xl overflow-hidden shadow-2xl border border-zinc-800">
                    <Chessboard
                        options={{
                            position: fen,
                            onPieceDrop: handleMove,
                            boardOrientation:
                                variation.side_to_move === 'black'
                                    ? 'black'
                                    : 'white',
                            squareStyles: { ...squareStyles, ...hintStyles },
                            animationDurationInMs: 300,
                        }}
                    />
                </div>

                {/* Progress Bar */}
                <div className="flex gap-1 h-1.5 w-full">
                    {moves.map((_, i) => (
                        <div
                            key={i}
                            className={`flex-1 rounded-full transition-all duration-500 ${
                                i < index
                                    ? 'bg-blue-500'
                                    : i === index
                                      ? 'bg-blue-400 animate-pulse'
                                      : 'bg-zinc-800'
                            }`}
                        />
                    ))}
                </div>
            </div>

            {/* Control Panel Section */}
            <div
                className={`${isExpanded ? 'lg:w-80' : 'w-full'} flex flex-col gap-4`}
            >
                {onBack && (
                    <button
                        onClick={onBack}
                        className="text-xs text-zinc-500 hover:text-zinc-300 self-start transition-colors"
                    >
                        ← Back
                    </button>
                )}

                <header>
                    <h2 className="text-lg font-bold text-zinc-100">
                        {variation.title}
                    </h2>
                    {variation.annotation && (
                        <p className="text-sm text-zinc-400 mt-1">
                            {variation.annotation}
                        </p>
                    )}
                </header>

                {/* Result Message */}
                <div
                    className={`h-10 flex items-center justify-center rounded-lg text-sm font-medium transition-all ${
                        result === 'correct'
                            ? 'bg-green-500/10 text-green-400'
                            : result === 'incorrect'
                              ? 'bg-red-500/10 text-red-400'
                              : result === 'hint'
                                ? 'bg-blue-500/10 text-blue-400'
                                : 'bg-transparent'
                    }`}
                >
                    {result === 'correct' && '✓ Well done!'}
                    {result === 'incorrect' && '✗ Try a different move'}
                    {result === 'hint' &&
                        `Look at the ${moves[index]?.from} square`}
                </div>

                {done ? (
                    <div className="p-6 bg-zinc-900 rounded-xl border border-zinc-800 text-center space-y-4">
                        <span className="text-3xl">🎯</span>
                        <p className="text-sm text-zinc-300">
                            Variation Complete
                        </p>
                        <button
                            onClick={reset}
                            className="w-full py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition-colors"
                        >
                            Train Again
                        </button>
                    </div>
                ) : (
                    <div className="flex gap-2">
                        <button
                            onClick={showHint}
                            className="flex-1 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 rounded-lg text-sm transition-colors"
                        >
                            Hint
                        </button>
                        <button
                            onClick={reset}
                            className="flex-1 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 rounded-lg text-sm transition-colors"
                        >
                            Reset
                        </button>
                    </div>
                )}

                <div className="text-[10px] text-zinc-600 uppercase tracking-widest pt-2 border-t border-zinc-800">
                    Move {index + 1} of {moves.length}
                </div>
            </div>
        </div>
    );
}
