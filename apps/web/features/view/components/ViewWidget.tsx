'use client';

import { Eye } from 'lucide-react';
import WidgetShell from '@/features/widgets/components/WidgetShell';
import { ViewWorkspace } from '@/features/view/components/ViewWorkspace';

export default function ViewWidget({
    widgetId = 'view',
}: {
    widgetId?: string;
}) {
    return (
        <WidgetShell
            icon={<Eye size={16} />}
            title="View"
            widgetId={widgetId}
            widgetType="view"
            footerHref="/view"
            footerLabel="Open workspace ->"
        >
            <ViewWorkspace compact />
        </WidgetShell>
    );
}
