import type { TimerState, TimerAction } from '../types/timekeeping';
import {
    reducer,
    createInitialTimerState,
    normalizePomodoroState,
} from './timerReducer';
import { fireTimerNotification } from './standardTimerStore';

const POMODORO_STORAGE_KEY = 'webwidgets:pomodoro-timer-state:v1';

interface StoredPomodoroState {
    state: TimerState;
    updatedAt: number;
}

let pomodoroState = createInitialTimerState('pomodoro');
let pomodoroUpdatedAt = Date.now();
let pomodoroHydrated = false;
let pomodoroInterval: ReturnType<typeof setInterval> | null = null;
const pomodoroListeners = new Set<() => void>();

function readStoredPomodoroState(): StoredPomodoroState | null {
    if (typeof window === 'undefined') return null;
    try {
        const raw = window.localStorage.getItem(POMODORO_STORAGE_KEY);
        if (!raw) return null;
        const parsed = JSON.parse(raw) as Partial<StoredPomodoroState>;
        if (!parsed.state || typeof parsed.updatedAt !== 'number') return null;
        return {
            state: normalizePomodoroState(parsed.state),
            updatedAt: parsed.updatedAt,
        };
    } catch {
        return null;
    }
}

function writeStoredPomodoroState() {
    if (typeof window === 'undefined') return;
    try {
        window.localStorage.setItem(
            POMODORO_STORAGE_KEY,
            JSON.stringify({
                state: pomodoroState,
                updatedAt: pomodoroUpdatedAt,
            }),
        );
    } catch {}
}

function hydratePomodoroState() {
    if (pomodoroHydrated) return;
    pomodoroHydrated = true;
    const stored = readStoredPomodoroState();
    if (!stored) return;
    pomodoroState = stored.state;
    pomodoroUpdatedAt = stored.updatedAt;
    applyPomodoroElapsed();
}

function applyPomodoroElapsed() {
    if (!pomodoroState.running) return;
    let elapsed = Math.max(
        0,
        Math.floor((Date.now() - pomodoroUpdatedAt) / 1000),
    );
    if (elapsed <= 0) return;
    let next = pomodoroState;
    while (elapsed > 0 && next.running) {
        if (elapsed < next.timeLeft) {
            next = { ...next, timeLeft: next.timeLeft - elapsed };
            elapsed = 0;
        } else {
            elapsed -= next.timeLeft;
            next = reducer({ ...next, timeLeft: 0 }, { type: 'COMPLETE' });
            if (!next.running || next.timeLeft === 0) break;
        }
    }
    pomodoroState = normalizePomodoroState(next);
    pomodoroUpdatedAt = Date.now();
    writeStoredPomodoroState();
}

function emitPomodoroState() {
    for (const listener of pomodoroListeners) listener();
}

function commitPomodoroState(next: TimerState) {
    pomodoroState = normalizePomodoroState(next);
    pomodoroUpdatedAt = Date.now();
    writeStoredPomodoroState();
    emitPomodoroState();
}

export function dispatchPomodoro(action: TimerAction) {
    hydratePomodoroState();
    commitPomodoroState(reducer(pomodoroState, action));
}

function tickPomodoro() {
    hydratePomodoroState();
    pomodoroState = normalizePomodoroState(
        reducer(pomodoroState, { type: 'TICK' }),
    );
    pomodoroUpdatedAt = Date.now();
    writeStoredPomodoroState();
    if (pomodoroState.running && pomodoroState.timeLeft === 0) {
        const prevRunning = pomodoroState.running;
        pomodoroState = normalizePomodoroState(
            reducer(pomodoroState, { type: 'COMPLETE' }),
        );
        pomodoroUpdatedAt = Date.now();
        writeStoredPomodoroState();
        if (prevRunning && !pomodoroState.running)
            fireTimerNotification(pomodoroState);
    }
    emitPomodoroState();
}

export function getPomodoroSnapshot() {
    hydratePomodoroState();
    applyPomodoroElapsed();
    return pomodoroState;
}

export function getPomodoroServerSnapshot() {
    return createInitialTimerState('pomodoro');
}

export function subscribePomodoro(listener: () => void) {
    hydratePomodoroState();
    applyPomodoroElapsed();
    pomodoroListeners.add(listener);
    listener();
    if (!pomodoroInterval) {
        pomodoroInterval = setInterval(() => {
            if (pomodoroState.running) tickPomodoro();
        }, 1000);
    }
    return () => {
        pomodoroListeners.delete(listener);
        if (pomodoroListeners.size === 0 && pomodoroInterval) {
            clearInterval(pomodoroInterval);
            pomodoroInterval = null;
        }
    };
}
