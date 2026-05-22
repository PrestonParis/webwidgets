import {
    useReducer,
    useEffect,
    useCallback,
    useSyncExternalStore,
    useRef,
} from 'react';
import {
    TIMER_DURATIONS,
    POMODORO_PHASE_DURATIONS,
    POMODORO_PHASE_LABELS,
    DEFAULT_POMODORO_PLAN,
    DEFAULT_POMODORO_PLAN_CYCLES,
} from '../constants';
import type {
    TimerState,
    TimerAction,
    TimerSubMode,
    PomodoroPhase,
    PomodoroStep,
    PomodoroStepKind,
} from '../types';

const MIN_DURATION_SECONDS = 1;
const MAX_DURATION_SECONDS = 24 * 60 * 60;
const MAX_POMODORO_STEPS = 12;
const POMODORO_STORAGE_KEY = 'webwidgets:pomodoro-timer-state:v1';

function clampDuration(durationSeconds: number): number {
    return Math.max(
        MIN_DURATION_SECONDS,
        Math.min(durationSeconds, MAX_DURATION_SECONDS),
    );
}

function cloneDefaultPomodoroPlan(): PomodoroStep[] {
    return DEFAULT_POMODORO_PLAN.map((step) => ({ ...step }));
}

function firstPomodoroDuration(plan: PomodoroStep[]): number {
    return plan[0]?.durationSeconds ?? POMODORO_PHASE_DURATIONS.focus;
}

function stepDurationAt(plan: PomodoroStep[], index: number): number {
    return plan[index]?.durationSeconds ?? firstPomodoroDuration(plan);
}

