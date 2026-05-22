'use client';

import { Play, Pause, RotateCcw, Flag } from 'lucide-react';
import { cn } from '@/lib/utils/utils';
import { useStopwatch } from '../hooks/useStopwatch';
import { useWidgetSize } from '@/features/widgets/context/WidgetSizeContext';

const FONT_SIZES = {
    compact: 'text-3xl',
    default: 'text-5xl',
    wide: 'text-6xl',
    large: 'text-7xl',
} as const;
const DEC_SIZES = {
    compact: 'text-xl',
    default: 'text-2xl',
    wide: 'text-3xl',
    large: 'text-4xl',
} as const;

export function StopwatchMode() {
    const size = useWidgetSize();
    const { running, display, laps, toggle, lap, reset, fmtMs } =
        useStopwatch();

    const [main, decimal] = display.split('.');

    return (
        <div className="flex flex-col items-center gap-4 w-full">
            {/* Time display */}
            <div className="flex items-end gap-0.5">
                <span
                    className={cn(
                        'font-mono font-semibold tabular-nums text-stone-800 dark:text-zinc-100 tracking-tight leading-none',
                        FONT_SIZES[size],
                    )}
                >
                    {main}
                </span>
                <span
                    className={cn(
                        'font-mono font-medium tabular-nums text-stone-400 dark:text-zinc-500 leading-none mb-0.5',
                        DEC_SIZES[size],
                    )}
                >
                    .{decimal}
                </span>
            </div>

            {/* Controls */}
            <div className="flex items-center gap-3">
                <button
                    onClick={reset}
                    className="p-2 rounded-full text-stone-300 dark:text-zinc-600 hover:text-stone-500 dark:hover:text-zinc-400 transition-colors"
                    title="Reset"
                >
                    <RotateCcw size={15} />
                </button>
                <button
                    onClick={toggle}
                    className="w-11 h-11 rounded-full bg-stone-800 dark:bg-zinc-100 text-white dark:text-zinc-900 flex items-center justify-center hover:bg-stone-700 dark:hover:bg-zinc-200 transition-colors shadow-sm"
                >
                    {running ? (
                        <Pause size={18} />
                    ) : (
                        <Play size={18} className="translate-x-0.5" />
                    )}
                </button>
                <button
                    onClick={lap}
                    disabled={!running}
                    className={cn(
                        'p-2 rounded-full transition-colors',
                        running
                            ? 'text-stone-500 dark:text-zinc-400 hover:text-stone-800 dark:hover:text-zinc-200'
                            : 'text-stone-200 dark:text-zinc-700 cursor-default',
                    )}
                    title="Lap"
                >
                    <Flag size={15} />
                </button>
            </div>

            {/* Lap list */}
            {laps.length > 0 && (
                <div className="w-full max-h-24 overflow-y-auto space-y-0.5">
                    {[...laps].reverse().map((l) => (
                        <div
                            key={l.index}
                            className="flex items-center justify-between text-[11px] px-1"
                        >
                            <span className="text-stone-400 dark:text-zinc-600 font-medium">
                                Lap {l.index}
                            </span>
                            <span className="font-mono tabular-nums text-stone-600 dark:text-zinc-300">
                                +{fmtMs(l.delta)}
                            </span>
                            <span className="font-mono tabular-nums text-stone-400 dark:text-zinc-600">
                                {fmtMs(l.elapsed)}
                            </span>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
