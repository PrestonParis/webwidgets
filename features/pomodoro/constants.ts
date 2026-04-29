import { Mode } from '@/types/pomodoro';

export const DURATIONS: Record<Mode, number> = {
    focus: 25 * 60,
    short: 5 * 60,
    long: 15 * 60,
};

export const LABELS: Record<Mode, string> = {
    focus: 'Focus',
    short: 'Short Break',
    long: 'Long Break',
};
