'use client';

import { Timer } from 'lucide-react';
import WidgetShell from '@/features/widgets/components/WidgetShell';
import { useWidgetSettings } from '@/features/widgets/hooks/useWidgetSettings';
import { ModePicker } from './ModePicker';
import { TimerMode } from './TimerMode';
import { StopwatchMode } from './StopwatchMode';
import { EventMode } from './EventMode';
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
            title="Timekeeping"
            settings={settings}
            onSettingsChange={updateSettings}
            widgetId="timekeeping"
            widgetType="timekeeping"
            footerHref="/timekeeping"
            footerLabel="Open full page →"
        >
            <div className="flex flex-col items-center w-full">
                <ModePicker
                    mode={mode}
                    onChange={(m) => updateSettings({ timekeepingMode: m })}
                />
                {mode === 'timer' && <TimerMode />}
                {mode === 'stopwatch' && <StopwatchMode />}
                {mode === 'event' && <EventMode />}
            </div>
        </WidgetShell>
    );
}
