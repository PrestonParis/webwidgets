import type { TimerState, TimerAction } from '../types';
import { reducer, createInitialTimerState } from './timerReducer';
import { POMODORO_PHASE_LABELS } from '../constants';
import type { PomodoroPhase } from '../types';

const STANDARD_TIMER_STORAGE_KEY = 'webwidgets:standard-timer-state:v1';

export function fireTimerNotification(state: TimerState) {
    if (typeof window === 'undefined') return;
    if (Notification.permission !== 'granted') return;
    const body =
        state.subMode === 'pomodoro'
            ? state.pomodoroPhase === 'focus'
                ? 'Focus session complete — take a break.'
                : `${POMODORO_PHASE_LABELS[state.pomodoroPhase as PomodoroPhase]} over — back to focus.`
            : 'Timer complete.';
    new Notification('Time', { body });
}

let standardState = createInitialTimerState('standard');
let standardUpdatedAt = Date.now();
let standardHydrated = false;
let standardInterval: ReturnType<typeof setInterval> | null = null;
const standardListeners = new Set<() => void>();

function readStoredStandard(): { state: TimerState; updatedAt: number } | null {
    if (typeof window === 'undefined') return null;
    try {
        const raw = window.localStorage.getItem(STANDARD_TIMER_STORAGE_KEY);
        if (!raw) return null;
        const parsed = JSON.parse(raw) as {
            state?: TimerState;
            updatedAt?: number;
        };
        if (!parsed.state || typeof parsed.updatedAt !== 'number') return null;
        return { state: parsed.state, updatedAt: parsed.updatedAt };
    } catch {
        return null;
    }
}

function writeStoredStandard() {
    if (typeof window === 'undefined') return;
    try {
        window.localStorage.setItem(
            STANDARD_TIMER_STORAGE_KEY,
            JSON.stringify({
                state: standardState,
                updatedAt: standardUpdatedAt,
            }),
        );
    } catch {}
}

function hydrateStandard() {
    if (standardHydrated) return;
    standardHydrated = true;
    const stored = readStoredStandard();
    if (!stored) return;
    standardState = stored.state;
    standardUpdatedAt = stored.updatedAt;
    applyStandardElapsed();
}

function applyStandardElapsed() {
    if (!standardState.running) return;
    const elapsed = Math.max(
        0,
        Math.floor((Date.now() - standardUpdatedAt) / 1000),
    );
    if (elapsed <= 0) return;
    standardState =
        elapsed >= standardState.timeLeft
            ? { ...standardState, timeLeft: 0, running: false }
            : { ...standardState, timeLeft: standardState.timeLeft - elapsed };
    standardUpdatedAt = Date.now();
    writeStoredStandard();
}

function emitStandard() {
    for (const listener of standardListeners) listener();
}

function commitStandard(next: TimerState) {
    standardState = next;
    standardUpdatedAt = Date.now();
    writeStoredStandard();
    emitStandard();
}

export function dispatchStandard(action: TimerAction) {
    hydrateStandard();
    commitStandard(reducer(standardState, action));
}

function tickStandard() {
    hydrateStandard();
    standardState = reducer(standardState, { type: 'TICK' });
    standardUpdatedAt = Date.now();
    writeStoredStandard();
    if (standardState.running && standardState.timeLeft === 0) {
        standardState = reducer(standardState, { type: 'COMPLETE' });
        standardUpdatedAt = Date.now();
        writeStoredStandard();
        fireTimerNotification(standardState);
    }
    emitStandard();
}

export function getStandardSnapshot() {
    hydrateStandard();
    applyStandardElapsed();
    return standardState;
}

export function getStandardServerSnapshot() {
    return createInitialTimerState('standard');
}

export function subscribeStandard(listener: () => void) {
    hydrateStandard();
    applyStandardElapsed();
    standardListeners.add(listener);
    listener();
    if (!standardInterval) {
        standardInterval = setInterval(() => {
            if (standardState.running) tickStandard();
        }, 1000);
    }
    return () => {
        standardListeners.delete(listener);
        if (standardListeners.size === 0 && standardInterval) {
            clearInterval(standardInterval);
            standardInterval = null;
        }
    };
}