function createPomodoroStep(kind: PomodoroStepKind): PomodoroStep {
    return {
        id: `${kind}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        kind,
        durationSeconds:
            kind === 'focus'
                ? POMODORO_PHASE_DURATIONS.focus
                : POMODORO_PHASE_DURATIONS.short,
    };
}

function pomodoroPhaseForStep(step: PomodoroStep | undefined): PomodoroPhase {
    return step?.kind === 'break' ? 'short' : 'focus';
}

function createInitialTimerState(initialSubMode: TimerSubMode): TimerState {
    const initialPomodoroPlan = cloneDefaultPomodoroPlan();
    return {
        subMode: initialSubMode,
        pomodoroPhase: 'focus',
        pomodoroPlan: initialPomodoroPlan,
        pomodoroStepIndex: 0,
        pomodoroPlanCycles: DEFAULT_POMODORO_PLAN_CYCLES,
        completedPlanCycles: 0,
        autoStartNext: true,
        durationSeconds:
            initialSubMode === 'pomodoro'
                ? firstPomodoroDuration(initialPomodoroPlan)
                : TIMER_DURATIONS[initialSubMode],
        timeLeft:
            initialSubMode === 'pomodoro'
                ? firstPomodoroDuration(initialPomodoroPlan)
                : TIMER_DURATIONS[initialSubMode],
        running: false,
        cycles: 0,
    };
}

function normalizePomodoroState(state: TimerState): TimerState {
    const plan =
        state.pomodoroPlan.length > 0
            ? state.pomodoroPlan.map((step) => ({
                  ...step,
                  durationSeconds: clampDuration(step.durationSeconds),
              }))
            : cloneDefaultPomodoroPlan();
    const pomodoroStepIndex = Math.min(
        Math.max(0, state.pomodoroStepIndex),
        plan.length - 1,
    );
    const pomodoroPlanCycles = Math.max(
        1,
        Math.min(state.pomodoroPlanCycles, 12),
    );
    return {
        ...state,
        subMode: 'pomodoro',
        pomodoroPlan: plan,
        pomodoroStepIndex,
        pomodoroPlanCycles,
        autoStartNext: state.autoStartNext ?? true,
        completedPlanCycles: Math.max(
            0,
            Math.min(state.completedPlanCycles, pomodoroPlanCycles),
        ),
        pomodoroPhase: pomodoroPhaseForStep(plan[pomodoroStepIndex]),
        timeLeft: Math.max(
            0,
            Math.min(state.timeLeft, stepDurationAt(plan, pomodoroStepIndex)),
        ),
    };
}

function currentDuration(state: TimerState): number {
    if (state.subMode === 'pomodoro')
        return stepDurationAt(state.pomodoroPlan, state.pomodoroStepIndex);
    return state.durationSeconds;
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
            {
                const currentStep = state.pomodoroPlan[state.pomodoroStepIndex];
                const cycles =
                    currentStep?.kind === 'focus'
                        ? state.cycles + 1
                        : state.cycles;
                const nextIndex = state.pomodoroStepIndex + 1;
                if (nextIndex < state.pomodoroPlan.length) {
                    const nextStep = state.pomodoroPlan[nextIndex];
                    return {
                        ...state,
                        pomodoroStepIndex: nextIndex,
                        pomodoroPhase: pomodoroPhaseForStep(nextStep),
                        timeLeft: stepDurationAt(state.pomodoroPlan, nextIndex),
                        running: state.autoStartNext,
                        cycles,
                    };
                }

                const completedPlanCycles = state.completedPlanCycles + 1;
                if (completedPlanCycles < state.pomodoroPlanCycles) {
                    const nextStep = state.pomodoroPlan[0];
                    return {
                        ...state,
                        pomodoroStepIndex: 0,
                        pomodoroPhase: pomodoroPhaseForStep(nextStep),
                        completedPlanCycles,
                        timeLeft: firstPomodoroDuration(state.pomodoroPlan),
                        running: state.autoStartNext,
                        cycles,
                    };
                }

                return {
                    ...state,
                    completedPlanCycles: state.pomodoroPlanCycles,
                    running: false,
                    cycles,
                };
            }

        case 'SET_SUBMODE': {
            const durationSeconds =
                action.subMode === 'pomodoro'
                    ? firstPomodoroDuration(state.pomodoroPlan)
                    : TIMER_DURATIONS[action.subMode];
            return {
                ...state,
                subMode: action.subMode,
                pomodoroPhase:
                    action.subMode === 'pomodoro'
                        ? pomodoroPhaseForStep(state.pomodoroPlan[0])
                        : 'focus',
                pomodoroStepIndex: 0,
                completedPlanCycles: 0,
                durationSeconds,
                timeLeft: durationSeconds,
                running: false,
                cycles: 0,
            };
        }

        case 'SET_DURATION':
            return {
                ...state,
                durationSeconds: action.durationSeconds,
                timeLeft: action.durationSeconds,
                running: false,
            };

        case 'ADD_POMODORO_STEP':
            if (state.pomodoroPlan.length >= MAX_POMODORO_STEPS) return state;
            return {
                ...state,
                pomodoroPlan: [
                    ...state.pomodoroPlan,
                    createPomodoroStep(action.kind),
                ],
                running: false,
            };

        case 'REMOVE_POMODORO_STEP': {
            if (state.pomodoroPlan.length <= 1) return state;
            const pomodoroPlan = state.pomodoroPlan.filter(
                (step) => step.id !== action.id,
            );
            const pomodoroStepIndex = Math.min(
                state.pomodoroStepIndex,
                pomodoroPlan.length - 1,
            );
            return {
                ...state,
                pomodoroPlan,
                pomodoroStepIndex,
                pomodoroPhase: pomodoroPhaseForStep(
                    pomodoroPlan[pomodoroStepIndex],
                ),
                timeLeft: stepDurationAt(pomodoroPlan, pomodoroStepIndex),
                running: false,
            };
        }

        case 'SET_POMODORO_STEP_KIND': {
            const pomodoroPlan = state.pomodoroPlan.map((step) =>
                step.id === action.id ? { ...step, kind: action.kind } : step,
            );
            const currentStep = pomodoroPlan[state.pomodoroStepIndex];
            return {
                ...state,
                pomodoroPlan,
                pomodoroPhase: pomodoroPhaseForStep(currentStep),
                running: false,
            };
        }

        case 'SET_POMODORO_STEP_DURATION': {
            const durationSeconds = clampDuration(action.durationSeconds);
            const pomodoroPlan = state.pomodoroPlan.map((step) =>
                step.id === action.id ? { ...step, durationSeconds } : step,
            );
            return {
                ...state,
                pomodoroPlan,
                timeLeft:
                    pomodoroPlan[state.pomodoroStepIndex]?.id === action.id
                        ? durationSeconds
                        : state.timeLeft,
                running: false,
            };
        }

        case 'SET_POMODORO_PLAN_CYCLES':
            return {
                ...state,
                pomodoroPlanCycles: Math.max(1, Math.min(action.cycles, 12)),
                completedPlanCycles: 0,
                pomodoroStepIndex: 0,
                pomodoroPhase: pomodoroPhaseForStep(state.pomodoroPlan[0]),
                timeLeft: firstPomodoroDuration(state.pomodoroPlan),
                running: false,
                cycles: 0,
            };

        case 'SET_AUTO_START_NEXT':
            return {
                ...state,
                autoStartNext: action.enabled,
            };

        case 'RESET':
            if (state.subMode === 'pomodoro') {
                return {
                    ...state,
                    pomodoroPhase: pomodoroPhaseForStep(state.pomodoroPlan[0]),
                    pomodoroStepIndex: 0,
                    completedPlanCycles: 0,
                    timeLeft: firstPomodoroDuration(state.pomodoroPlan),
                    running: false,
                    cycles: 0,
                };
            }
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

// ─── Notification helper ──────────────────────────────────────────────────────

function fireTimerNotification(state: TimerState) {
    if (typeof window === 'undefined') return;
    if (Notification.permission !== 'granted') return;
    const body =
        state.subMode === 'pomodoro'
            ? state.pomodoroPhase === 'focus'
                ? 'Focus session complete — take a break.'
                : `${POMODORO_PHASE_LABELS[state.pomodoroPhase]} over — back to focus.`
            : 'Timer complete.';
    new Notification('Time', { body });
}

// ─── Standard timer global store ─────────────────────────────────────────────

const STANDARD_TIMER_STORAGE_KEY = 'webwidgets:standard-timer-state:v1';

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
    if (elapsed >= standardState.timeLeft) {
        standardState = { ...standardState, timeLeft: 0, running: false };
    } else {
        standardState = {
            ...standardState,
            timeLeft: standardState.timeLeft - elapsed,
        };
    }
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

function dispatchStandard(action: TimerAction) {
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

function getStandardSnapshot() {
    hydrateStandard();
    applyStandardElapsed();
    return standardState;
}

function getStandardServerSnapshot() {
    return createInitialTimerState('standard');
}

function subscribeStandard(listener: () => void) {
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

// ─── Pomodoro global store ────────────────────────────────────────────────────

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
    } catch {
        // localStorage persistence is best-effort; in-memory sync still works.
    }
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
        if (prevRunning && !pomodoroState.running) {
            fireTimerNotification(pomodoroState);
        }
    }
    emitPomodoroState();
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

function dispatchPomodoro(action: TimerAction) {
    hydratePomodoroState();
    commitPomodoroState(reducer(pomodoroState, action));
}

function getPomodoroSnapshot() {
    hydratePomodoroState();
    applyPomodoroElapsed();
    return pomodoroState;
}

function getPomodoroServerSnapshot() {
    return createInitialTimerState('pomodoro');
}

function subscribePomodoro(listener: () => void) {
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
        // Global stores fire their own notifications; only handle 'long' (local) here.
        // Guard against mount-time firing by requiring a true→false transition.
        if (
            !useSharedPomodoro &&
            !useSharedStandard &&
            wasRunning &&
            !state.running &&
            state.timeLeft === 0
        ) {
            if (Notification.permission === 'granted') {
                new Notification('Time', { body: 'Timer complete.' });
            }
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
    const mins = String(Math.floor(state.timeLeft / 60)).padStart(2, '0');
    const displayMinutes = String(
        hours > 0
            ? Math.floor((state.timeLeft % 3600) / 60)
            : Math.floor(state.timeLeft / 60),
    ).padStart(2, '0');
    const secs = String(state.timeLeft % 60).padStart(2, '0');
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
