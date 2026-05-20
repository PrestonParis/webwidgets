'use client';

import { Check } from 'lucide-react';
import type { WidgetType } from '@/features/dashboard/types/dashboard';
import { getDashboardWidgetLibrary } from '@/features/platform/lib/dashboardWidgetLibrary';
import type { DashboardWidgetLibraryEntry } from '@/features/platform/lib/dashboardWidgetLibrary';

interface WidgetSelectionStepProps {
    selectedWidgetTypes: WidgetType[];
    onToggleWidget: (widgetType: WidgetType) => void;
}

interface CategoryGroup {
    label: string;
    widgets: DashboardWidgetLibraryEntry[];
}

const CATEGORY_ORDER: Record<string, { label: string; order: number }> = {
    tracking: { label: 'Health & Tracking', order: 1 },
    knowledge: { label: 'Writing & Notes', order: 2 },
    finance: { label: 'Finance', order: 3 },
    developer: { label: 'Developer', order: 4 },
    automation: { label: 'Automation', order: 5 },
    system: { label: 'System', order: 6 },
};

function groupWidgets(widgets: DashboardWidgetLibraryEntry[]): CategoryGroup[] {
    const known = new Map<string, DashboardWidgetLibraryEntry[]>();
    const general: DashboardWidgetLibraryEntry[] = [];

    for (const widget of widgets) {
        const cat = CATEGORY_ORDER[widget.featureId];
        if (cat) {
            const bucket = known.get(widget.featureId) ?? [];
            bucket.push(widget);
            known.set(widget.featureId, bucket);
        } else {
            general.push(widget);
        }
    }

    const groups: CategoryGroup[] = [];
    if (general.length > 0)
        groups.push({ label: 'Productivity & Tools', widgets: general });

    [...known.entries()]
        .sort(
            (a, b) =>
                (CATEGORY_ORDER[a[0]]?.order ?? 99) -
                (CATEGORY_ORDER[b[0]]?.order ?? 99),
        )
        .forEach(([key, items]) => {
            groups.push({
                label: CATEGORY_ORDER[key]?.label ?? key,
                widgets: items,
            });
        });

    return groups;
}

function WidgetPill({
    widget,
    selected,
    onToggle,
}: {
    widget: DashboardWidgetLibraryEntry;
    selected: boolean;
    onToggle: () => void;
}) {
    return (
        <button
            type="button"
            onClick={onToggle}
            className={`flex items-center gap-2.5 rounded-lg border px-3 py-2 text-left transition ${
                selected
                    ? 'border-[#4f6ef7] bg-[#eef2ff] dark:bg-[#172033]'
                    : 'border-zinc-200 bg-white hover:border-zinc-300 dark:border-zinc-800 dark:bg-zinc-900 dark:hover:border-zinc-700'
            }`}
        >
            <span className="text-base leading-none">{widget.emoji}</span>
            <span className="min-w-0 flex-1 truncate text-sm font-semibold">
                {widget.name}
            </span>
            {selected && (
                <Check className="h-3.5 w-3.5 shrink-0 text-[#4f6ef7]" />
            )}
        </button>
    );
}

export function WidgetSelectionStep({
    selectedWidgetTypes,
    onToggleWidget,
}: WidgetSelectionStepProps) {
    const library = getDashboardWidgetLibrary().filter(
        (w) => w.betaState !== 'unavailable',
    );
    const groups = groupWidgets(library);

    return (
        <div className="space-y-6">
            <div className="rounded-lg border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
                <p className="text-sm font-semibold">
                    {selectedWidgetTypes.length === 0
                        ? 'Select at least one widget to continue'
                        : `${selectedWidgetTypes.length} widget${selectedWidgetTypes.length === 1 ? '' : 's'} selected`}
                </p>
                <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
                    Selected widgets appear on your dashboard. Everything else
                    stays available in Add Widget.
                </p>
            </div>

            {groups.map((group) => (
                <div key={group.label}>
                    <p className="mb-2 text-xs font-semibold uppercase tracking-[0.15em] text-zinc-400 dark:text-zinc-500">
                        {group.label}
                    </p>
                    <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                        {group.widgets.map((widget) => (
                            <WidgetPill
                                key={widget.type}
                                widget={widget}
                                selected={selectedWidgetTypes.includes(
                                    widget.type,
                                )}
                                onToggle={() => onToggleWidget(widget.type)}
                            />
                        ))}
                    </div>
                </div>
            ))}
        </div>
    );
}
