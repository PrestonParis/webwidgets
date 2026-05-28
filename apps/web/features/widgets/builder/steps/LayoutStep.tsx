'use client';

import type { SynthesizedWidgetDefinition } from '@/features/widgets/synthesis/widgetDefinitionInterfaces';
import type { WidgetLayoutType } from '@/features/widgets/synthesis/widgetTypes';

interface LayoutStepProps {
    definition: Partial<SynthesizedWidgetDefinition>;
    onUpdate: (patch: Partial<SynthesizedWidgetDefinition>) => void;
}

const LAYOUTS: Array<{
    id: WidgetLayoutType;
    label: string;
    emoji: string;
    description: string;
    preview: string;
}> = [
    {
        id: 'small_card',
        label: 'Small Card',
        emoji: '🃏',
        description: 'Compact card for the dashboard grid',
        preview: '┌──────┐\n│ Stat │\n└──────┘',
    },
    {
        id: 'metric_card',
        label: 'Metric Card',
        emoji: '📊',
        description: 'Prominent single KPI with context',
        preview: '┌──────────┐\n│  $4,230  │\n│ net worth│\n└──────────┘',
    },
    {
        id: 'list',
        label: 'List',
        emoji: '📋',
        description: 'Scrollable list of items',
        preview:
            '┌──────────┐\n│ • Item 1 │\n│ • Item 2 │\n│ • Item 3 │\n└──────────┘',
    },
    {
        id: 'chart',
        label: 'Chart',
        emoji: '📈',
        description: 'Chart visualization with optional stats',
        preview:
            '┌──────────┐\n│  /\\   /  │\n│ /  \\_/   │\n│──────────│\n└──────────┘',
    },
    {
        id: 'table',
        label: 'Table',
        emoji: '🗃️',
        description: 'Data table with sortable columns',
        preview:
            '┌──┬──┬────┐\n│A │B │ C  │\n├──┼──┼────┤\n│1 │x │ $5 │\n└──┴──┴────┘',
    },
    {
        id: 'timeline',
        label: 'Timeline',
        emoji: '📅',
        description: 'Chronological event feed',
        preview:
            '┌──────────┐\n│ ○ Event  │\n│ │        │\n│ ○ Event  │\n└──────────┘',
    },
    {
        id: 'panel',
        label: 'Panel',
        emoji: '🪟',
        description: 'Full panel with header and scrollable body',
        preview:
            '┌──────────┐\n│  Header  │\n│──────────│\n│ Content  │\n└──────────┘',
    },
    {
        id: 'split',
        label: 'Split View',
        emoji: '⚡',
        description: 'Two-pane side-by-side layout',
        preview: '┌────┬─────┐\n│    │     │\n│ L  │  R  │\n└────┴─────┘',
    },
    {
        id: 'tabbed',
        label: 'Tabbed',
        emoji: '🗂️',
        description: 'Multiple views in one card with tabs',
        preview:
            '┌──┬──┬────┐\n│A │B │    │\n├──┴──┴────┤\n│ Content  │\n└──────────┘',
    },
    {
        id: 'compact',
        label: 'Compact',
        emoji: '🔹',
        description: 'Minimal widget for high-density dashboards',
        preview: '┌──────┐\n│ ● 42 │\n└──────┘',
    },
    {
        id: 'expanded',
        label: 'Expanded',
        emoji: '🔳',
        description: 'Full-size widget taking up more space',
        preview:
            '┌──────────┐\n│          │\n│  Large   │\n│          │\n└──────────┘',
    },
];

export function LayoutStep({ definition, onUpdate }: LayoutStepProps) {
    return (
        <div className="space-y-3">
            <p className="text-xs font-semibold uppercase tracking-widest text-zinc-500">
                Choose the widget&apos;s overall structure
            </p>
            <div className="grid grid-cols-2 gap-2">
                {LAYOUTS.map(({ id, label, emoji, description, preview }) => (
                    <button
                        key={id}
                        onClick={() => onUpdate({ layout: id })}
                        className={`flex flex-col gap-2 rounded-xl border p-3 text-left transition-colors ${
                            definition.layout === id
                                ? 'border-emerald-600 bg-emerald-950/30'
                                : 'border-zinc-700 bg-zinc-800/40 hover:border-zinc-600'
                        }`}
                    >
                        <div className="flex items-center gap-2">
                            <span className="text-base">{emoji}</span>
                            <span
                                className={`text-sm font-medium ${definition.layout === id ? 'text-emerald-400' : 'text-zinc-300'}`}
                            >
                                {label}
                            </span>
                        </div>
                        <pre className="text-[9px] text-zinc-600 font-mono leading-relaxed">
                            {preview}
                        </pre>
                        <p className="text-[10px] text-zinc-500">
                            {description}
                        </p>
                    </button>
                ))}
            </div>
        </div>
    );
}
