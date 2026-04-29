export type Mode = 'focus' | 'short' | 'long';

// State type definition
export type TimerState = {
    mode: Mode;
    timeLeft: number;
    running: boolean;
    cycles: number;
};

// Action types
export type TimerAction =
    | { type: 'TICK' }
    | { type: 'COMPLETE' }
    | { type: 'SWITCH_MODE'; mode: Mode }
    | { type: 'RESET' }
    | { type: 'TOGGLE_RUNNING' };
