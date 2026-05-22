'use client';

import { useState, useRef } from 'react';
import { Play, Pause, RotateCcw } from 'lucide-react';
import { cn } from '@/lib/utils/utils';
import { useTimer } from '../hooks/useTimer';
import { TIMER_LABELS, POMODORO_PHASE_LABELS } from '../constants';
import type { TimerSubMode } from '../types';
import { useWidgetSize } from '@/features/widgets/context/WidgetSizeContext';
import { TimerProgressRing } from '@/icons/TimerProgressRing';
import { PomodoroPlanEditor } from './PomodoroPlanEditor';

const SUB_MODES: TimerSubMode[] = ['standard', 'pomodoro', 'long'];

function TimerSegment({
    value,
    max,
    maxLength = 3,
    font,
    onCommit,
}: {
    value: number;
    max: number;
    maxLength?: number;
    font: string;
    onCommit: (val: number) => void;
}) {
    const [draft, setDraft] = useState<string | null>(null);
    const displayed = draft ?? String(value).padStart(2, '0');
    const isMouseFocusRef = useRef(false);

    function flush(raw: string | null) {
        const val = Math.max(0, Math.min(max, parseInt(raw ?? '0', 10) || 0));
        onCommit(val);
        setDraft(null);
    }

    return (
        <input
            type="text"
            inputMode="numeric"
            maxLength={maxLength}
            value={displayed}
            style={{ width: `${Math.max(2, displayed.length)}ch` }}
            onMouseDown={() => {
                isMouseFocusRef.current = true;
            }}
            onFocus={(e) => {
                setDraft(String(value).padStart(2, '0'));
                const isMouse = isMouseFocusRef.current;
                isMouseFocusRef.current = false;
                if (!isMouse) {
                    const input = e.target;
                    requestAnimationFrame(() => input.select());
                }
            }}
            onChange={(e) =>
                setDraft(e.target.value.replace(/\D/g, '').slice(0, maxLength))
            }
            onBlur={() => flush(draft)}
            onKeyDown={(e) => {
                if (e.key === 'Enter') {
                    flush(draft);
                    (e.target as HTMLInputElement).blur();
                }
            }}
            className={cn(
                'bg-transparent outline-none text-center font-mono font-semibold tabular-nums tracking-tight',
                'text-stone-800 dark:text-zinc-100',
                'border-b-2 border-transparent focus:border-sky-400',
                'p-0',
                font,
            )}
        />
    );
}

function InlineTimerInput({
    seconds,
    font,
    onChange,
}: {
    seconds: number;
    font: string;
    onChange: (seconds: number) => void;
}) {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;

    const sepClass = cn(
        'font-mono font-semibold tabular-nums tracking-tight select-none',
        'text-stone-800 dark:text-zinc-100',
        font,
    );

    return (
        <div className="flex items-center">
            <TimerSegment
                value={h}
                max={23}
                font={font}
                onCommit={(val) =>
                    onChange(Math.max(1, val * 3600 + m * 60 + s))
                }
            />
            <span className={sepClass}>:</span>
            {/* maxLength=4 so you can type e.g. "220"; overflow carries into hours */}
            <TimerSegment
                value={m}
                max={9999}
                maxLength={4}
                font={font}
                onCommit={(val) => {
                    const overflowH = Math.floor(val / 60);
                    const newM = val % 60;
                    onChange(
                        Math.max(1, (h + overflowH) * 3600 + newM * 60 + s),
                    );
                }}
            />
            <span className={sepClass}>:</span>
            <TimerSegment
                value={s}
                max={59}
                font={font}
                onCommit={(val) =>
                    onChange(Math.max(1, h * 3600 + m * 60 + val))
                }
            />
        </div>
    );
}

const RING_SIZES = {
    compact: { r: 40, dim: 90, font: 'text-2xl' },
    default: { r: 54, dim: 124, font: 'text-4xl' },
    wide: { r: 72, dim: 160, font: 'text-5xl' },
    large: { r: 88, dim: 192, font: 'text-6xl' },
} as const;

export function TimerMode() {
    return <TimerContent initialSubMode="standard" lockedSubMode />;
}

export function PomodoroMode() {
    return <TimerContent initialSubMode="pomodoro" lockedSubMode />;
}

function TimerContent({
    initialSubMode,
    lockedSubMode = false,
}: {
    initialSubMode: TimerSubMode;
    lockedSubMode?: boolean;
}) {
    const size = useWidgetSize();
    const {
        state,
        displayTime,
        progress,
        setSubMode,
        setDurationSeconds,
        addPomodoroStep,
        removePomodoroStep,
        setPomodoroStepKind,
        setPomodoroStepDuration,
        setPomodoroPlanCycles,
        setAutoStartNext,
        reset,
        toggle,
    } = useTimer(initialSubMode);

    const { r, dim, font } = RING_SIZES[size];
    const circumference = 2 * Math.PI * r;
    const dashOffset = circumference * (1 - progress);
    const center = dim / 2;
    const phaseLabel =
        state.subMode === 'pomodoro'
            ? `${POMODORO_PHASE_LABELS[state.pomodoroPhase]} ${state.pomodoroStepIndex + 1}/${state.pomodoroPlan.length}`
            : null;

    return (
        <div className="flex flex-col items-center gap-4">
            {!lockedSubMode && (
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
            )}

            {state.subMode === 'pomodoro' && (
                <PomodoroPlanEditor
                    steps={state.pomodoroPlan}
                    currentStepIndex={state.pomodoroStepIndex}
                    planCycles={state.pomodoroPlanCycles}
                    completedPlanCycles={state.completedPlanCycles}
                    running={state.running}
                    onAddStep={addPomodoroStep}
                    onRemoveStep={removePomodoroStep}
                    onStepKindChange={setPomodoroStepKind}
                    onStepDurationChange={setPomodoroStepDuration}
                    onPlanCyclesChange={setPomodoroPlanCycles}
                    autoStartNext={state.autoStartNext}
                    onAutoStartNextChange={setAutoStartNext}
                />
            )}

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
                    {state.running || state.subMode === 'pomodoro' ? (
                        <span
                            className={cn(
                                'font-mono font-semibold tabular-nums text-stone-800 dark:text-zinc-100 tracking-tight',
                                font,
                            )}
                        >
                            {displayTime}
                        </span>
                    ) : (
                        <InlineTimerInput
                            seconds={state.timeLeft}
                            font={font}
                            onChange={setDurationSeconds}
                        />
                    )}
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
                    title={state.running ? 'Pause' : 'Start'}
                    className="w-11 h-11 rounded-full bg-stone-800 dark:bg-zinc-100 text-white dark:text-zinc-900 flex items-center justify-center hover:bg-stone-700 dark:hover:bg-zinc-200 transition-colors shadow-sm"
                >
                    {state.running ? (
                        <Pause size={18} />
                    ) : (
                        <Play size={18} className="translate-x-0.5" />
                    )}
                </button>
                <span className="sr-only">
                    {state.running ? 'Timer running' : 'Timer paused'}
                </span>
                {state.subMode === 'pomodoro' && (
                    <div className="flex gap-1">
                        {Array.from({ length: state.pomodoroPlanCycles }).map(
                            (_, i) => (
                                <span
                                    key={i}
                                    className={cn(
                                        'w-1.5 h-1.5 rounded-full transition-colors',
                                        i < state.completedPlanCycles
                                            ? 'bg-stone-800 dark:bg-zinc-200'
                                            : 'bg-stone-200 dark:bg-zinc-700',
                                    )}
                                />
                            ),
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
