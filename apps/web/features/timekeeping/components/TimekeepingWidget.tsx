'use client';

import { Timer } from 'lucide-react';
import WidgetShell from '@/features/widgets/components/WidgetShell';
import { useWidgetSettings } from '@/features/widgets/hooks/useWidgetSettings';
import { ModePicker } from './ModePicker';
import { PomodoroMode, TimerMode } from './TimerMode';
import { StopwatchMode } from './StopwatchMode';
import { EventMode } from './EventMode';
import { WorldClockPage } from '@/features/worldclock/components/WorldClockPage';
import { TimeclockMode } from '@/features/timekeeping/components/TimeclockMode';
import type { TimekeepingMode } from '@/features/widgets/types/widgets';

export default function TimekeepingWidget() {
    const { settings, updateSettings } = useWidgetSettings(
        'timekeeping',
        'timekeeping',
    );
    const mode: TimekeepingMode = settings.timekeepingMode ?? 'timer';

    return (
        <WidgetShell
            icon={<Timer size={16} />}
            title="Time"
            settings={settings}
            onSettingsChange={updateSettings}
            widgetId="timekeeping"
            widgetType="timekeeping"
            footerHref={`/time?mode=${mode}`}
            footerLabel="Open full page →"
        >
            <div className="flex flex-col items-center w-full">
                <ModePicker
                    mode={mode}
                    onChange={(m) => updateSettings({ timekeepingMode: m })}
                />
                {mode === 'timer' && <TimerMode />}
                {mode === 'pomodoro' && <PomodoroMode />}
                {mode === 'stopwatch' && <StopwatchMode />}
                {mode === 'countdown' && (
                    <div className="flex flex-col items-center w-full gap-6">
                        <TimerMode />
                        <div className="w-full border-t border-stone-100 dark:border-zinc-800" />
                        <EventMode />
                    </div>
                )}
                {mode === 'worldclock' && <WorldClockPage embedded />}
                {mode === 'timeclock' && <TimeclockMode />}
            </div>
        </WidgetShell>
    );
}
