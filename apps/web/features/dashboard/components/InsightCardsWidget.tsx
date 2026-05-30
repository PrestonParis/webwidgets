'use client';

import { BrainCircuit } from 'lucide-react';
import WidgetShell from '@/features/widgets/components/WidgetShell';

export default function InsightCardsWidget({
    widgetId = 'insight-cards',
}: {
    widgetId?: string;
}) {
    return (
        <WidgetShell
            icon={<BrainCircuit size={16} />}
            title="Insights"
            widgetId={widgetId}
            widgetType="insight-cards"
            footerHref="/"
            footerLabel="Open dashboard ->"
        >
            <div className="rounded-lg border border-dashed border-zinc-200 dark:border-zinc-800 p-4 text-center">
                <BrainCircuit className="mx-auto mb-2 h-6 w-6 text-zinc-300 dark:text-zinc-600" />
                <p className="text-xs font-medium text-zinc-600 dark:text-zinc-400">
                    No insights yet
                </p>
                <p className="mt-1 text-[11px] leading-4 text-zinc-400 dark:text-zinc-500">
                    Insights are generated as you use the dashboard. Connect
                    integrations and start logging data.
                </p>
            </div>
        </WidgetShell>
    );
}
