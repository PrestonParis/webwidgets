import { X } from 'lucide-react';
import { getTimeLeft } from '../lib/utils';
import { CountdownItemProps } from '@/features/countdown/types/countdown';

export default function CountdownItem({
    countdown,
    onDelete,
}: CountdownItemProps) {
    const timeLeft = getTimeLeft(countdown.target_date);
    if (!timeLeft) return null;

    return (
        <li className="group flex items-center justify-between px-1">
            <div className="flex items-center gap-1.5 min-w-0">
                <span className="text-sm">{countdown.emoji}</span>
                <span className="text-xs text-stone-600 dark:text-zinc-400 truncate">
                    {countdown.name}
                </span>
            </div>
            <div className="flex items-center gap-2 shrink-0">
                <span className="text-xs font-semibold tabular-nums text-stone-700 dark:text-zinc-300">
                    {timeLeft.days}d
                </span>
                <button
                    onClick={() => onDelete(countdown.id)}
                    className="opacity-0 group-hover:opacity-100 text-stone-400 hover:text-red-500 dark:text-zinc-600 transition-all"
                >
                    <X size={11} />
                </button>
            </div>
        </li>
    );
}
