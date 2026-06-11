'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import type { SynthesizedWidgetDefinition } from '@/features/widgets/synthesis/widgetDefinitionInterfaces';
import {
    sanitizeWidgetName,
    sanitizeWidgetDescription,
    sanitizeTags,
} from '@/lib/widget-tools/validationTools';
import { saveCustomWidget } from '@/features/widget-builder/api/widgetBuilderClient';

interface SaveWidgetStepProps {
    definition: Partial<SynthesizedWidgetDefinition>;
    isValid: boolean;
    onUpdate: (patch: Partial<SynthesizedWidgetDefinition>) => void;
    onSave: () => void;
    isSaving?: boolean;
    savedId?: string | null;
}

const CATEGORIES = [
    'finance',
    'health',
    'productivity',
    'communication',
    'data',
    'custom',
] as const;
const ICONS = [
    '📊',
    '💰',
    '🏥',
    '📋',
    '⚡',
    '🔔',
    '📈',
    '🗂️',
    '🌐',
    '✏️',
    '🔹',
    '📅',
];

function patchMeta(
    def: Partial<SynthesizedWidgetDefinition>,
    patch: Partial<SynthesizedWidgetDefinition['metadata']>,
): SynthesizedWidgetDefinition['metadata'] {
    return {
        version: '1.0.0',
        createdBy: 'user',
        tags: [],
        complexity: 'simple',
        ...(def.metadata ?? {}),
        ...patch,
    };
}

