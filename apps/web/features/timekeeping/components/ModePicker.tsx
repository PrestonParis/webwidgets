import { cn } from '@/lib/utils/utils';
import type { TimekeepingMode } from '@/features/widgets/types/widgets';

export const TIME_MODES: { value: TimekeepingMode; label: string }[] = [
    { value: 'timer', label: 'Timer' },
    { value: 'pomodoro', label: 'Pomodoro' },
    { value: 'stopwatch', label: 'Stopwatch' },
    { value: 'countdown', label: 'Countdowns' },
    { value: 'worldclock', label: 'World Clock' },
    { value: 'timeclock', label: 'Timeclock' },
];

export function ModePicker({
    mode,
    modes = TIME_MODES,
    onChange,
}: {
    mode: TimekeepingMode;
    modes?: { value: TimekeepingMode; label: string }[];
    onChange: (m: TimekeepingMode) => void;
}) {
    return (
        <div className="flex w-full flex-wrap items-center gap-0.5 bg-stone-100 dark:bg-zinc-800/80 rounded-lg p-0.5 mb-4">
            {modes.map((m) => (
                <button
                    key={m.value}
                    onClick={() => onChange(m.value)}
                    className={cn(
                        'flex-1 min-w-fit px-2 text-[11px] font-medium py-1 rounded-md transition-all',
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
