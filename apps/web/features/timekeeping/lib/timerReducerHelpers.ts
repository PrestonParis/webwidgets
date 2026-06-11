import { DEFAULT_POMODORO_PLAN, POMODORO_PHASE_DURATIONS } from '../constants';
import type {
    PomodoroPhase,
    PomodoroStep,
    PomodoroStepKind,
} from '../types/timekeeping';

const MIN_DURATION_SECONDS = 1;
const MAX_DURATION_SECONDS = 24 * 60 * 60;

export function clampDuration(durationSeconds: number): number {
    return Math.max(
        MIN_DURATION_SECONDS,
        Math.min(durationSeconds, MAX_DURATION_SECONDS),
    );
}

export function cloneDefaultPomodoroPlan(): PomodoroStep[] {
    return DEFAULT_POMODORO_PLAN.map((step) => ({ ...step }));
}

export function firstPomodoroDuration(plan: PomodoroStep[]): number {
    return plan[0]?.durationSeconds ?? POMODORO_PHASE_DURATIONS.focus;
}

export function stepDurationAt(plan: PomodoroStep[], index: number): number {
    return plan[index]?.durationSeconds ?? firstPomodoroDuration(plan);
}

export function createPomodoroStep(kind: PomodoroStepKind): PomodoroStep {
    return {
        id: `${kind}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        kind,
        durationSeconds:
            kind === 'focus'
                ? POMODORO_PHASE_DURATIONS.focus
                : POMODORO_PHASE_DURATIONS.short,
    };
}

export function pomodoroPhaseForStep(
    step: PomodoroStep | undefined,
): PomodoroPhase {
    return step?.kind === 'break' ? 'short' : 'focus';
}
