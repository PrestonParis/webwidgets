'use client';

import { useState } from 'react';
import { TRANSFORMATION_REGISTRY } from '@/features/widgets/synthesis/transformationRegistry';
import type {
    SynthesizedWidgetDefinition,
    SynthesizedTransformationDef,
} from '@/features/widgets/synthesis/widgetDefinitionInterfaces';
import type { WidgetTransformationType } from '@/features/widgets/synthesis/widgetTypes';

interface TransformStepProps {
    definition: Partial<SynthesizedWidgetDefinition>;
    onUpdate: (patch: Partial<SynthesizedWidgetDefinition>) => void;
}

function toggleTransform(
    def: Partial<SynthesizedWidgetDefinition>,
    type: WidgetTransformationType,
): SynthesizedTransformationDef[] {
    const current = def.transformations ?? [];
    if (current.some((t) => t.type === type))
        return current.filter((t) => t.type !== type);
    return [...current, { type, config: {} }];
}

function updateConfig(
    def: Partial<SynthesizedWidgetDefinition>,
    type: WidgetTransformationType,
    key: string,
    value: string,
): SynthesizedTransformationDef[] {
    return (def.transformations ?? []).map((t) =>
        t.type === type ? { ...t, config: { ...t.config, [key]: value } } : t,
    );
}

export function TransformStep({ definition, onUpdate }: TransformStepProps) {
    const [expanded, setExpanded] = useState<WidgetTransformationType | null>(
        null,
    );

    const transforms = definition.transformations ?? [];

    return (
        <div className="space-y-3">
            <p className="text-xs font-semibold uppercase tracking-widest text-zinc-500">
                Clean and reshape your data
            </p>
            <div className="space-y-2">
                {TRANSFORMATION_REGISTRY.map((tr) => {
                    const added = transforms.some((t) => t.type === tr.id);
                    const isExpanded = expanded === tr.id;
                    const configValues =
                        transforms.find((t) => t.type === tr.id)?.config ?? {};

                    return (
                        <div
                            key={tr.id}
                            className={`rounded-xl border transition-colors ${added ? 'border-violet-600 bg-violet-950/20' : 'border-zinc-700 bg-zinc-800/30'}`}
                        >
                            <button
                                onClick={() => {
                                    onUpdate({
                                        transformations: toggleTransform(
                                            definition,
                                            tr.id,
                                        ),
                                    });
                                    if (!added) setExpanded(tr.id);
                                    else if (isExpanded) setExpanded(null);
                                }}
                                className="w-full flex items-start gap-3 px-3 py-2.5 text-left"
                            >
                                <div className="flex-1">
                                    <div className="flex items-center gap-2">
                                        <p
                                            className={`text-sm font-medium ${added ? 'text-violet-300' : 'text-zinc-300'}`}
                                        >
                                            {tr.label}
                                        </p>
                                        <span className="text-[10px] text-zinc-600 font-mono">
                                            {tr.inputShape} → {tr.outputShape}
                                        </span>
                                    </div>
                                    <p className="text-[10px] text-zinc-500 mt-0.5">
                                        {tr.description}
                                    </p>
                                </div>
                                <div
                                    className={`mt-1 h-4 w-4 shrink-0 rounded border-2 flex items-center justify-center ${added ? 'border-violet-500 bg-violet-500' : 'border-zinc-600'}`}
                                >
                                    {added && (
                                        <span className="text-white text-[8px]">
                                            ✓
                                        </span>
                                    )}
                                </div>
                            </button>

                            {added && (
                                <div className="border-t border-zinc-700/50 px-3 pb-3">
                                    <p className="text-[10px] uppercase text-zinc-600 mt-2 mb-2">
                                        Configure
                                    </p>
                                    <div className="grid grid-cols-2 gap-2">
                                        {Object.entries(tr.configSchema).map(
                                            ([key, hint]) => (
                                                <div key={key}>
                                                    <label className="block text-[10px] text-zinc-500 mb-1 capitalize">
                                                        {key}
                                                    </label>
                                                    {hint.includes('|') ? (
                                                        <select
                                                            value={
                                                                (configValues[
                                                                    key
                                                                ] as
                                                                    | string
                                                                    | undefined) ??
                                                                ''
                                                            }
                                                            onChange={(e) =>
                                                                onUpdate({
                                                                    transformations:
                                                                        updateConfig(
                                                                            definition,
                                                                            tr.id,
                                                                            key,
                                                                            e
                                                                                .target
                                                                                .value,
                                                                        ),
                                                                })
                                                            }
                                                            className="w-full rounded-lg border border-zinc-600 bg-zinc-800 px-2 py-1 text-xs text-zinc-200 focus:border-violet-500 focus:outline-none"
                                                        >
                                                            <option value="">
                                                                Select…
                                                            </option>
                                                            {hint
                                                                .split('|')
                                                                .map((opt) => (
                                                                    <option
                                                                        key={
                                                                            opt
                                                                        }
                                                                        value={
                                                                            opt
                                                                        }
                                                                    >
                                                                        {opt}
                                                                    </option>
                                                                ))}
                                                        </select>
                                                    ) : (
                                                        <input
                                                            type="text"
                                                            placeholder={hint}
                                                            value={
                                                                (configValues[
                                                                    key
                                                                ] as
                                                                    | string
                                                                    | undefined) ??
                                                                ''
                                                            }
                                                            onChange={(e) =>
                                                                onUpdate({
                                                                    transformations:
                                                                        updateConfig(
                                                                            definition,
                                                                            tr.id,
                                                                            key,
                                                                            e
                                                                                .target
                                                                                .value,
                                                                        ),
                                                                })
                                                            }
                                                            className="w-full rounded-lg border border-zinc-600 bg-zinc-800 px-2 py-1 text-xs text-zinc-200 placeholder-zinc-600 focus:border-violet-500 focus:outline-none"
                                                        />
                                                    )}
                                                </div>
                                            ),
                                        )}
                                    </div>
                                    <p className="text-[10px] text-zinc-600 mt-2">
                                        e.g. {tr.example}
                                    </p>
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>

            {transforms.length > 0 && (
                <div className="rounded-xl border border-zinc-700 bg-zinc-800/30 p-3">
                    <p className="text-[10px] uppercase tracking-widest text-zinc-500 mb-2">
                        Pipeline ({transforms.length} step
                        {transforms.length !== 1 ? 's' : ''})
                    </p>
                    <div className="flex flex-wrap items-center gap-1.5">
                        {transforms.map((t, i) => (
                            <span
                                key={t.type}
                                className="flex items-center gap-1"
                            >
                                {i > 0 && (
                                    <span className="text-zinc-600">→</span>
                                )}
                                <span className="rounded-full border border-violet-700 bg-violet-900/40 px-2 py-0.5 text-[10px] text-violet-300">
                                    {t.type}
                                </span>
                            </span>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
