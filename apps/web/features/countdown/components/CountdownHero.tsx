import { Pencil, X } from 'lucide-react';
import CountdownDisplay from './CountdownDisplay';
import { getTimeLeft } from '../lib/utils';
import { CountdownHeroProps } from '@/features/countdown/types/countdown';

export default function CountdownHero({
    countdown,
    onDelete,
    onEdit,
}: CountdownHeroProps) {
    const timeLeft = getTimeLeft(countdown.target_date);
    if (!timeLeft) return null;

    return (
        <div className="group relative bg-stone-50 dark:bg-zinc-800/50 rounded-2xl p-4 mb-3">
            <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-all">
                <button
                    type="button"
                    onClick={() => onEdit(countdown)}
                    className="text-stone-400 hover:text-sky-500 dark:text-zinc-600 dark:hover:text-sky-400"
                    title="Edit countdown"
                >
                    <Pencil size={12} />
                </button>
                <button
                    type="button"
                    onClick={() => onDelete(countdown.id)}
                    className="text-stone-400 hover:text-red-500 dark:text-zinc-600 dark:hover:text-red-400"
                    title="Delete countdown"
                >
                    <X size={12} />
                </button>
            </div>
            <div className="flex items-center gap-2 mb-2">
                {countdown.emoji && (
                    <span className="text-xl">{countdown.emoji}</span>
                )}
                <span className="text-sm font-semibold text-stone-700 dark:text-zinc-300 truncate">
                    {countdown.name}
                </span>
            </div>
            <CountdownDisplay timeLeft={timeLeft} />
        </div>
    );
}
