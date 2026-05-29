'use client';

import { Check, Layers, Plug, Repeat, TrendingUp } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import type { WidgetType } from '@/features/dashboard/types/dashboard';
import type { WorkspaceRecommendation } from '@/features/onboarding/types/recommendations';

interface RecommendationStepProps {
    recommendation: WorkspaceRecommendation;
    selectedWidgetTypes: WidgetType[];
    onToggleWidget: (widgetType: WidgetType) => void;
}

export function RecommendationStep({
    recommendation,
    selectedWidgetTypes,
    onToggleWidget,
}: RecommendationStepProps) {
    return (
        <div className="grid gap-5 xl:grid-cols-[1.2fr_0.8fr]">
            <div className="rounded-lg border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
                <div className="mb-5 flex items-center gap-2">
                    <Layers className="h-5 w-5 text-[#4f6ef7]" />
                    <h3 className="text-lg font-semibold">Starter widgets</h3>
                </div>
                <div className="grid gap-3 md:grid-cols-2">
                    {recommendation.widgets.map((widget) => {
                        const selected = selectedWidgetTypes.includes(
                            widget.widgetType,
                        );
                        return (
                            <button
                                key={widget.widgetType}
                                type="button"
                                onClick={() =>
                                    onToggleWidget(widget.widgetType)
                                }
                                className={`rounded-lg border p-4 text-left transition ${
                                    selected
                                        ? 'border-[#4f6ef7] bg-[#eef2ff] dark:bg-[#172033]'
                                        : 'border-zinc-200 hover:border-zinc-300 dark:border-zinc-800 dark:hover:border-zinc-700'
                                }`}
                            >
                                <div className="flex items-center justify-between gap-3">
                                    <p className="text-sm font-semibold capitalize">
                                        {widget.widgetType.replace('-', ' ')}
                                    </p>
                                    {selected && (
                                        <Check className="h-4 w-4 text-[#4f6ef7]" />
                                    )}
                                </div>
                                <p className="mt-3 text-sm leading-6 text-zinc-600 dark:text-zinc-300">
                                    {widget.reason}
                                </p>
                            </button>
                        );
                    })}
                </div>
            </div>

            <div className="grid gap-4">
                <SummaryPanel
                    icon={TrendingUp}
                    title="Tracking systems"
                    items={recommendation.trackingSystems}
                />
                <SummaryPanel
                    icon={Plug}
                    title="Suggested integrations"
                    items={recommendation.integrations.map(formatId)}
                />
                <SummaryPanel
                    icon={Repeat}
                    title="Suggested automations"
                    items={recommendation.automations.map(formatId)}
                />
            </div>
        </div>
    );
}

function SummaryPanel({
    icon: Icon,
    title,
    items,
}: {
    icon: LucideIcon;
    title: string;
    items: string[];
}) {
    return (
        <section className="rounded-lg border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
            <div className="mb-4 flex items-center gap-2">
                <Icon className="h-5 w-5 text-[#4f6ef7]" />
                <h3 className="text-base font-semibold">{title}</h3>
            </div>
            <div className="space-y-2">
                {items.map((item) => (
                    <p
                        key={item}
                        className="rounded-md bg-zinc-50 px-3 py-2 text-sm text-zinc-700 dark:bg-zinc-950 dark:text-zinc-300"
                    >
                        {item}
                    </p>
                ))}
            </div>
        </section>
    );
}

function formatId(id: string) {
    return id
        .split('-')
        .map((part) => part[0]?.toUpperCase() + part.slice(1))
        .join(' ');
}
