'use client';

import { Timer } from 'lucide-react';
import WidgetShell from '@/features/widgets/components/WidgetShell';
import { useWidgetSettings } from '@/features/widgets/hooks/useWidgetSettings';
import { PomodoroMode } from '@/features/timekeeping/components/TimerMode';

export default function PomodoroWidget() {
    const { settings, updateSettings } = useWidgetSettings(
        'pomodoro',
        'pomodoro',
    );

    return (
        <WidgetShell
            title="Pomodoro Timer"
            icon={<Timer className="h-4 w-4" />}
            settings={settings}
            onSettingsChange={updateSettings}
            widgetId="pomodoro"
            widgetType="pomodoro"
            footerHref="/time?mode=pomodoro"
            footerLabel="Open timer →"
        >
            <PomodoroMode />
        </WidgetShell>
    );
}
