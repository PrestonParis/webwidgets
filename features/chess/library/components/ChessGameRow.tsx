import Link from 'next/link';
import { ChessGame } from '@/features/chess/types/chess';
import { ResultBadge } from '@/features/chess/library/components/ResultsBadge';

export default function ChessGameRow({
    game,
    deletingId,
    onDelete,
}: {
    game: ChessGame;
    deletingId: string | null;
    onDelete: (id: string) => void;
}) {
    return (
        <tr className="hover:bg-zinc-50 dark:hover:bg-zinc-800/30 transition-colors group">
            <td className="px-6 py-4">
                <div className="font-medium text-zinc-900 dark:text-zinc-100">
                    {game.white}{' '}
                    <span className="text-zinc-400 font-normal">vs</span>{' '}
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
                    ? new Date(game.played_at).toLocaleDateString()
                    : '—'}
            </td>

            <td className="px-6 py-4">
                <div className="flex items-center justify-end gap-4">
                    <button
                        onClick={() => onDelete(game.id)}
                        disabled={deletingId === game.id}
                        className="text-zinc-300 dark:text-zinc-700 hover:text-red-500 dark:hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100 text-xs disabled:opacity-30"
                    >
                        {deletingId === game.id ? 'Deleting…' : 'Delete'}
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
    );
}
