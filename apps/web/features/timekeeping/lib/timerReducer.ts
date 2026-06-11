import { TIMER_DURATIONS, DEFAULT_POMODORO_PLAN_CYCLES } from '../constants';
import type {
    TimerState,
    TimerAction,
    TimerSubMode,
    PomodoroStep,
    PomodoroStepKind,
} from '../types/timekeeping';
import {
    clampDuration,
    cloneDefaultPomodoroPlan,
    createPomodoroStep,
    firstPomodoroDuration,
    pomodoroPhaseForStep,
    stepDurationAt,
} from './timerReducerHelpers';

const MAX_POMODORO_STEPS = 12;

export {
    clampDuration,
    firstPomodoroDuration,
    pomodoroPhaseForStep,
    stepDurationAt,
} from './timerReducerHelpers';

export function createInitialTimerState(
    initialSubMode: TimerSubMode,
): TimerState {
    const initialPomodoroPlan = cloneDefaultPomodoroPlan();
    const duration =
        initialSubMode === 'pomodoro'
            ? firstPomodoroDuration(initialPomodoroPlan)
            : TIMER_DURATIONS[initialSubMode];
    return {
        subMode: initialSubMode,
        pomodoroPhase: 'focus',
        pomodoroPlan: initialPomodoroPlan,
        pomodoroStepIndex: 0,
        pomodoroPlanCycles: DEFAULT_POMODORO_PLAN_CYCLES,
        completedPlanCycles: 0,
        autoStartNext: true,
        durationSeconds: duration,
        timeLeft: duration,
        running: false,
        cycles: 0,
    };
}

export function normalizePomodoroState(state: TimerState): TimerState {
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

export function currentDuration(state: TimerState): number {
    if (state.subMode === 'pomodoro')
        return stepDurationAt(state.pomodoroPlan, state.pomodoroStepIndex);
    return state.durationSeconds;
}

export function reducer(state: TimerState, action: TimerAction): TimerState {
    switch (action.type) {
        case 'TICK':
            if (!state.running || state.timeLeft === 0) return state;
            return { ...state, timeLeft: state.timeLeft - 1 };

        case 'COMPLETE':
            if (!state.running || state.timeLeft !== 0) return state;
            if (state.subMode !== 'pomodoro')
                return { ...state, running: false };
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
            return {
                ...state,
                pomodoroPlan,
                pomodoroPhase: pomodoroPhaseForStep(
                    pomodoroPlan[state.pomodoroStepIndex],
                ),
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
            return { ...state, autoStartNext: action.enabled };

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
