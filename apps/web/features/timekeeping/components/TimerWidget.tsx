'use client';

import { Timer } from 'lucide-react';
import WidgetShell from '@/features/widgets/components/WidgetShell';
import { useWidgetSettings } from '@/features/widgets/hooks/useWidgetSettings';
import { TimerMode } from './TimerMode';

export default function TimerWidget() {
    const { settings, updateSettings } = useWidgetSettings('timer', 'timer');

    return (
        <WidgetShell
            title="Timer"
            icon={<Timer className="h-4 w-4" />}
            settings={settings}
            onSettingsChange={updateSettings}
            widgetId="timer"
            widgetType="timer"
            footerHref="/time?mode=timer"
            footerLabel="Open timer →"
        >
            <TimerMode />
        </WidgetShell>
    );
}
