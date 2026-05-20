import { useReducer, useEffect, useCallback } from 'react';
import {
    TIMER_DURATIONS,
    POMODORO_PHASE_DURATIONS,
    POMODORO_PHASE_LABELS,
} from '../constants';
import type {
    TimerState,
    TimerAction,
    TimerSubMode,
    PomodoroPhase,
} from '../types';

function currentDuration(state: TimerState): number {
    if (state.subMode === 'pomodoro')
        return POMODORO_PHASE_DURATIONS[state.pomodoroPhase];
    return TIMER_DURATIONS[state.subMode];
}

function reducer(state: TimerState, action: TimerAction): TimerState {
    switch (action.type) {
        case 'TICK':
            if (!state.running || state.timeLeft === 0) return state;
            return { ...state, timeLeft: state.timeLeft - 1 };

        case 'COMPLETE':
            if (!state.running || state.timeLeft !== 0) return state;
            if (state.subMode !== 'pomodoro') {
                return { ...state, running: false };
            }
            if (state.pomodoroPhase === 'focus') {
                const next = state.cycles + 1;
                const nextPhase: PomodoroPhase =
                    next % 4 === 0 ? 'long' : 'short';
                return {
                    ...state,
                    pomodoroPhase: nextPhase,
                    timeLeft: POMODORO_PHASE_DURATIONS[nextPhase],
                    running: false,
                    cycles: next,
                };
            }
            return {
                ...state,
                pomodoroPhase: 'focus',
                timeLeft: POMODORO_PHASE_DURATIONS.focus,
                running: false,
            };

        case 'SET_SUBMODE':
            return {
                ...state,
                subMode: action.subMode,
                pomodoroPhase: 'focus',
                timeLeft:
                    action.subMode === 'pomodoro'
                        ? POMODORO_PHASE_DURATIONS.focus
                        : TIMER_DURATIONS[action.subMode],
                running: false,
                cycles: 0,
            };

        case 'RESET':
            return {
                ...state,
                pomodoroPhase: 'focus',
                timeLeft: currentDuration({ ...state, pomodoroPhase: 'focus' }),
                running: false,
            };

        case 'TOGGLE_RUNNING':
            return { ...state, running: !state.running };

        default:
            return state;
    }
}

export function useTimer() {
    const [state, dispatch] = useReducer(reducer, {
        subMode: 'standard',
        pomodoroPhase: 'focus',
        timeLeft: TIMER_DURATIONS.standard,
        running: false,
        cycles: 0,
    });

    useEffect(() => {
        if (!state.running) return;
        const id = setInterval(() => dispatch({ type: 'TICK' }), 1000);
        return () => clearInterval(id);
    }, [state.running]);

    useEffect(() => {
        if (state.running && state.timeLeft === 0)
            dispatch({ type: 'COMPLETE' });
    }, [state.running, state.timeLeft]);

    useEffect(() => {
        if (!state.running && state.timeLeft === 0) {
            if (Notification.permission === 'default')
                void Notification.requestPermission();
            if (Notification.permission === 'granted') {
                const body =
                    state.subMode === 'pomodoro'
                        ? state.pomodoroPhase === 'focus'
                            ? 'Focus session complete — take a break.'
                            : `${POMODORO_PHASE_LABELS[state.pomodoroPhase]} over — back to focus.`
                        : 'Timer complete.';
                new Notification('Timekeeping', { body });
            }
        }
    }, [state.running, state.timeLeft, state.subMode, state.pomodoroPhase]);

    const setSubMode = useCallback(
        (s: TimerSubMode) => dispatch({ type: 'SET_SUBMODE', subMode: s }),
        [],
    );
    const reset = useCallback(() => dispatch({ type: 'RESET' }), []);
    const toggle = useCallback(() => {
        if (Notification.permission === 'default')
            void Notification.requestPermission();
        dispatch({ type: 'TOGGLE_RUNNING' });
    }, []);

    const total = currentDuration(state);
    const progress = 1 - state.timeLeft / total;
    const mins = String(Math.floor(state.timeLeft / 60)).padStart(2, '0');
    const secs = String(state.timeLeft % 60).padStart(2, '0');

    return { state, mins, secs, progress, setSubMode, reset, toggle };
}
