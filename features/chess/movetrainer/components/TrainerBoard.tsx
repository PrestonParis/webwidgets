'use client';

import { Chessboard } from 'react-chessboard';
import { TrainingBoardProps } from '../types/movetrainer';

export function TrainerBoard({
    fen,
    boardOrientation,
    squareStyles,
    moves,
    index,
    onPieceDrop,
}: TrainingBoardProps) {
    return (
        <div className="flex-1 w-full space-y-4">
            <div className="rounded-xl overflow-hidden shadow-2xl border border-zinc-800">
                <Chessboard
                    options={{
                        position: fen,
                        onPieceDrop,
                        boardOrientation,
                        squareStyles,
                        animationDurationInMs: 300,
                    }}
                />
            </div>

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
    );
}
