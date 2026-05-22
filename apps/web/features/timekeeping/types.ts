export type TimekeepingMode =
    | 'timer'
    | 'pomodoro'
    | 'stopwatch'
    | 'countdown'
    | 'worldclock';
export type TimerSubMode = 'standard' | 'pomodoro' | 'long';
export type PomodoroPhase = 'focus' | 'short' | 'long';
export type PomodoroStepKind = 'focus' | 'break';

export interface PomodoroStep {
    id: string;
    kind: PomodoroStepKind;
    durationSeconds: number;
}

export interface TimerState {
    subMode: TimerSubMode;
    pomodoroPhase: PomodoroPhase;
    pomodoroPlan: PomodoroStep[];
    pomodoroStepIndex: number;
    pomodoroPlanCycles: number;
    completedPlanCycles: number;
    autoStartNext: boolean;
    timeLeft: number;
    durationSeconds: number;
    running: boolean;
    cycles: number;
}

export type TimerAction =
    | { type: 'TICK' }
    | { type: 'COMPLETE' }
    | { type: 'SET_SUBMODE'; subMode: TimerSubMode }
    | { type: 'SET_DURATION'; durationSeconds: number }
    | { type: 'ADD_POMODORO_STEP'; kind: PomodoroStepKind }
    | { type: 'REMOVE_POMODORO_STEP'; id: string }
    | { type: 'SET_POMODORO_STEP_KIND'; id: string; kind: PomodoroStepKind }
    | { type: 'SET_POMODORO_STEP_DURATION'; id: string; durationSeconds: number }
    | { type: 'SET_POMODORO_PLAN_CYCLES'; cycles: number }
    | { type: 'SET_AUTO_START_NEXT'; enabled: boolean }
    | { type: 'RESET' }
    | { type: 'TOGGLE_RUNNING' };

export interface LapEntry {
    index: number;
    elapsed: number;
    delta: number;
}

export interface StopwatchState {
    running: boolean;
    elapsed: number;
    laps: LapEntry[];
}

export type StopwatchAction =
    | { type: 'TICK'; ms: number }
    | { type: 'TOGGLE_RUNNING' }
    | { type: 'LAP'; elapsed: number }
    | { type: 'RESET' };
