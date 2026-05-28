import { useReducer, useEffect, useRef, useCallback, useState } from 'react';
import type { StopwatchState, StopwatchAction, LapEntry } from '../types';

const STOPWATCH_STORAGE_KEY = 'webwidgets:stopwatch-state:v1';

interface StoredStopwatch {
    elapsed: number;
    laps: LapEntry[];
    running: boolean;
    savedAt: number;
}

function loadStopwatchState(): StopwatchState {
    if (typeof window === 'undefined')
        return { running: false, elapsed: 0, laps: [] };
    try {
        const raw = window.localStorage.getItem(STOPWATCH_STORAGE_KEY);
        if (!raw) return { running: false, elapsed: 0, laps: [] };
        const stored = JSON.parse(raw) as StoredStopwatch;
        const elapsed = stored.running
            ? Math.max(0, stored.elapsed + (Date.now() - stored.savedAt))
            : stored.elapsed;
        return { running: stored.running, elapsed, laps: stored.laps ?? [] };
    } catch {
        return { running: false, elapsed: 0, laps: [] };
    }
}

function saveStopwatchState(state: StopwatchState) {
    if (typeof window === 'undefined') return;
    try {
        const stored: StoredStopwatch = {
            elapsed: state.elapsed,
            laps: state.laps,
            running: state.running,
            savedAt: Date.now(),
        };
        window.localStorage.setItem(
            STOPWATCH_STORAGE_KEY,
            JSON.stringify(stored),
        );
    } catch {}
}

function reducer(
    state: StopwatchState,
    action: StopwatchAction,
): StopwatchState {
    switch (action.type) {
        case 'TICK':
            return { ...state, elapsed: action.ms };

        case 'TOGGLE_RUNNING':
            return { ...state, running: !state.running };

        case 'LAP': {
            const prev = state.laps[state.laps.length - 1]?.elapsed ?? 0;
            const lap: LapEntry = {
                index: state.laps.length + 1,
                elapsed: action.elapsed,
                delta: action.elapsed - prev,
            };
            return { ...state, laps: [...state.laps, lap] };
        }

        case 'RESET':
            return { running: false, elapsed: 0, laps: [] };

        default:
            return state;
    }
}

function fmtMs(ms: number): string {
    const totalSecs = Math.floor(ms / 1000);
    const h = Math.floor(totalSecs / 3600);
    const m = Math.floor((totalSecs % 3600) / 60);
    const s = totalSecs % 60;
    const ds = Math.floor((ms % 1000) / 100); // decisecond
    const time =
        h > 0
            ? `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
            : `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
    return `${time}.${ds}`;
}

export function useStopwatch() {
    const [initialState] = useState(loadStopwatchState);
    const [state, dispatch] = useReducer(reducer, initialState);
    const startRef = useRef<number>(0);
    const baseRef = useRef<number>(initialState.elapsed);

    useEffect(() => {
        if (!state.running) return;
        startRef.current = Date.now();
        const id = setInterval(() => {
            dispatch({
                type: 'TICK',
                ms: baseRef.current + (Date.now() - startRef.current),
            });
        }, 100);
        return () => clearInterval(id);
    }, [state.running]);

    useEffect(() => {
        saveStopwatchState(state);
    }, [state]);

    const toggle = useCallback(() => {
        if (!state.running) {
            startRef.current = Date.now();
        } else {
            baseRef.current = state.elapsed;
        }
        dispatch({ type: 'TOGGLE_RUNNING' });
    }, [state.running, state.elapsed]);

    const lap = useCallback(() => {
        if (state.running) dispatch({ type: 'LAP', elapsed: state.elapsed });
    }, [state.running, state.elapsed]);

    const reset = useCallback(() => {
        baseRef.current = 0;
        dispatch({ type: 'RESET' });
    }, []);

    return {
        running: state.running,
        display: fmtMs(state.elapsed),
        elapsed: state.elapsed,
        laps: state.laps,
        toggle,
        lap,
        reset,
        fmtMs,
    };
}
