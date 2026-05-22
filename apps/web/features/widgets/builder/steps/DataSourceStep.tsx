'use client';

import { useState } from 'react';
import {
    DATA_SOURCE_REGISTRY,
    getDataSourceCategories,
} from '@/features/widgets/synthesis/dataSourceRegistry';
import { customApiConfigToDataSource } from '@/features/widgets/synthesis/custom/customWidgetContracts';
import { validateCustomApiSource } from '@/features/widgets/synthesis/security/customWidgetSecurity';
import type {
    CustomApiSourceConfig,
    SynthesizedWidgetDefinition,
    SynthesizedDataSourceDef,
} from '@/features/widgets/synthesis/widgetDefinitionSchema';

interface DataSourceStepProps {
    definition: Partial<SynthesizedWidgetDefinition>;
    onUpdate: (patch: Partial<SynthesizedWidgetDefinition>) => void;
}

function isSelected(
    def: Partial<SynthesizedWidgetDefinition>,
    sourceId: string,
): boolean {
    return (def.dataSources ?? []).some((ds) => ds.id === sourceId);
}

function toggleSource(
    def: Partial<SynthesizedWidgetDefinition>,
    sourceId: string,
): SynthesizedDataSourceDef[] {
    const current = def.dataSources ?? [];
    if (current.some((ds) => ds.id === sourceId)) {
        return current.filter((ds) => ds.id !== sourceId);
    }
    const entry = DATA_SOURCE_REGISTRY.find((ds) => ds.id === sourceId);
    if (!entry) return current;
    const newSrc: SynthesizedDataSourceDef = {
        id: entry.id,
        type: 'feature_data',
        label: entry.label,
        schema: entry.schema,
        transformations: [],
    };
    return [...current, newSrc];
}

