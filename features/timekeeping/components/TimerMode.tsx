'use client';

import { Play, Pause, RotateCcw } from 'lucide-react';
import { cn } from '@/lib/utils/utils';
import { useTimer } from '../hooks/useTimer';
import { TIMER_LABELS, POMODORO_PHASE_LABELS } from '../constants';
import type { TimerSubMode } from '../types';
import { useWidgetSize } from '@/features/widgets/context/WidgetSizeContext';
import { TimerProgressRing } from '@/icons/TimerProgressRing';

const SUB_MODES: TimerSubMode[] = ['standard', 'pomodoro', 'long'];

const RING_SIZES = {
    compact: { r: 40, dim: 90, font: 'text-2xl' },
    default: { r: 54, dim: 124, font: 'text-4xl' },
    wide: { r: 72, dim: 160, font: 'text-5xl' },
    large: { r: 88, dim: 192, font: 'text-6xl' },
} as const;

export function TimerMode() {
    const size = useWidgetSize();
    const { state, mins, secs, progress, setSubMode, reset, toggle } =
        useTimer();

    const { r, dim, font } = RING_SIZES[size];
    const circumference = 2 * Math.PI * r;
    const dashOffset = circumference * (1 - progress);
    const center = dim / 2;
    const phaseLabel =
        state.subMode === 'pomodoro'
            ? POMODORO_PHASE_LABELS[state.pomodoroPhase]
            : null;

    return (
        <div className="flex flex-col items-center gap-4">
            {/* Sub-mode tabs */}
            <div className="flex gap-1">
                {SUB_MODES.map((m) => (
                    <button
                        key={m}
                        onClick={() => setSubMode(m)}
                        className={cn(
                            'px-3 py-1 rounded-full text-[11px] font-medium transition-all',
                            state.subMode === m
                                ? 'bg-stone-800 dark:bg-zinc-100 text-white dark:text-zinc-900'
                                : 'text-stone-400 dark:text-zinc-500 hover:text-stone-600 dark:hover:text-zinc-300',
                        )}
                    >
                        {TIMER_LABELS[m]}
                    </button>
                ))}
            </div>

            {/* Ring + time */}
            <div className="relative" style={{ width: dim, height: dim }}>
                <TimerProgressRing
                    dim={dim}
                    center={center}
                    r={r}
                    circumference={circumference}
                    dashOffset={dashOffset}
                />
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span
                        className={cn(
                            'font-mono font-semibold tabular-nums text-stone-800 dark:text-zinc-100 tracking-tight',
                            font,
                        )}
                    >
                        {mins}:{secs}
                    </span>
                    {phaseLabel && (
                        <span className="text-[10px] text-stone-400 dark:text-zinc-500 mt-0.5">
                            {phaseLabel}
                        </span>
                    )}
                </div>
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
                    {state.running ? (
                        <Pause size={18} />
                    ) : (
                        <Play size={18} className="translate-x-0.5" />
                    )}
                </button>
                {/* Session dots — only in Pomodoro mode */}
                {state.subMode === 'pomodoro' && (
                    <div className="flex gap-1">
                        {Array.from({ length: 4 }).map((_, i) => (
                            <span
                                key={i}
                                className={cn(
                                    'w-1.5 h-1.5 rounded-full transition-colors',
                                    i < state.cycles % 4
                                        ? 'bg-stone-800 dark:bg-zinc-200'
                                        : 'bg-stone-200 dark:bg-zinc-700',
                                )}
                            />
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
