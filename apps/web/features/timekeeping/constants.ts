import type {
    TimerSubMode,
    PomodoroPhase,
    PomodoroStep,
} from './types/timekeeping';

export const TIMER_DURATIONS: Record<TimerSubMode, number> = {
    standard: 20 * 60,
    pomodoro: 25 * 60,
    long: 45 * 60,
};

export const POMODORO_PHASE_DURATIONS: Record<PomodoroPhase, number> = {
    focus: 25 * 60,
    short: 5 * 60,
    long: 15 * 60,
};

export const DEFAULT_POMODORO_PLAN: PomodoroStep[] = [
    { id: 'focus-1', kind: 'focus', durationSeconds: 25 * 60 },
    { id: 'break-1', kind: 'break', durationSeconds: 5 * 60 },
];

export const DEFAULT_POMODORO_PLAN_CYCLES = 4;

export const TIMER_LABELS: Record<TimerSubMode, string> = {
    standard: 'Standard',
    pomodoro: 'Pomodoro',
    long: 'Long',
};

export const POMODORO_PHASE_LABELS: Record<PomodoroPhase, string> = {
    focus: 'Focus',
    short: 'Short Break',
    long: 'Long Break',
};
