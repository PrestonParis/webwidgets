'use client';

import { Timer } from 'lucide-react';
import WidgetShell from '@/features/widgets/components/WidgetShell';
import { useWidgetSettings } from '@/features/widgets/hooks/useWidgetSettings';
import { StopwatchMode } from './StopwatchMode';

export default function StopwatchWidget() {
    const { settings, updateSettings } = useWidgetSettings(
        'stopwatch',
        'stopwatch',
    );

    return (
        <WidgetShell
            title="Stopwatch"
            icon={<Timer className="h-4 w-4" />}
            settings={settings}
            onSettingsChange={updateSettings}
            widgetId="stopwatch"
            widgetType="stopwatch"
            footerHref="/time?mode=stopwatch"
            footerLabel="Open stopwatch →"
        >
            <StopwatchMode />
        </WidgetShell>
    );
}
