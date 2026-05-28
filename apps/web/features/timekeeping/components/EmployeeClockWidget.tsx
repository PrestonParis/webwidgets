'use client';

import { BriefcaseBusiness } from 'lucide-react';
import WidgetShell from '@/features/widgets/components/WidgetShell';
import { useWidgetSettings } from '@/features/widgets/hooks/useWidgetSettings';
import { TimeclockMode } from '@/features/timekeeping/components/TimeclockMode';

export default function EmployeeClockWidget() {
    const { settings, updateSettings } = useWidgetSettings(
        'employee-clock',
        'employee-clock',
    );

    return (
        <WidgetShell
            title="Employee Clock"
            icon={<BriefcaseBusiness className="h-4 w-4" />}
            settings={settings}
            onSettingsChange={updateSettings}
            widgetId="employee-clock"
            widgetType="employee-clock"
            footerHref="/time?mode=timeclock"
            footerLabel="Open timeclock ->"
        >
            <TimeclockMode />
        </WidgetShell>
    );
}
