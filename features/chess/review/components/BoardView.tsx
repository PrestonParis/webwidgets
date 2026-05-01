import { Chessboard } from 'react-chessboard';
import { BoardViewProps } from '@/features/chess/review/types/review';

export function BoardView({
    white,
    black,
    boardFen,
    squareStyles,
    moveIndex,
    movesLength,
    showControls,
    activeVariation,
    onMoveSelect,
}: BoardViewProps) {
    return (
        <div className="w-full max-w-140 space-y-4">
            <div className="flex items-center gap-2 text-sm">
                <div className="w-5 h-5 rounded-full bg-zinc-800 border border-zinc-600" />
                <span className="font-medium">{black}</span>
            </div>

            <div className="rounded-xl overflow-hidden shadow-2xl">
                <Chessboard
                    options={{
                        position: activeVariation ? undefined : boardFen,
                        squareStyles,
                        allowDragging: false,
                    }}
                />
            </div>

            <div className="flex items-center gap-2 text-sm">
                <div className="w-5 h-5 rounded-full bg-white border border-zinc-400" />
                <span className="font-medium">{white}</span>
            </div>

            {showControls && (
                <div className="flex items-center justify-center gap-2">
                    <button
                        onClick={() => onMoveSelect(0)}
                        disabled={moveIndex === 0}
                        className="w-9 h-9 flex items-center justify-center rounded-lg bg-zinc-800 hover:bg-zinc-700 disabled:opacity-30 transition-colors text-lg"
                        title="Start"
                    >
                        ⏮
                    </button>
                    <button
                        onClick={() => onMoveSelect(Math.max(0, moveIndex - 1))}
                        disabled={moveIndex === 0}
                        className="w-9 h-9 flex items-center justify-center rounded-lg bg-zinc-800 hover:bg-zinc-700 disabled:opacity-30 transition-colors text-lg"
                        title="Previous (←)"
                    >
                        ◀
                    </button>
                    <span className="text-xs text-zinc-500 w-20 text-center">
                        {moveIndex === 0 ? 'Start' : `Move ${moveIndex}`}
                    </span>
                    <button
                        onClick={() =>
                            onMoveSelect(Math.min(movesLength, moveIndex + 1))
                        }
                        disabled={moveIndex === movesLength}
                        className="w-9 h-9 flex items-center justify-center rounded-lg bg-zinc-800 hover:bg-zinc-700 disabled:opacity-30 transition-colors text-lg"
                        title="Next (→)"
                    >
                        ▶
                    </button>
                    <button
                        onClick={() => onMoveSelect(movesLength)}
                        disabled={moveIndex === movesLength}
                        className="w-9 h-9 flex items-center justify-center rounded-lg bg-zinc-800 hover:bg-zinc-700 disabled:opacity-30 transition-colors text-lg"
                        title="End"
                    >
                        ⏭
                    </button>
                </div>
            )}

            <p className="text-center text-[10px] text-zinc-600">
                {showControls ? 'Use ← → arrow keys to navigate' : ''}
            </p>
        </div>
    );
}
