'use client';

import { Timer } from 'lucide-react';
import WidgetShell from '@/features/widgets/components/WidgetShell';
import { useWidgetSettings } from '@/features/widgets/hooks/useWidgetSettings';
import { ModePicker } from './ModePicker';
import { PomodoroMode, TimerMode } from './TimerMode';
import { StopwatchMode } from './StopwatchMode';
import { EventMode } from './EventMode';
import { WorldClockPage } from '@/features/worldclock/components/WorldClockPage';
import type { TimekeepingMode } from '@/features/widgets/types/widgets';

export default function TimekeepingWidget() {
    const { settings, updateSettings } = useWidgetSettings(
        'timekeeping',
        'timekeeping',
    );
    const mode: TimekeepingMode =
        settings.timekeepingMode === 'countdown'
            ? 'timer'
            : (settings.timekeepingMode ?? 'timer');
    const widgetModes = [
        { value: 'timer' as const, label: 'Timer' },
        { value: 'pomodoro' as const, label: 'Pomodoro' },
        { value: 'stopwatch' as const, label: 'Stopwatch' },
        { value: 'worldclock' as const, label: 'World Clock' },
    ];
    const settingsSlot = (
        <div>
            <p className="text-xs font-bold mb-2">Event countdowns</p>
            <EventMode />
        </div>
    );

    return (
        <WidgetShell
            icon={<Timer size={16} />}
            title="Time"
            settings={settings}
            onSettingsChange={updateSettings}
            settingsSlot={settingsSlot}
            widgetId="timekeeping"
            widgetType="timekeeping"
            footerHref={`/time?mode=${mode}`}
            footerLabel="Open full page →"
        >
            <div className="flex flex-col items-center w-full">
                <ModePicker
                    mode={mode}
                    modes={widgetModes}
                    onChange={(m) => updateSettings({ timekeepingMode: m })}
                />
                {mode === 'timer' && <TimerMode />}
                {mode === 'pomodoro' && <PomodoroMode />}
                {mode === 'stopwatch' && <StopwatchMode />}
                {mode === 'worldclock' && <WorldClockPage embedded />}
            </div>
        </WidgetShell>
    );
}