export function DataSourceStep({ definition, onUpdate }: DataSourceStepProps) {
    const [activeCategory, setActiveCategory] = useState<string>('finance');
    const [apiDraft, setApiDraft] = useState<CustomApiSourceConfig>({
        name: 'Custom API',
        baseUrl: '',
        endpoint: '',
        method: 'GET',
        headers: {},
        queryParams: {},
        auth: { type: 'none' },
        refreshIntervalSeconds: 900,
        responseSchema: { id: 'string', value: 'number', label: 'string' },
        sampleResponse: [],
        mappingRules: [],
        rateLimit: { requests: 30, intervalSeconds: 60 },
    });
    const [apiIssues, setApiIssues] = useState<string[]>([]);
    const categories = getDataSourceCategories();
    const visibleSources = DATA_SOURCE_REGISTRY.filter(
        (ds) => ds.category === activeCategory,
    );
    const addCustomApi = () => {
        const result = validateCustomApiSource(apiDraft);
        if (result.isErr()) {
            setApiIssues(result.error.map((item) => item.message));
            return;
        }
        setApiIssues([]);
        onUpdate({
            dataSources: [
                ...(definition.dataSources ?? []),
                customApiConfigToDataSource(result.value),
            ],
        });
    };

    return (
        <div className="space-y-4">
            <div>
                <p className="text-xs font-semibold uppercase tracking-widest text-zinc-500 mb-3">
                    Where does this widget get its data?
                </p>
                <div className="flex flex-wrap gap-1.5 mb-4">
                    {categories.map((cat) => (
                        <button
                            key={cat}
                            onClick={() => setActiveCategory(cat)}
                            className={`rounded-full px-3 py-1 text-xs font-medium transition-colors capitalize ${
                                activeCategory === cat
                                    ? 'bg-emerald-600 text-white'
                                    : 'bg-zinc-800 text-zinc-400 hover:text-zinc-200'
                            }`}
                        >
                            {cat}
                        </button>
                    ))}
                </div>
                <div className="space-y-2">
                    {visibleSources.map((ds) => {
                        const selected = isSelected(definition, ds.id);
                        return (
                            <button
                                key={ds.id}
                                onClick={() =>
                                    onUpdate({
                                        dataSources: toggleSource(
                                            definition,
                                            ds.id,
                                        ),
                                    })
                                }
                                className={`w-full flex items-start gap-3 rounded-xl border p-3 text-left transition-colors ${
                                    selected
                                        ? 'border-emerald-600 bg-emerald-950/30'
                                        : 'border-zinc-700 bg-zinc-800/40 hover:border-zinc-600'
                                }`}
                            >
                                <span className="text-xl mt-0.5">
                                    {ds.emoji}
                                </span>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center justify-between">
                                        <p className="text-sm font-medium text-zinc-200">
                                            {ds.label}
                                        </p>
                                        {ds.permissions.length > 0 && (
                                            <span className="text-[10px] text-amber-400 ml-2 shrink-0">
                                                ⚠ requires consent
                                            </span>
                                        )}
                                    </div>
                                    <p className="text-xs text-zinc-500 mt-0.5">
                                        {ds.description}
                                    </p>
                                    <div className="flex flex-wrap gap-1 mt-1.5">
                                        {Object.keys(ds.schema)
                                            .slice(0, 4)
                                            .map((field) => (
                                                <span
                                                    key={field}
                                                    className="rounded bg-zinc-700 px-1.5 py-0.5 text-[10px] text-zinc-400"
                                                >
                                                    {field}
                                                </span>
                                            ))}
                                        {Object.keys(ds.schema).length > 4 && (
                                            <span className="text-[10px] text-zinc-600">
                                                +
                                                {Object.keys(ds.schema).length -
                                                    4}{' '}
                                                more
                                            </span>
                                        )}
                                    </div>
                                </div>
                                <div
                                    className={`mt-1 h-4 w-4 shrink-0 rounded-full border-2 flex items-center justify-center ${selected ? 'border-emerald-500 bg-emerald-500' : 'border-zinc-600'}`}
                                >
                                    {selected && (
                                        <span className="text-white text-[8px]">
                                            ✓
                                        </span>
                                    )}
                                </div>
                            </button>
                        );
                    })}
                </div>
            </div>
            {(definition.dataSources?.length ?? 0) > 0 && (
                <div className="rounded-xl border border-zinc-700 bg-zinc-800/30 p-3">
                    <p className="text-[10px] uppercase tracking-widest text-zinc-500 mb-2">
                        Selected sources
                    </p>
                    <div className="flex flex-wrap gap-2">
                        {(definition.dataSources ?? []).map((ds) => (
                            <span
                                key={ds.id}
                                className="rounded-full bg-emerald-900/50 border border-emerald-700 px-2.5 py-1 text-xs text-emerald-300"
                            >
                                {ds.label}
                            </span>
                        ))}
                    </div>
                </div>
            )}
            {activeCategory === 'custom' && (
                <div className="rounded-xl border border-zinc-700 bg-zinc-900/60 p-3 space-y-3">
                    <div>
                        <p className="text-[10px] uppercase tracking-widest text-zinc-500">
                            Safe custom API source
                        </p>
                        <p className="text-[10px] text-zinc-600 mt-1">
                            Server-side secret references only. No arbitrary
                            code or unsafe internal URLs.
                        </p>
                    </div>
                    <div className="grid grid-cols-[1fr_1.5fr] gap-2">
                        <input
                            value={apiDraft.name}
                            onChange={(event) =>
                                setApiDraft((draft) => ({
                                    ...draft,
                                    name: event.target.value,
                                }))
                            }
                            className="rounded-lg border border-zinc-700 bg-zinc-800 px-2 py-1.5 text-xs text-zinc-200"
                            placeholder="Name"
                        />
                        <input
                            value={apiDraft.baseUrl}
                            onChange={(event) =>
                                setApiDraft((draft) => ({
                                    ...draft,
                                    baseUrl: event.target.value,
                                }))
                            }
                            className="rounded-lg border border-zinc-700 bg-zinc-800 px-2 py-1.5 text-xs text-zinc-200"
                            placeholder="https://api.your-service.com"
                        />
                        <select
                            value={apiDraft.method}
                            onChange={(event) =>
                                setApiDraft((draft) => ({
                                    ...draft,
                                    method: event.target.value as
                                        | 'GET'
                                        | 'POST',
                                }))
                            }
                            className="rounded-lg border border-zinc-700 bg-zinc-800 px-2 py-1.5 text-xs text-zinc-200"
                        >
                            <option value="GET">GET</option>
                            <option value="POST">POST</option>
                        </select>
                        <input
                            value={apiDraft.endpoint}
                            onChange={(event) =>
                                setApiDraft((draft) => ({
                                    ...draft,
                                    endpoint: event.target.value,
                                }))
                            }
                            className="rounded-lg border border-zinc-700 bg-zinc-800 px-2 py-1.5 text-xs text-zinc-200"
                            placeholder="/items"
                        />
                    </div>
                    <button
                        onClick={addCustomApi}
                        className="rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-500"
                    >
                        Add safe API source
                    </button>
                    {apiIssues.length > 0 && (
                        <div className="space-y-1">
                            {apiIssues.map((message) => (
                                <p
                                    key={message}
                                    className="text-[10px] text-red-400"
                                >
                                    {message}
                                </p>
                            ))}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
