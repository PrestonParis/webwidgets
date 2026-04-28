import ChessGameRow from './ChessGameRow';
import { ChessGame } from '@/types/chess';

export default function ChessGamesTable({
    games,
    deletingId,
    onDelete,
}: {
    games: ChessGame[];
    deletingId: string | null;
    onDelete: (id: string) => void;
}) {
    return (
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl overflow-hidden">
            <table className="w-full text-left text-sm">
                <thead className="bg-zinc-50 dark:bg-zinc-800/50 text-zinc-500 border-b border-zinc-200 dark:border-zinc-800">
                    <tr>
                        <th className="px-6 py-3 font-medium">Players</th>
                        <th className="px-6 py-3 font-medium">Result</th>
                        <th className="px-6 py-3 font-medium">Event</th>
                        <th className="px-6 py-3 font-medium">Played</th>
                        <th className="px-6 py-3" />
                    </tr>
                </thead>

                <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                    {games.map((game) => (
                        <ChessGameRow
                            key={game.id}
                            game={game}
                            deletingId={deletingId}
                            onDelete={onDelete}
                        />
                    ))}
                </tbody>
            </table>

            <div className="px-6 py-3 border-t border-zinc-100 dark:border-zinc-800 text-xs text-zinc-400">
                {games.length} game{games.length !== 1 ? 's' : ''}
            </div>
        </div>
    );
}
