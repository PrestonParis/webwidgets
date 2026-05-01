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

export interface ModeSelectorProps {
    mode: Mode;
    onSwitch: (mode: Mode) => void;
}

export interface TimerDisplayProps {
    mins: string;
    secs: string;
    mode: Mode;
    cycles: number;
    radius: number;
    circumference: number;
    strokeDashoffset: number;
}

export interface TimerControlsProps {
    running: boolean;
    onToggle: () => void;
    onReset: () => void;
}

export interface TimerStatsProps {
    cycles: number;
}
