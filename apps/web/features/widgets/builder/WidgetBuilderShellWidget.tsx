'use client';

import { Wrench } from 'lucide-react';
import WidgetShell from '@/features/widgets/components/WidgetShell';

const EXAMPLE_WIDGETS = [
    {
        emoji: '📊',
        name: 'Subscription Risk',
        desc: 'Track recurring costs vs. income',
    },
    {
        emoji: '💸',
        name: 'Cashflow Forecast',
        desc: 'Monthly income vs. expenses',
    },
    { emoji: '😴', name: 'Mood vs. Sleep', desc: 'Correlate health metrics' },
];

export default function WidgetBuilderShellWidget({
    widgetId = 'widget-builder',
}: {
    widgetId?: string;
}) {
    return (
        <WidgetShell
            icon={<Wrench size={16} />}
            title="Widget Builder"
            widgetId={widgetId}
            widgetType="widget-builder"
            footerHref="/widgets/create"
            footerLabel="Create widget ->"
        >
        <div className="flex flex-col h-full gap-4">
            <div className="flex items-start gap-3">
                <span className="text-2xl mt-0.5">🔧</span>
                <div>
                    <p className="text-sm font-semibold text-zinc-100">
                        Widget Builder
                    </p>
                    <p className="text-[11px] text-zinc-500 leading-relaxed">
                        Compose custom widgets from 50+ components, 10 data
                        sources, and automated actions
                    </p>
                </div>
            </div>

            <div className="space-y-1.5 flex-1">
                <p className="text-[10px] uppercase tracking-widest text-zinc-600 mb-2">
                    Example widgets
                </p>
                {EXAMPLE_WIDGETS.map((w) => (
                    <div
                        key={w.name}
                        className="flex items-center gap-2.5 rounded-xl bg-zinc-800/50 px-3 py-2"
                    >
                        <span className="text-sm">{w.emoji}</span>
                        <div>
                            <p className="text-xs font-medium text-zinc-300">
                                {w.name}
                            </p>
                            <p className="text-[10px] text-zinc-600">
                                {w.desc}
                            </p>
                        </div>
                    </div>
                ))}
            </div>
        </div>
        </WidgetShell>
    );
}
