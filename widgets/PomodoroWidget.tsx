'use client';

import { Timer } from 'lucide-react';
import WidgetShell from '@/features/widgets/components/WidgetShell';
import { useWidgetSettings } from '@/features/widgets/hooks/useWidgetSettings';
import { usePomodoroTimer } from '@/features/pomodoro/hooks/usePomodoroTimer';
import { ModeSelector } from '@/features/pomodoro/components/ModeSelector';
import { TimerDisplay } from '@/features/pomodoro/components/TimerDisplay';
import { TimerControls } from '@/features/pomodoro/components/TimerControls';
import { TimerStats } from '@/features/pomodoro/components/TimerStats';

export default function PomodoroWidget() {
    const { settings, updateSettings } = useWidgetSettings(
        'pomodoro',
        'pomodoro',
    );
    const {
        state,
        mins,
        secs,
        radius,
        circumference,
        strokeDashoffset,
        switchMode,
        reset,
        toggleRunning,
    } = usePomodoroTimer();

    return (
        <WidgetShell
            title="Pomodoro Timer"
            icon={<Timer className="h-4 w-4" />}
            settings={settings}
            onSettingsChange={updateSettings}
            widgetId="pomodoro"
            widgetType="pomodoro"
        >
            <div className="flex flex-col items-center justify-center p-4 space-y-6">
                <ModeSelector mode={state.mode} onSwitch={switchMode} />
                <TimerDisplay
                    mins={mins}
                    secs={secs}
                    mode={state.mode}
                    cycles={state.cycles}
                    radius={radius}
                    circumference={circumference}
                    strokeDashoffset={strokeDashoffset}
                />
                <TimerControls
                    running={state.running}
                    onToggle={toggleRunning}
                    onReset={reset}
                />
                <TimerStats cycles={state.cycles} />
            </div>
        </WidgetShell>
    );
}
