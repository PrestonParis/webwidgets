'use client';

import { useEffect, useCallback, useReducer } from 'react';
import { Timer } from 'lucide-react';
import WidgetShell from '@/components/widgets/WidgetShell';
import { useWidgetSettings } from '@/hooks/dashboard/useWidgetSettings';
import { DURATIONS, LABELS } from '@/features/pomodoro/constants';
import { TimerState, TimerAction, Mode } from '@/types/pomodoro';

// Reducer function
function timerReducer(state: TimerState, action: TimerAction): TimerState {
    switch (action.type) {
        case 'TICK':
            // Only decrement if running and time left > 0
            if (!state.running || state.timeLeft === 0) return state;
            return { ...state, timeLeft: state.timeLeft - 1 };

        case 'COMPLETE':
            // Only handle completion if timer is running and hit zero
            if (!state.running || state.timeLeft !== 0) return state;

            // Handle notification (side effect - handled in component)

            // Transition logic
            if (state.mode === 'focus') {
                const nextCycles = state.cycles + 1;
                const nextMode: Mode = nextCycles % 4 === 0 ? 'long' : 'short';
                return {
                    mode: nextMode,
                    timeLeft: DURATIONS[nextMode],
                    running: false,
                    cycles: nextCycles,
                };
            } else {
                return {
                    mode: 'focus',
                    timeLeft: DURATIONS.focus,
                    running: false,
                    cycles: state.cycles,
                };
            }

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

export default function PomodoroWidget() {
    const { settings, updateSettings } = useWidgetSettings(
        'pomodoro',
        'pomodoro',
    );

    const [state, dispatch] = useReducer(timerReducer, {
        mode: 'focus',
        timeLeft: DURATIONS.focus,
        running: false,
        cycles: 0,
    });

    // Handle tick interval
    useEffect(() => {
        if (!state.running) return;

        const id = setInterval(() => {
            dispatch({ type: 'TICK' });
        }, 1000);

        return () => clearInterval(id);
    }, [state.running]);

    // Handle timer completion (side effects like notifications)
    useEffect(() => {
        // Check if timer just completed (running became false and timeLeft is 0)
        if (!state.running && state.timeLeft === 0) {
            // Request notification permission if needed
            if (Notification.permission === 'default') {
                Notification.requestPermission();
            }

            // Show notification if granted
            if (Notification.permission === 'granted') {
                const isFocusComplete = state.mode === 'focus';
                new Notification('Pomodoro', {
                    body: isFocusComplete
                        ? 'Focus session complete! Time for a break.'
                        : 'Break over — back to focus.',
                });
            }
        }
    }, [state.running, state.timeLeft, state.mode]);

    // Handle completion state transition
    useEffect(() => {
        // When timer hits zero and is running, dispatch COMPLETE
        if (state.running && state.timeLeft === 0) {
            dispatch({ type: 'COMPLETE' });
        }
    }, [state.running, state.timeLeft]);

    const switchMode = useCallback((mode: Mode) => {
        dispatch({ type: 'SWITCH_MODE', mode });
    }, []);

    const reset = useCallback(() => {
        dispatch({ type: 'RESET' });
    }, []);

    const requestNotify = useCallback(() => {
        if (Notification.permission === 'default') {
            Notification.requestPermission();
        }
    }, []);

    const toggleRunning = useCallback(() => {
        requestNotify();
        dispatch({ type: 'TOGGLE_RUNNING' });
    }, [requestNotify]);

    const mins = String(Math.floor(state.timeLeft / 60)).padStart(2, '0');
    const secs = String(state.timeLeft % 60).padStart(2, '0');
    const progress = 1 - state.timeLeft / DURATIONS[state.mode];

    // Calculate circle properties for the timer display
    const radius = 120;
    const circumference = 2 * Math.PI * radius;
    const strokeDashoffset = circumference * (1 - progress);

    return (
        <WidgetShell
            title="Pomodoro Timer"
            icon={<Timer className="h-4 w-4" />}
            settings={settings}
            onSettingsChange={updateSettings}
        >
            <div className="flex flex-col items-center justify-center p-4 space-y-6">
                {/* Mode selector */}
                <div className="flex gap-2 bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
                    {(['focus', 'short', 'long'] as Mode[]).map((m) => (
                        <button
                            key={m}
                            onClick={() => switchMode(m)}
                            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                                state.mode === m
                                    ? 'bg-primary text-primary-foreground shadow-sm'
                                    : 'hover:bg-gray-200 dark:hover:bg-gray-700'
                            }`}
                        >
                            {LABELS[m]}
                        </button>
                    ))}
                </div>

                {/* Timer circle */}
                <div className="relative">
                    <svg className="w-64 h-64 transform -rotate-90">
                        <circle
                            cx="128"
                            cy="128"
                            r={radius}
                            stroke="currentColor"
                            strokeWidth="8"
                            fill="none"
                            className="text-gray-200 dark:text-gray-700"
                        />
                        <circle
                            cx="128"
                            cy="128"
                            r={radius}
                            stroke="currentColor"
                            strokeWidth="8"
                            fill="none"
                            strokeDasharray={circumference}
                            strokeDashoffset={strokeDashoffset}
                            className="text-primary transition-all duration-1000 ease-linear"
                            strokeLinecap="round"
                        />
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                        <div className="text-5xl font-mono font-bold tabular-nums">
                            {mins}:{secs}
                        </div>
                        <div className="text-sm text-muted-foreground mt-2">
                            {state.mode === 'focus'
                                ? `Session ${state.cycles + 1}`
                                : state.mode === 'long'
                                  ? 'Long Break'
                                  : 'Short Break'}
                        </div>
                    </div>
                </div>

                {/* Controls */}
                <div className="flex gap-4">
                    <button
                        onClick={toggleRunning}
                        className="px-6 py-2 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 transition-colors"
                    >
                        {state.running ? 'Pause' : 'Start'}
                    </button>
                    <button
                        onClick={reset}
                        className="px-6 py-2 bg-gray-200 dark:bg-gray-700 rounded-lg font-medium hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
                    >
                        Reset
                    </button>
                </div>

                {/* Stats */}
                <div className="text-sm text-muted-foreground">
                    Completed focus sessions: {state.cycles}
                </div>
            </div>
        </WidgetShell>
    );
}
