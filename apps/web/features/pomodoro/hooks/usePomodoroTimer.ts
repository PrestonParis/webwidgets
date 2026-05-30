import { useEffect, useCallback, useReducer } from 'react';
import { DURATIONS } from '@/features/pomodoro/constants';
import {
    TimerState,
    TimerAction,
    Mode,
} from '@/features/pomodoro/types/pomodoro';

function timerReducer(state: TimerState, action: TimerAction): TimerState {
    switch (action.type) {
        case 'TICK':
            if (!state.running || state.timeLeft === 0) return state;
            return { ...state, timeLeft: state.timeLeft - 1 };

        case 'COMPLETE':
            if (!state.running || state.timeLeft !== 0) return state;
            if (state.mode === 'focus') {
                const nextCycles = state.cycles + 1;
                const nextMode: Mode = nextCycles % 4 === 0 ? 'long' : 'short';
                return {
                    mode: nextMode,
                    timeLeft: DURATIONS[nextMode],
                    running: false,
                    cycles: nextCycles,
                };
            }
            return {
                mode: 'focus',
                timeLeft: DURATIONS.focus,
                running: false,
                cycles: state.cycles,
            };

        case 'SWITCH_MODE':
            return {
                ...state,
                mode: action.mode,
                timeLeft: DURATIONS[action.mode],
                running: false,
            };

        case 'RESET':
            return {
                ...state,
                timeLeft: DURATIONS[state.mode],
                running: false,
            };

        case 'TOGGLE_RUNNING':
            return { ...state, running: !state.running };

        default:
            return state;
    }
}

export function usePomodoroTimer(compact?: boolean) {
    const [state, dispatch] = useReducer(timerReducer, {
        mode: 'focus',
        timeLeft: DURATIONS.focus,
        running: false,
        cycles: 0,
    });

    // Tick
    useEffect(() => {
        if (!state.running) return;
        const id = setInterval(() => dispatch({ type: 'TICK' }), 1000);
        return () => clearInterval(id);
    }, [state.running]);

    // Completion transition
    useEffect(() => {
        if (state.running && state.timeLeft === 0) {
            dispatch({ type: 'COMPLETE' });
        }
    }, [state.running, state.timeLeft]);

    // Notifications
    useEffect(() => {
        if (!state.running && state.timeLeft === 0) {
            if (Notification.permission === 'default')
                void Notification.requestPermission();
            if (Notification.permission === 'granted') {
                new Notification('Pomodoro', {
                    body:
                        state.mode === 'focus'
                            ? 'Focus session complete! Time for a break.'
                            : 'Break over. Time to focus.',
                });
            }
        }
    }, [state.running, state.timeLeft, state.mode]);

    const switchMode = useCallback(
        (mode: Mode) => dispatch({ type: 'SWITCH_MODE', mode }),
        [],
    );
    const reset = useCallback(() => dispatch({ type: 'RESET' }), []);
    const toggleRunning = useCallback(() => {
        if (Notification.permission === 'default')
            void Notification.requestPermission();
        dispatch({ type: 'TOGGLE_RUNNING' });
    }, []);

    const mins = String(Math.floor(state.timeLeft / 60)).padStart(2, '0');
    const secs = String(state.timeLeft % 60).padStart(2, '0');
    const progress = 1 - state.timeLeft / DURATIONS[state.mode];
    const radius = compact ? 60 : 120;
    const circumference = 2 * Math.PI * radius;
    const strokeDashoffset = circumference * (1 - progress);

    return {
        state,
        mins,
        secs,
        radius,
        circumference,
        strokeDashoffset,
        switchMode,
        reset,
        toggleRunning,
    };
}
