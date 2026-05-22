'use client';

import {
    ACTION_REGISTRY,
    AUTOMATION_REGISTRY,
} from '@/features/widgets/synthesis/actionRegistry';
import type {
    SynthesizedWidgetDefinition,
    SynthesizedActionDef,
    SynthesizedAutomationDef,
} from '@/features/widgets/synthesis/widgetDefinitionSchema';

interface ActionStepProps {
    definition: Partial<SynthesizedWidgetDefinition>;
    onUpdate: (patch: Partial<SynthesizedWidgetDefinition>) => void;
}

function toggleAction(
    def: Partial<SynthesizedWidgetDefinition>,
    id: string,
): SynthesizedActionDef[] {
    const current = def.actions ?? [];
    if (current.some((a) => a.registryId === id))
        return current.filter((a) => a.registryId !== id);
    const entry = ACTION_REGISTRY.find((a) => a.id === id);
    return [...current, { registryId: id, label: entry?.label ?? id }];
}

function toggleAutomation(
    def: Partial<SynthesizedWidgetDefinition>,
    id: string,
): SynthesizedAutomationDef[] {
    const current = def.automations ?? [];
    if (current.some((a) => a.trigger === id))
        return current.filter((a) => a.trigger !== id);
    const entry = AUTOMATION_REGISTRY.find((a) => a.id === id);
    return [...current, { trigger: id, action: entry?.id ?? id }];
}

const SAFE_ACTIONS = ACTION_REGISTRY.filter((a) => a.safe);

export function ActionStep({ definition, onUpdate }: ActionStepProps) {
    return (
        <div className="space-y-5">
            <div>
                <p className="text-xs font-semibold uppercase tracking-widest text-zinc-500 mb-3">
                    User actions
                </p>
                <div className="space-y-1.5">
                    {SAFE_ACTIONS.map((action) => {
                        const selected = (definition.actions ?? []).some(
                            (a) => a.registryId === action.id,
                        );
                        return (
                            <button
                                key={action.id}
                                onClick={() =>
                                    onUpdate({
                                        actions: toggleAction(
                                            definition,
                                            action.id,
                                        ),
                                    })
                                }
                                className={`w-full flex items-center gap-3 rounded-xl border px-3 py-2.5 text-left transition-colors ${
                                    selected
                                        ? 'border-emerald-600 bg-emerald-950/30'
                                        : 'border-zinc-700 bg-zinc-800/40 hover:border-zinc-600'
                                }`}
                            >
                                <span className="text-base w-6 shrink-0">
                                    {action.emoji}
                                </span>
                                <div className="flex-1">
                                    <p
                                        className={`text-sm font-medium ${selected ? 'text-emerald-400' : 'text-zinc-300'}`}
                                    >
                                        {action.label}
                                    </p>
                                    <p className="text-[10px] text-zinc-500">
                                        {action.description}
                                    </p>
                                </div>
                                {action.requiresConfirmation && (
                                    <span className="text-[10px] text-amber-400 shrink-0">
                                        confirms
                                    </span>
                                )}
                                {action.permissions.length > 0 && (
                                    <span className="text-[10px] text-orange-400 shrink-0">
                                        ⚠
                                    </span>
                                )}
                                <div
                                    className={`h-4 w-4 shrink-0 rounded border-2 flex items-center justify-center ${selected ? 'border-emerald-500 bg-emerald-500' : 'border-zinc-600'}`}
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

            <div>
                <p className="text-xs font-semibold uppercase tracking-widest text-zinc-500 mb-3">
                    Automations
                </p>
                <div className="space-y-1.5">
                    {AUTOMATION_REGISTRY.map((auto) => {
                        const selected = (definition.automations ?? []).some(
                            (a) => a.trigger === auto.id,
                        );
                        return (
                            <button
                                key={auto.id}
                                onClick={() =>
                                    onUpdate({
                                        automations: toggleAutomation(
                                            definition,
                                            auto.id,
                                        ),
                                    })
                                }
                                className={`w-full flex items-center gap-3 rounded-xl border px-3 py-2.5 text-left transition-colors ${
                                    selected
                                        ? 'border-blue-600 bg-blue-950/30'
                                        : 'border-zinc-700 bg-zinc-800/40 hover:border-zinc-600'
                                }`}
                            >
                                <span className="text-[10px] uppercase font-semibold text-zinc-500 shrink-0 w-12">
                                    {auto.triggerType}
                                </span>
                                <div className="flex-1">
                                    <p
                                        className={`text-sm font-medium ${selected ? 'text-blue-400' : 'text-zinc-300'}`}
                                    >
                                        {auto.label}
                                    </p>
                                    <p className="text-[10px] text-zinc-500">
                                        {auto.description}
                                    </p>
                                </div>
                                <div
                                    className={`h-4 w-4 shrink-0 rounded border-2 flex items-center justify-center ${selected ? 'border-blue-500 bg-blue-500' : 'border-zinc-600'}`}
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
        </div>
    );
}
