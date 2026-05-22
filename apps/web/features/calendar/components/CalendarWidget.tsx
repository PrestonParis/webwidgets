'use client';

import WidgetShell from '@/features/widgets/components/WidgetShell';
import { CalendarPage } from '@/features/calendar/components/CalendarPage';

export default function CalendarWidget() {
    return (
        <WidgetShell
            icon={<span className="text-base">📅</span>}
            title="Calendar"
            badge="Google"
            widgetId="calendar"
            widgetType="calendar"
            footerHref="/calendar"
            footerLabel="Open Calendar →"
        >
            <CalendarPage />
        </WidgetShell>
    );
}
