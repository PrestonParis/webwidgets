export type TimekeepingMode = 'timer' | 'stopwatch' | 'event';
export type TimerSubMode = 'standard' | 'pomodoro' | 'long';
export type PomodoroPhase = 'focus' | 'short' | 'long';

export interface TimerState {
    subMode: TimerSubMode;
    pomodoroPhase: PomodoroPhase;
    timeLeft: number;
    running: boolean;
    cycles: number;
}

export type TimerAction =
    | { type: 'TICK' }
    | { type: 'COMPLETE' }
    | { type: 'SET_SUBMODE'; subMode: TimerSubMode }
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
