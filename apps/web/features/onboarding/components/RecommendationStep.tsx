'use client';

import { Check } from 'lucide-react';
import type { WidgetType } from '@/features/dashboard/types/dashboard';
import type { WorkspaceRecommendation } from '@/features/onboarding/types/recommendations';
import { cn } from '@/lib/utils/utils';

interface RecommendationStepProps {
    recommendation: WorkspaceRecommendation;
    selectedWidgetTypes: WidgetType[];
    onToggleWidget: (widgetType: WidgetType) => void;
}

const WIDGET_DISPLAY: Partial<
    Record<string, { label: string; emoji: string }>
> = {
    email: { label: 'Email', emoji: '📬' },
    calendar: { label: 'Calendar', emoji: '📅' },
    todo: { label: 'Tasks', emoji: '✅' },
    texteditor: { label: 'Notes', emoji: '📝' },
    timekeeping: { label: 'Focus Timer', emoji: '⏱️' },
    tracking: { label: 'Health Tracking', emoji: '📊' },
    'tracking-mood': { label: 'Mood', emoji: '😊' },
    weather: { label: 'Weather', emoji: '🌤️' },
    converter: { label: 'Converter', emoji: '🔄' },
    datahealth: { label: 'System Health', emoji: '🖥️' },
    'form-filler': { label: 'Form Filler', emoji: '📋' },
    chess: { label: 'Chess', emoji: '♟️' },
    'recovery-empty': { label: 'Recovery', emoji: '💙' },
};

function widgetLabel(type: string) {
    return (
        WIDGET_DISPLAY[type]?.label ??
        type.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
    );
}

function widgetEmoji(type: string) {
    return WIDGET_DISPLAY[type]?.emoji ?? '🧩';
}

export function RecommendationStep({
    recommendation,
    selectedWidgetTypes,
    onToggleWidget,
}: RecommendationStepProps) {
    return (
        <div className="space-y-8">
            {/* Widget grid */}
            <section>
                <div className="mb-4 flex items-center justify-between">
                    <div>
                        <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-100">
                            Recommended widgets
                        </h2>
                        <p className="text-sm text-zinc-500 dark:text-zinc-400">
                            These will appear on your dashboard. Uncheck
                            anything you don&apos;t want.
                        </p>
                    </div>
                    <span className="text-sm font-medium text-[#4f6ef7]">
                        {selectedWidgetTypes.length} selected
                    </span>
                </div>

                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
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
                                className={cn(
                                    'group relative rounded-xl border p-4 text-left transition-all',
                                    selected
                                        ? 'border-[#4f6ef7] bg-[#eef2ff] shadow-sm dark:bg-[#172033]'
                                        : 'border-zinc-200 bg-white hover:border-zinc-300 dark:border-zinc-800 dark:bg-zinc-900 dark:hover:border-zinc-700',
                                )}
                            >
                                <div className="flex items-start justify-between gap-2">
                                    <span className="text-2xl leading-none">
                                        {widgetEmoji(widget.widgetType)}
                                    </span>
                                    <span
                                        className={cn(
                                            'flex h-5 w-5 shrink-0 items-center justify-center rounded-full border transition-colors',
                                            selected
                                                ? 'border-[#4f6ef7] bg-[#4f6ef7]'
                                                : 'border-zinc-300 dark:border-zinc-700',
                                        )}
                                    >
                                        {selected && (
                                            <Check className="h-3 w-3 text-white" />
                                        )}
                                    </span>
                                </div>
                                <p className="mt-2 text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                                    {widgetLabel(widget.widgetType)}
                                </p>
                                <p className="mt-1 text-xs leading-5 text-zinc-500 dark:text-zinc-400">
                                    {widget.reason}
                                </p>
                            </button>
                        );
                    })}
                </div>
            </section>

            {/* Workspace preview mock */}
            <section>
                <h2 className="mb-3 text-base font-semibold text-zinc-900 dark:text-zinc-100">
                    Dashboard preview
                </h2>
                <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-800 dark:bg-zinc-900">
                    <div className="mb-2 flex items-center gap-1.5">
                        <div className="h-2.5 w-2.5 rounded-full bg-zinc-300 dark:bg-zinc-700" />
                        <div className="h-2.5 w-2.5 rounded-full bg-zinc-300 dark:bg-zinc-700" />
                        <div className="h-2.5 w-2.5 rounded-full bg-zinc-300 dark:bg-zinc-700" />
                        <div className="ml-2 h-4 flex-1 max-w-xs rounded-md bg-zinc-200 dark:bg-zinc-700" />
                    </div>
                    <div className="grid grid-cols-3 gap-2 lg:grid-cols-4">
                        {selectedWidgetTypes.slice(0, 8).map((type, i) => (
                            <div
                                key={type}
                                className={cn(
                                    'rounded-lg border border-zinc-200 bg-white p-3 dark:border-zinc-700 dark:bg-zinc-800',
                                    i === 0 ? 'col-span-2 row-span-2' : '',
                                )}
                            >
                                <span className="text-lg leading-none">
                                    {widgetEmoji(type)}
                                </span>
                                <p className="mt-2 text-xs font-medium text-zinc-600 dark:text-zinc-400">
                                    {widgetLabel(type)}
                                </p>
                                <div className="mt-2 space-y-1">
                                    <div className="h-1.5 rounded bg-zinc-100 dark:bg-zinc-700" />
                                    <div className="h-1.5 w-2/3 rounded bg-zinc-100 dark:bg-zinc-700" />
                                </div>
                            </div>
                        ))}
                        {selectedWidgetTypes.length === 0 && (
                            <div className="col-span-3 flex h-20 items-center justify-center text-sm text-zinc-400 lg:col-span-4">
                                Select widgets above to preview your dashboard
                            </div>
                        )}
                    </div>
                </div>
            </section>

            {/* Suggested automations */}
            {recommendation.automations.length > 0 && (
                <section>
                    <h2 className="mb-3 text-base font-semibold text-zinc-900 dark:text-zinc-100">
                        Suggested automations
                    </h2>
                    <div className="flex flex-wrap gap-2">
                        {recommendation.automations.map((id) => (
                            <span
                                key={id}
                                className="rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-600 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300"
                            >
                                {formatId(id)}
                            </span>
                        ))}
                    </div>
                </section>
            )}
        </div>
    );
}

function formatId(id: string) {
    return id
        .split('-')
        .map((part) => part[0]?.toUpperCase() + part.slice(1))
        .join(' ');
}
