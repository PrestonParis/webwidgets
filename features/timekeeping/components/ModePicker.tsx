import { cn } from '@/lib/utils/utils';
import type { TimekeepingMode } from '@/features/widgets/types/widgets';

const MODES: { value: TimekeepingMode; label: string }[] = [
    { value: 'timer', label: 'Timer' },
    { value: 'stopwatch', label: 'Stopwatch' },
    { value: 'event', label: 'Events' },
];

export function ModePicker({
    mode,
    onChange,
}: {
    mode: TimekeepingMode;
    onChange: (m: TimekeepingMode) => void;
}) {
    return (
        <div className="flex items-center gap-0.5 bg-stone-100 dark:bg-zinc-800/80 rounded-lg p-0.5 mb-4">
            {MODES.map((m) => (
                <button
                    key={m.value}
                    onClick={() => onChange(m.value)}
                    className={cn(
                        'flex-1 text-[11px] font-medium py-1 rounded-md transition-all',
                        mode === m.value
                            ? 'bg-white dark:bg-zinc-700 text-stone-800 dark:text-zinc-100 shadow-sm'
                            : 'text-stone-400 dark:text-zinc-500 hover:text-stone-600 dark:hover:text-zinc-300',
                    )}
                >
                    {m.label}
                </button>
            ))}
        </div>
    );
}
