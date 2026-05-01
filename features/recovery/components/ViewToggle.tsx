import { cn } from '@/lib/utils/utils';
import { RecoveryView } from '@/features/widgets/types/widgets';
import { VIEW_OPTIONS } from '@/features/recovery/constants';

interface ViewToggleProps {
    view: RecoveryView;
    onViewChange: (view: RecoveryView) => void;
}

export default function ViewToggle({ view, onViewChange }: ViewToggleProps) {
    return (
        <div>
            <p className="text-[10px] font-bold text-gray-400 dark:text-zinc-500 uppercase tracking-widest mb-2">
                View
            </p>
            <div className="flex gap-2">
                {VIEW_OPTIONS.map((opt) => (
                    <button
                        key={opt.value}
                        onClick={() => onViewChange(opt.value as RecoveryView)}
                        className={cn(
                            'flex-1 py-1.5 rounded-xl text-xs font-bold transition-all',
                            view === opt.value
                                ? 'bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900'
                                : 'bg-white dark:bg-zinc-800 text-gray-500 dark:text-zinc-400 border border-gray-200 dark:border-zinc-700 hover:border-gray-300 dark:hover:border-zinc-600',
                        )}
                    >
                        {opt.label}
                    </button>
                ))}
            </div>
        </div>
    );
}
