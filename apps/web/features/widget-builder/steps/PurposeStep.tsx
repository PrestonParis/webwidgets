'use client';

import { useState } from 'react';
import type { WidgetBuilderPurpose } from '@/features/widgets/types/synthesisWidgets';
import type { SynthesizedWidgetDefinition } from '@/features/widgets/synthesis/widgetDefinitionInterfaces';
import { synthesizeWidgetFromQuery } from '@/features/widgets/synthesis/widgetSearchSynthesis';

interface PurposeStepProps {
    definition: Partial<SynthesizedWidgetDefinition>;
    nlQuery: string;
    onUpdate: (patch: Partial<SynthesizedWidgetDefinition>) => void;
    onNlQuery: (q: string) => void;
    onLoadSuggestion: (def: SynthesizedWidgetDefinition) => void;
}

const PURPOSES: Array<{
    id: WidgetBuilderPurpose;
    label: string;
    emoji: string;
    hint: string;
}> = [
    {
        id: 'track',
        label: 'Track Something',
        emoji: '📊',
        hint: 'Log and monitor a recurring metric',
    },
    {
        id: 'display',
        label: 'Display Data',
        emoji: '📋',
        hint: 'Show information from an existing source',
    },
    {
        id: 'visualize',
        label: 'Visualize Trends',
        emoji: '📈',
        hint: 'Chart or graph data over time',
    },
    {
        id: 'monitor',
        label: 'Monitor Alerts',
        emoji: '🔔',
        hint: 'Watch for thresholds and send alerts',
    },
    {
        id: 'trigger',
        label: 'Trigger Actions',
        emoji: '⚡',
        hint: 'Button or condition that runs actions',
    },
    {
        id: 'connect_api',
        label: 'Connect API',
        emoji: '🌐',
        hint: 'Fetch data from an external service',
    },
    {
        id: 'dashboard_card',
        label: 'Dashboard Card',
        emoji: '🪟',
        hint: 'Quick summary card for your dashboard',
    },
    {
        id: 'automation',
        label: 'Automation Widget',
        emoji: '⚙️',
        hint: 'Widget that drives automated behaviors',
    },
    {
        id: 'custom',
        label: 'Custom',
        emoji: '✏️',
        hint: 'Define your own widget from scratch',
    },
];

export function PurposeStep({
    definition,
    nlQuery,
    onUpdate,
    onNlQuery,
    onLoadSuggestion,
}: PurposeStepProps) {
    const [suggestions, setSuggestions] = useState<
        ReturnType<typeof synthesizeWidgetFromQuery>
    >([]);

    const handleSearch = () => {
        if (!nlQuery.trim()) return;
        setSuggestions(synthesizeWidgetFromQuery(nlQuery));
    };

    return (
        <div className="space-y-6">
            <div>
                <p className="text-xs font-semibold uppercase tracking-widest text-zinc-500 mb-3">
                    What do you want this widget to do?
                </p>
                <div className="flex gap-2">
                    <input
                        type="text"
                        value={nlQuery}
                        onChange={(e) => onNlQuery(e.target.value)}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter') handleSearch();
                        }}
                        placeholder="e.g. monthly caffeine vs anxiety tracker"
                        className="flex-1 rounded-xl border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-zinc-200 placeholder-zinc-500 focus:border-zinc-500 focus:outline-none"
                    />
                    <button
                        onClick={handleSearch}
                        className="rounded-xl bg-emerald-600 hover:bg-emerald-500 px-4 py-2 text-sm font-medium text-white transition-colors"
                    >
                        Suggest
                    </button>
                </div>
            </div>

            {suggestions.length > 0 && (
                <div>
                    <p className="text-[10px] uppercase tracking-widest text-zinc-500 mb-2">
                        Suggested widgets
                    </p>
                    <div className="grid grid-cols-1 gap-2">
                        {suggestions.map((candidate) => (
                            <button
                                key={candidate.id}
                                onClick={() =>
                                    onLoadSuggestion(candidate.definitionDraft)
                                }
                                className="flex items-start gap-3 rounded-xl border border-zinc-700 bg-zinc-800/60 p-3 text-left hover:border-emerald-600 hover:bg-zinc-800 transition-colors"
                            >
                                <span className="text-xl">
                                    {candidate.emoji}
                                </span>
                                <div className="min-w-0">
                                    <p className="text-sm font-medium text-zinc-200">
                                        {candidate.title}
                                    </p>
                                    <p className="text-xs text-zinc-500 mt-0.5">
                                        {candidate.description}
                                    </p>
                                    <div className="mt-1 flex flex-wrap items-center gap-2">
                                        <p className="text-[10px] text-emerald-500">
                                            {Math.round(
                                                candidate.confidence * 100,
                                            )}
                                            % match
                                        </p>
                                        <span
                                            className={`rounded-full px-1.5 py-0.5 text-[9px] font-semibold ${
                                                candidate.buildableNow
                                                    ? 'bg-emerald-950 text-emerald-400'
                                                    : 'bg-amber-950 text-amber-400'
                                            }`}
                                        >
                                            {candidate.buildableNow
                                                ? 'buildable now'
                                                : 'requires setup'}
                                        </span>
                                    </div>
                                    {(candidate.missingCapabilities.length >
                                        0 ||
                                        (candidate.explanation?.length ?? 0) >
                                            0) && (
                                        <div className="mt-2 space-y-1">
                                            {candidate.explanation
                                                ?.slice(0, 2)
                                                .map((line) => (
                                                    <p
                                                        key={line}
                                                        className="text-[10px] text-zinc-600"
                                                    >
                                                        {line}
                                                    </p>
                                                ))}
                                            {candidate.missingCapabilities
                                                .slice(0, 2)
                                                .map((missing) => (
                                                    <p
                                                        key={missing}
                                                        className="text-[10px] text-amber-500"
                                                    >
                                                        {missing}
                                                    </p>
                                                ))}
                                        </div>
                                    )}
                                </div>
                            </button>
                        ))}
                    </div>
                </div>
            )}

            <div>
                <p className="text-[10px] uppercase tracking-widest text-zinc-500 mb-2">
                    Or choose a purpose
                </p>
                <div className="grid grid-cols-3 gap-2">
                    {PURPOSES.map(({ id, label, emoji, hint }) => (
                        <button
                            key={id}
                            onClick={() => onUpdate({ purpose: id })}
                            className={`flex flex-col gap-1 rounded-xl border p-3 text-left transition-colors ${
                                definition.purpose === id
                                    ? 'border-emerald-600 bg-emerald-950/30 text-emerald-400'
                                    : 'border-zinc-700 bg-zinc-800/40 text-zinc-400 hover:border-zinc-600'
                            }`}
                        >
                            <span className="text-lg">{emoji}</span>
                            <span className="text-xs font-medium">{label}</span>
                            <span className="text-[10px] text-zinc-600">
                                {hint}
                            </span>
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );
}
