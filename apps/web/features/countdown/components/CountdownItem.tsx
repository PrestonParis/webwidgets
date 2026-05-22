import { Pencil, X } from 'lucide-react';
import { getTimeLeft } from '../lib/utils';
import { CountdownItemProps } from '@/features/countdown/types/countdown';

export default function CountdownItem({
    countdown,
    onDelete,
    onEdit,
}: CountdownItemProps) {
    const timeLeft = getTimeLeft(countdown.target_date);
    if (!timeLeft) return null;

    return (
        <li className="group flex items-center justify-between gap-3 rounded-2xl border border-stone-100 bg-white px-3 py-2.5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900/80">
            <div className="flex items-center gap-1.5 min-w-0">
                {countdown.emoji && (
                    <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-stone-100 text-sm dark:bg-zinc-800">
                        {countdown.emoji}
                    </span>
                )}
                <span className="text-xs text-stone-600 dark:text-zinc-400 truncate">
                    {countdown.name}
                </span>
            </div>
            <div className="flex items-center gap-2 shrink-0">
                <span className="text-xs font-semibold tabular-nums text-stone-700 dark:text-zinc-300">
                    {timeLeft.days}d
                </span>
                <button
                    type="button"
                    onClick={() => onEdit(countdown)}
                    className="opacity-0 group-hover:opacity-100 text-stone-400 hover:text-sky-500 dark:text-zinc-600 dark:hover:text-sky-400 transition-all"
                    title="Edit countdown"
                >
                    <Pencil size={11} />
                </button>
                <button
                    type="button"
                    onClick={() => onDelete(countdown.id)}
                    className="opacity-0 group-hover:opacity-100 text-stone-400 hover:text-red-500 dark:text-zinc-600 transition-all"
                    title="Delete countdown"
                >
                    <X size={11} />
                </button>
            </div>
        </li>
    );
}
