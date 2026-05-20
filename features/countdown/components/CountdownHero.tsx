import { X } from 'lucide-react';
import CountdownDisplay from './CountdownDisplay';
import { getTimeLeft } from '../lib/utils';
import { CountdownHeroProps } from '@/features/countdown/types/countdown';

export default function CountdownHero({
    countdown,
    onDelete,
}: CountdownHeroProps) {
    const timeLeft = getTimeLeft(countdown.target_date);
    if (!timeLeft) return null;

    return (
        <div className="group relative bg-stone-50 dark:bg-zinc-800/50 rounded-2xl p-4 mb-3">
            <button
                onClick={() => onDelete(countdown.id)}
                className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 text-stone-400 hover:text-red-500 dark:text-zinc-600 dark:hover:text-red-400 transition-all"
            >
                <X size={12} />
            </button>
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
