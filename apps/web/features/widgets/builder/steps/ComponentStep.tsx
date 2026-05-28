'use client';

import { useState } from 'react';
import {
    COMPONENT_REGISTRY,
    getComponentCategories,
} from '@/features/widgets/synthesis/componentRegistry';
import type {
    SynthesizedWidgetDefinition,
    SynthesizedComponentDef,
} from '@/features/widgets/synthesis/widgetDefinitionInterfaces';
import type { WidgetComponentCategory } from '@/features/widgets/synthesis/widgetTypes';

interface ComponentStepProps {
    definition: Partial<SynthesizedWidgetDefinition>;
    onUpdate: (patch: Partial<SynthesizedWidgetDefinition>) => void;
}

const CATEGORY_LABELS: Record<WidgetComponentCategory, string> = {
    layout: 'Layout',
    display: 'Display',
    input: 'Input',
    visualization: 'Charts',
    action: 'Actions',
    status: 'Status',
};

function isSelected(
    def: Partial<SynthesizedWidgetDefinition>,
    compId: string,
): boolean {
    return (def.components ?? []).some((c) => c.registryId === compId);
}

function toggleComponent(
    def: Partial<SynthesizedWidgetDefinition>,
    compId: string,
): SynthesizedComponentDef[] {
    const current = def.components ?? [];
    if (current.some((c) => c.registryId === compId)) {
        return current
            .filter((c) => c.registryId !== compId)
            .map((c, i) => ({ ...c, order: i }));
    }
    const newComp: SynthesizedComponentDef = {
        registryId: compId,
        props: {},
        order: current.length,
    };
    return [...current, newComp];
}

export function ComponentStep({ definition, onUpdate }: ComponentStepProps) {
    const [activeCategory, setActiveCategory] =
        useState<WidgetComponentCategory>('display');
    const categories = getComponentCategories();
    const visible = COMPONENT_REGISTRY.filter(
        (c) => c.category === activeCategory,
    );

    return (
        <div className="space-y-4">
            <div>
                <p className="text-xs font-semibold uppercase tracking-widest text-zinc-500 mb-3">
                    Choose UI components
                </p>
                <div className="flex flex-wrap gap-1.5 mb-3">
                    {categories.map((cat) => (
                        <button
                            key={cat}
                            onClick={() => setActiveCategory(cat)}
                            className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                                activeCategory === cat
                                    ? 'bg-emerald-600 text-white'
                                    : 'bg-zinc-800 text-zinc-400 hover:text-zinc-200'
                            }`}
                        >
                            {CATEGORY_LABELS[cat]}
                        </button>
                    ))}
                </div>
                <div className="grid grid-cols-2 gap-2">
                    {visible.map((comp) => {
                        const selected = isSelected(definition, comp.id);
                        return (
                            <button
                                key={comp.id}
                                onClick={() =>
                                    onUpdate({
                                        components: toggleComponent(
                                            definition,
                                            comp.id,
                                        ),
                                    })
                                }
                                className={`flex flex-col gap-1 rounded-xl border p-3 text-left transition-colors ${
                                    selected
                                        ? 'border-emerald-600 bg-emerald-950/30'
                                        : 'border-zinc-700 bg-zinc-800/40 hover:border-zinc-600'
                                }`}
                            >
                                <div className="flex items-center justify-between">
                                    <p
                                        className={`text-xs font-semibold ${selected ? 'text-emerald-400' : 'text-zinc-300'}`}
                                    >
                                        {comp.name}
                                    </p>
                                    {selected && (
                                        <span className="text-[10px] text-emerald-500">
                                            ✓
                                        </span>
                                    )}
                                </div>
                                <p className="text-[10px] text-zinc-500 leading-relaxed">
                                    {comp.description}
                                </p>
                                {comp.requiredProps.length > 0 && (
                                    <p className="text-[9px] text-zinc-600">
                                        Needs: {comp.requiredProps.join(', ')}
                                    </p>
                                )}
                            </button>
                        );
                    })}
                </div>
            </div>
            {(definition.components?.length ?? 0) > 0 && (
                <div className="rounded-xl border border-zinc-700 bg-zinc-800/30 p-3">
                    <p className="text-[10px] uppercase tracking-widest text-zinc-500 mb-2">
                        Selected ({definition.components?.length})
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                        {(definition.components ?? []).map((c) => (
                            <span
                                key={c.registryId}
                                className="rounded-full border border-emerald-700 bg-emerald-900/40 px-2 py-0.5 text-[10px] text-emerald-300"
                            >
                                {c.registryId}
                            </span>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