export function SaveWidgetStep({
    definition,
    isValid,
    onUpdate,
    onSave,
    isSaving = false,
    savedId = null,
}: SaveWidgetStepProps) {
    const router = useRouter();
    const [tagsInput, setTagsInput] = useState('');
    const [saveError, setSaveError] = useState<string | null>(null);
    const [localSaving, setLocalSaving] = useState(false);

    const commitTags = () => {
        if (!tagsInput.trim()) return;
        const incoming = tagsInput
            .split(',')
            .map((t) => t.trim())
            .filter(Boolean);
        const merged = sanitizeTags([
            ...(definition.metadata?.tags ?? []),
            ...incoming,
        ]);
        onUpdate({ metadata: patchMeta(definition, { tags: merged }) });
        setTagsInput('');
    };

    const removeTag = (tag: string) => {
        const next = (definition.metadata?.tags ?? []).filter((t) => t !== tag);
        onUpdate({ metadata: patchMeta(definition, { tags: next }) });
    };

    const canSave =
        isValid &&
        !!definition.name?.trim() &&
        !isSaving &&
        !localSaving &&
        !savedId;

    const handleSaveClick = async () => {
        if (!canSave) return;
        setSaveError(null);
        setLocalSaving(true);
        try {
            await saveCustomWidget(definition);
            onSave();
        } catch (err) {
            setSaveError(
                err instanceof Error ? err.message : 'Failed to save widget',
            );
        } finally {
            setLocalSaving(false);
        }
    };

    const saving = isSaving || localSaving;

    if (savedId) {
        return (
            <div className="flex flex-col items-center justify-center py-8 gap-4">
                <div className="rounded-xl border border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-950/20 p-4 space-y-3 w-full">
                    <p className="text-sm font-semibold text-emerald-800 dark:text-emerald-300">
                        Widget saved successfully
                    </p>
                    <p className="text-[10px] text-zinc-500 font-mono">
                        {savedId}
                    </p>
                    <button
                        type="button"
                        onClick={() =>
                            router.push(
                                `/dashboard?addWidget=synthesized&widgetId=${savedId}`,
                            )
                        }
                        className="w-full rounded-xl bg-emerald-600 hover:bg-emerald-500 py-2.5 text-sm font-semibold text-white transition-colors"
                    >
                        Add to Dashboard
                    </button>
                    <button
                        type="button"
                        onClick={() => window.location.reload()}
                        className="w-full rounded-xl border border-zinc-200 dark:border-zinc-700 py-2 text-xs text-zinc-600 dark:text-zinc-400"
                    >
                        Create another
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-5">
            <div>
                <p className="text-xs font-semibold uppercase tracking-widest text-zinc-500 mb-2">
                    Widget name
                </p>
                <input
                    type="text"
                    value={definition.name ?? ''}
                    onChange={(e) =>
                        onUpdate({ name: sanitizeWidgetName(e.target.value) })
                    }
                    placeholder="e.g. Monthly Subscription Tracker"
                    maxLength={60}
                    className="w-full rounded-xl border border-zinc-700 bg-zinc-800 px-3 py-2.5 text-sm text-zinc-200 placeholder-zinc-500 focus:border-emerald-500 focus:outline-none"
                />
                <p className="text-[10px] text-zinc-600 mt-1">
                    {(definition.name ?? '').length}/60
                </p>
            </div>

            <div>
                <p className="text-xs font-semibold uppercase tracking-widest text-zinc-500 mb-2">
                    Description
                </p>
                <textarea
                    value={definition.description ?? ''}
                    onChange={(e) =>
                        onUpdate({
                            description: sanitizeWidgetDescription(
                                e.target.value,
                            ),
                        })
                    }
                    placeholder="What does this widget do?"
                    maxLength={500}
                    rows={3}
                    className="w-full rounded-xl border border-zinc-700 bg-zinc-800 px-3 py-2.5 text-sm text-zinc-200 placeholder-zinc-500 focus:border-emerald-500 focus:outline-none resize-none"
                />
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div>
                    <p className="text-xs font-semibold uppercase tracking-widest text-zinc-500 mb-2">
                        Category
                    </p>
                    <select
                        value={definition.category ?? 'custom'}
                        onChange={(e) => onUpdate({ category: e.target.value })}
                        className="w-full rounded-xl border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-zinc-200 focus:border-emerald-500 focus:outline-none"
                    >
                        {CATEGORIES.map((cat) => (
                            <option
                                key={cat}
                                value={cat}
                                className="capitalize"
                            >
                                {cat}
                            </option>
                        ))}
                    </select>
                </div>

                <div>
                    <p className="text-xs font-semibold uppercase tracking-widest text-zinc-500 mb-2">
                        Icon
                    </p>
                    <div className="flex flex-wrap gap-1">
                        {ICONS.map((icon) => (
                            <button
                                key={icon}
                                onClick={() => onUpdate({ icon })}
                                className={`h-8 w-8 rounded-lg border text-base transition-colors ${
                                    definition.icon === icon
                                        ? 'border-emerald-500 bg-emerald-950/30'
                                        : 'border-zinc-700 bg-zinc-800/40 hover:border-zinc-600'
                                }`}
                            >
                                {icon}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            <div>
                <p className="text-xs font-semibold uppercase tracking-widest text-zinc-500 mb-2">
                    Tags
                </p>
                <div className="flex gap-2 mb-2">
                    <input
                        type="text"
                        value={tagsInput}
                        onChange={(e) => setTagsInput(e.target.value)}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter' || e.key === ',') {
                                e.preventDefault();
                                commitTags();
                            }
                        }}
                        placeholder="type a tag, press Enter or comma"
                        className="flex-1 rounded-xl border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-zinc-200 placeholder-zinc-500 focus:border-emerald-500 focus:outline-none"
                    />
                    <button
                        onClick={commitTags}
                        className="rounded-xl border border-zinc-700 bg-zinc-800 px-3 py-2 text-xs text-zinc-400 hover:text-zinc-200 transition-colors"
                    >
                        Add
                    </button>
                </div>
                {(definition.metadata?.tags ?? []).length > 0 && (
                    <div className="flex flex-wrap gap-1.5">
                        {(definition.metadata?.tags ?? []).map((tag) => (
                            <span
                                key={tag}
                                className="flex items-center gap-1 rounded-full border border-zinc-600 bg-zinc-800 px-2 py-0.5 text-[10px] text-zinc-400"
                            >
                                {tag}
                                <button
                                    onClick={() => removeTag(tag)}
                                    className="text-zinc-600 hover:text-zinc-400 leading-none"
                                >
                                    ×
                                </button>
                            </span>
                        ))}
                    </div>
                )}
            </div>

            {saveError && (
                <div className="rounded-xl border border-red-800 bg-red-950/20 p-3">
                    <p className="text-xs text-red-400">{saveError}</p>
                </div>
            )}

            <div className="pt-2">
                <button
                    onClick={handleSaveClick}
                    disabled={!canSave}
                    className={`w-full rounded-xl py-3 text-sm font-semibold transition-colors ${
                        canSave
                            ? 'bg-emerald-600 hover:bg-emerald-500 text-white'
                            : 'bg-zinc-800 text-zinc-600 cursor-not-allowed'
                    }`}
                >
                    {saving
                        ? 'Saving…'
                        : canSave
                          ? '+ Save Widget'
                          : 'Complete required steps first'}
                </button>
                {!isValid && (
                    <p className="text-[10px] text-zinc-500 text-center mt-2">
                        Required: layout, at least one data source and one
                        component.
                    </p>
                )}
            </div>
        </div>
    );
}
