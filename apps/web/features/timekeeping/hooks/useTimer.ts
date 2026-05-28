import {
    useReducer,
    useEffect,
    useCallback,
    useSyncExternalStore,
    useRef,
} from 'react';
import {
    reducer,
    createInitialTimerState,
    currentDuration,
    clampDuration,
} from '../lib/timerReducer';
import {
    subscribeStandard,
    getStandardSnapshot,
    getStandardServerSnapshot,
    dispatchStandard,
} from '../lib/standardTimerStore';
import {
    subscribePomodoro,
    getPomodoroSnapshot,
    getPomodoroServerSnapshot,
    dispatchPomodoro,
} from '../lib/pomodoroStore';
import type { TimerSubMode, PomodoroStepKind } from '../types';

export function useTimer(initialSubMode: TimerSubMode = 'standard') {
    const [localState, localDispatch] = useReducer(
        reducer,
        initialSubMode,
        createInitialTimerState,
    );
    const sharedPomodoroState = useSyncExternalStore(
        subscribePomodoro,
        getPomodoroSnapshot,
        getPomodoroServerSnapshot,
    );
    const sharedStandardState = useSyncExternalStore(
        subscribeStandard,
        getStandardSnapshot,
        getStandardServerSnapshot,
    );

    const useSharedPomodoro = initialSubMode === 'pomodoro';
    const useSharedStandard = initialSubMode === 'standard';
    const state = useSharedPomodoro
        ? sharedPomodoroState
        : useSharedStandard
          ? sharedStandardState
          : localState;
    const dispatch = useSharedPomodoro
        ? dispatchPomodoro
        : useSharedStandard
          ? dispatchStandard
          : localDispatch;

    useEffect(() => {
        if (useSharedPomodoro || useSharedStandard || !state.running) return;
        const id = setInterval(() => dispatch({ type: 'TICK' }), 1000);
        return () => clearInterval(id);
    }, [dispatch, state.running, useSharedPomodoro, useSharedStandard]);

    useEffect(() => {
        if (state.running && state.timeLeft === 0)
            dispatch({ type: 'COMPLETE' });
    }, [dispatch, state.running, state.timeLeft]);

    const prevRunningRef = useRef(state.running);
    useEffect(() => {
        if (Notification.permission === 'default')
            void Notification.requestPermission();
        const wasRunning = prevRunningRef.current;
        prevRunningRef.current = state.running;
        if (
            !useSharedPomodoro &&
            !useSharedStandard &&
            wasRunning &&
            !state.running &&
            state.timeLeft === 0
        ) {
            if (Notification.permission === 'granted')
                new Notification('Time', { body: 'Timer complete.' });
        }
    }, [state.running, state.timeLeft, useSharedPomodoro, useSharedStandard]);

    const setSubMode = useCallback(
        (s: TimerSubMode) => dispatch({ type: 'SET_SUBMODE', subMode: s }),
        [dispatch],
    );
    const setDurationSeconds = useCallback(
        (durationSeconds: number) =>
            dispatch({
                type: 'SET_DURATION',
                durationSeconds: clampDuration(durationSeconds),
            }),
        [dispatch],
    );
    const addPomodoroStep = useCallback(
        (kind: PomodoroStepKind) =>
            dispatch({ type: 'ADD_POMODORO_STEP', kind }),
        [dispatch],
    );
    const removePomodoroStep = useCallback(
        (id: string) => dispatch({ type: 'REMOVE_POMODORO_STEP', id }),
        [dispatch],
    );
    const setPomodoroStepKind = useCallback(
        (id: string, kind: PomodoroStepKind) =>
            dispatch({ type: 'SET_POMODORO_STEP_KIND', id, kind }),
        [dispatch],
    );
    const setPomodoroStepDuration = useCallback(
        (id: string, durationSeconds: number) =>
            dispatch({
                type: 'SET_POMODORO_STEP_DURATION',
                id,
                durationSeconds,
            }),
        [dispatch],
    );
    const setPomodoroPlanCycles = useCallback(
        (cycles: number) =>
            dispatch({ type: 'SET_POMODORO_PLAN_CYCLES', cycles }),
        [dispatch],
    );
    const setAutoStartNext = useCallback(
        (enabled: boolean) =>
            dispatch({ type: 'SET_AUTO_START_NEXT', enabled }),
        [dispatch],
    );
    const reset = useCallback(() => dispatch({ type: 'RESET' }), [dispatch]);
    const toggle = useCallback(() => {
        if (Notification.permission === 'default')
            void Notification.requestPermission();
        dispatch({ type: 'TOGGLE_RUNNING' });
    }, [dispatch]);

    const total = currentDuration(state);
    const progress = 1 - state.timeLeft / total;
    const hours = Math.floor(state.timeLeft / 3600);
    const displayMinutes = String(
        hours > 0
            ? Math.floor((state.timeLeft % 3600) / 60)
            : Math.floor(state.timeLeft / 60),
    ).padStart(2, '0');
    const secs = String(state.timeLeft % 60).padStart(2, '0');
    const mins = String(Math.floor(state.timeLeft / 60)).padStart(2, '0');
    const displayTime =
        hours > 0
            ? `${String(hours).padStart(2, '0')}:${displayMinutes}:${secs}`
            : `${displayMinutes}:${secs}`;

    return {
        state,
        mins,
        secs,
        displayTime,
        progress,
        setSubMode,
        setDurationSeconds,
        addPomodoroStep,
        removePomodoroStep,
        setPomodoroStepKind,
        setPomodoroStepDuration,
        setPomodoroPlanCycles,
        setAutoStartNext,
        reset,
        toggle,
    };
}
