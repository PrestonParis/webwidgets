'use client';

import { useState } from 'react';
import { Chessboard } from 'react-chessboard';
import { useAnalysisBoard } from '@/features/chess/analysis/hooks/useAnalysisBoard';
import MoveList from '@/features/chess/review/components/MoveList';

interface AnalysisBoardProps {
    storageKey?: string;
    pgn?: string;
    onPgnChange?: (pgn: string) => void;
    onExportPgn?: (pgn: string) => void;
    showExport?: boolean;
}

function NavButton({
    onClick,
    disabled,
    title,
    children,
}: {
    onClick: () => void;
    disabled: boolean;
    title: string;
    children: React.ReactNode;
}) {
    return (
        <button
            onClick={onClick}
            disabled={disabled}
            title={title}
            className="w-8 h-8 flex items-center justify-center rounded-lg bg-zinc-800 hover:bg-zinc-700 disabled:opacity-30 transition-colors text-sm"
        >
            {children}
        </button>
    );
}

function AnalysisBoardNav({
    moveIndex,
    movesLength,
    onGoTo,
}: {
    moveIndex: number;
    movesLength: number;
    onGoTo: (i: number) => void;
}) {
    return (
        <div className="flex items-center gap-1">
            <NavButton
                onClick={() => onGoTo(0)}
                disabled={moveIndex === 0}
                title="Start"
            >
                ⏮
            </NavButton>
            <NavButton
                onClick={() => onGoTo(moveIndex - 1)}
                disabled={moveIndex === 0}
                title="Previous"
            >
                ◀
            </NavButton>
            <span className="text-xs text-zinc-500 w-16 text-center">
                {moveIndex === 0 ? 'Start' : `Move ${moveIndex}`}
            </span>
            <NavButton
                onClick={() => onGoTo(moveIndex + 1)}
                disabled={moveIndex === movesLength}
                title="Next"
            >
                ▶
            </NavButton>
            <NavButton
                onClick={() => onGoTo(movesLength)}
                disabled={moveIndex === movesLength}
                title="End"
            >
                ⏭
            </NavButton>
        </div>
    );
}

function AnalysisSidepanel({
    moves,
    moveIndex,
    currentPgn,
    showExport,
    onExportPgn,
    goTo,
}: {
    moves: unknown[];
    moveIndex: number;
    currentPgn: string;
    showExport: boolean | undefined;
    onExportPgn: ((pgn: string) => void) | undefined;
    goTo: (i: number) => void;
}) {
    const [showPgn, setShowPgn] = useState(false);
    return (
        <div className="w-60 flex flex-col gap-4 min-h-0">
            <div className="flex-1 bg-zinc-900 border border-zinc-800 rounded-xl p-3 min-h-48 max-h-96 overflow-y-auto">
                {moves.length === 0 ? (
                    <p className="text-xs text-zinc-600 italic text-center mt-4">
                        Make a move to start analysis
                    </p>
                ) : (
                    <MoveList
                        moves={moves as Parameters<typeof MoveList>[0]['moves']}
                        currentIndex={moveIndex}
                        onSelect={goTo}
                    />
                )}
            </div>
            <div className="space-y-2">
                {(showExport || onExportPgn) && (
                    <button
                        onClick={() => onExportPgn?.(currentPgn)}
                        disabled={moves.length === 0}
                        className="w-full text-sm py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-medium disabled:opacity-40 transition-colors"
                    >
                        Export PGN to Study
                    </button>
                )}
                <button
                    onClick={() => setShowPgn(!showPgn)}
                    className="w-full text-xs py-1.5 rounded-lg border border-zinc-700 text-zinc-500 hover:border-zinc-500 hover:text-zinc-300 transition-colors"
                >
                    {showPgn ? 'Hide PGN' : 'Show PGN'}
                </button>
                {showPgn && (
                    <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-2">
                        <pre className="text-xs text-zinc-400 whitespace-pre-wrap break-all select-all">
                            {currentPgn || '(empty)'}
                        </pre>
                    </div>
                )}
            </div>
        </div>
    );
}

export function AnalysisBoard({
    storageKey,
    pgn,
    onPgnChange,
    onExportPgn,
    showExport,
}: AnalysisBoardProps) {
    const {
        moves,
        moveIndex,
        boardFen,
        squareStyles,
        handlePieceDrop,
        goTo,
        reset,
        pgn: currentPgn,
    } = useAnalysisBoard({ storageKey, pgn, onPgnChange });

    const [stockfishEnabled, setStockfishEnabled] = useState(false);

    return (
        <div className="flex gap-6 items-start">
            <div className="flex-1 max-w-xl space-y-3">
                <div className="rounded-xl overflow-hidden shadow-2xl border border-zinc-800">
                    <Chessboard
                        options={{
                            position: boardFen,
                            onPieceDrop: handlePieceDrop,
                            squareStyles,
                            animationDurationInMs: 200,
                        }}
                    />
                </div>
                <div className="flex items-center justify-between">
                    <AnalysisBoardNav
                        moveIndex={moveIndex}
                        movesLength={moves.length}
                        onGoTo={goTo}
                    />
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() =>
                                setStockfishEnabled(!stockfishEnabled)
                            }
                            className={`text-xs px-3 py-1.5 rounded-lg border transition-colors ${stockfishEnabled ? 'border-green-600 text-green-400 bg-green-950' : 'border-zinc-700 text-zinc-500 hover:border-zinc-500 hover:text-zinc-300'}`}
                        >
                            {stockfishEnabled ? 'Engine On' : 'Engine'}
                        </button>
                        <button
                            onClick={reset}
                            className="text-xs px-3 py-1.5 rounded-lg border border-zinc-700 text-zinc-500 hover:border-zinc-500 hover:text-zinc-300 transition-colors"
                        >
                            Reset
                        </button>
                    </div>
                </div>
                {stockfishEnabled && (
                    <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-3 text-xs text-zinc-500">
                        Engine analysis — add{' '}
                        <code className="text-zinc-400">stockfish.js</code> to{' '}
                        <code className="text-zinc-400">public/</code> to enable
                        evaluation.
                    </div>
                )}
            </div>
            <AnalysisSidepanel
                moves={moves}
                moveIndex={moveIndex}
                currentPgn={currentPgn}
                showExport={showExport}
                onExportPgn={onExportPgn}
                goTo={goTo}
            />
        </div>
    );
}
