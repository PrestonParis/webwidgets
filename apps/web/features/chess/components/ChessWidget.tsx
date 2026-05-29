'use client';
import { useEffect, useState, useMemo } from 'react';
import { Chessboard } from 'react-chessboard';
import { ChessGame } from '@/features/chess/types/chess';
import WidgetShell from '@/features/widgets/components/WidgetShell';
import {
    fenAtIndex,
    buildLastMoveStyles,
    parsePgn,
} from '@/features/chess/lib/chessUtils';
import { PawnIcon } from '@/icons/PawnIcon';
import { useWidgetSettings } from '@/features/widgets/hooks/useWidgetSettings';
import { getLatestGame } from '@/features/chess/api/getLatestGame';

export default function ChessWidget() {
    const [game, setGame] = useState<ChessGame | null>(null);
    const [loading, setLoading] = useState(true);
    const { settings, updateSettings } = useWidgetSettings('email', 'email');

    useEffect(() => {
        getLatestGame()
            .then(setGame)
            .catch(console.error)
            .finally(() => setLoading(false));
    }, []);

    const boardState = useMemo(() => {
        if (!game?.pgn) return null;
        try {
            const moves = parsePgn(game.pgn);
            const index = game.current_move_index ?? 0;
            return {
                fen: fenAtIndex(moves, index),
                squareStyles: buildLastMoveStyles(moves, index),
            };
        } catch {
            return null;
        }
    }, [game]);

    return (
        <WidgetShell
            icon={<PawnIcon />}
            title="Chess"
            badge="Analysis"
            settings={settings}
            onSettingsChange={updateSettings}
            footerHref="/chess"
            footerLabel="View Chess →"
            widgetId="chess"
            widgetType="chess"
        >
            {loading ? (
                <div className="aspect-square w-full bg-gray-100 dark:bg-zinc-800 animate-pulse rounded" />
            ) : game && boardState ? (
                <div className="space-y-3">
                    <div className="flex justify-between text-[10px] font-medium uppercase tracking-wider text-zinc-500">
                        <span>{game.white || 'White'}</span>
                        <span className="text-zinc-400">
                            {game.result || '*'}
                        </span>
                        <span>{game.black || 'Black'}</span>
                    </div>
                    <div className="flex justify-center">
                        <div className="rounded overflow-hidden shadow-sm w-45 shrink-0">
                            <Chessboard
                                options={{
                                    position: boardState.fen,
                                    squareStyles: boardState.squareStyles,
                                    allowDragging: false,
                                }}
                            />
                        </div>
                    </div>
                    <p className="text-[10px] text-center text-zinc-400">
                        Move{' '}
                        {Math.floor((game.current_move_index ?? 0) / 2) + 1} ·{' '}
                        {game.event || 'Casual Game'}
                    </p>
                </div>
            ) : (
                <p className="text-xs text-center py-10 text-zinc-500">
                    No games imported yet.
                </p>
            )}
        </WidgetShell>
    );
}
