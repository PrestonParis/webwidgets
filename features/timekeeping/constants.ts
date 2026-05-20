import type { TimerSubMode, PomodoroPhase } from './types';

export const TIMER_DURATIONS: Record<TimerSubMode, number> = {
    standard: 5 * 60,
    pomodoro: 25 * 60,
    long: 45 * 60,
};

export const POMODORO_PHASE_DURATIONS: Record<PomodoroPhase, number> = {
    focus: 25 * 60,
    short: 5 * 60,
    long: 15 * 60,
};

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
