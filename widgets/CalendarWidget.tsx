'use client';

import WidgetShell from '@/features/widgets/components/WidgetShell';
import { CalendarWidget as CalendarContent } from '@/features/calendar/components/CalendarWidget';

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
            <CalendarContent />
        </WidgetShell>
    );
}
