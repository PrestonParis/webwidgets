'use client';

import { useMemo } from 'react';
import type { SynthesizedWidgetDefinition } from '@/features/widgets/synthesis/widgetDefinitionInterfaces';
import type { WidgetPreviewMode } from '@/features/widgets/types/synthesisWidgets';
import { assembleWidget } from '@/features/widgets/synthesis/widgetAssemblyEngine';
import { SynthesizedWidgetRenderer } from '@/features/widget-builder/renderer/SynthesizedWidgetRenderer';

interface PreviewTestStepProps {
    definition: Partial<SynthesizedWidgetDefinition>;
    previewMode: WidgetPreviewMode;
    onPreviewMode: (mode: WidgetPreviewMode) => void;
}

const PREVIEW_MODES: Array<{ id: WidgetPreviewMode; label: string }> = [
    { id: 'compact', label: 'Compact' },
    { id: 'expanded', label: 'Expanded' },
    { id: 'empty', label: 'Empty' },
    { id: 'loading', label: 'Loading' },
    { id: 'error', label: 'Error' },
];

export function PreviewTestStep({
    definition,
    previewMode,
    onPreviewMode,
}: PreviewTestStepProps) {
    const assembled = useMemo(() => {
        if (!definition.layout || (definition.components?.length ?? 0) === 0)
            return null;
        try {
            return assembleWidget(definition as SynthesizedWidgetDefinition);
        } catch {
            return null;
        }
    }, [definition]);

    const isReadyToPreview =
        definition.layout && (definition.components?.length ?? 0) > 0;

    return (
        <div className="space-y-5">
            <div>
                <p className="text-xs font-semibold uppercase tracking-widest text-zinc-500 mb-3">
                    Preview mode
                </p>
                <div className="flex flex-wrap gap-1.5">
                    {PREVIEW_MODES.map((m) => (
                        <button
                            key={m.id}
                            onClick={() => onPreviewMode(m.id)}
                            className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                                previewMode === m.id
                                    ? 'bg-emerald-600 text-white'
                                    : 'bg-zinc-800 text-zinc-400 hover:text-zinc-200'
                            }`}
                        >
                            {m.label}
                        </button>
                    ))}
                </div>
            </div>

            <div
                className={`rounded-xl border p-4 min-h-[140px] flex items-center justify-center ${isReadyToPreview ? 'border-zinc-700 bg-zinc-800/30' : 'border-dashed border-zinc-700 bg-zinc-900/50'}`}
            >
                {previewMode === 'loading' && (
                    <div className="flex gap-1.5">
                        <span
                            className="h-2 w-2 rounded-full bg-zinc-600 animate-bounce"
                            style={{ animationDelay: '0ms' }}
                        />
                        <span
                            className="h-2 w-2 rounded-full bg-zinc-600 animate-bounce"
                            style={{ animationDelay: '150ms' }}
                        />
                        <span
                            className="h-2 w-2 rounded-full bg-zinc-600 animate-bounce"
                            style={{ animationDelay: '300ms' }}
                        />
                    </div>
                )}
                {previewMode === 'error' && (
                    <div className="flex flex-col items-center gap-2">
                        <span className="text-2xl">⚠️</span>
                        <p className="text-xs text-red-400">
                            Widget failed to load
                        </p>
                    </div>
                )}
                {previewMode === 'empty' && (
                    <div className="flex flex-col items-center gap-2">
                        <span className="text-2xl text-zinc-700">□</span>
                        <p className="text-xs text-zinc-500">No data yet</p>
                    </div>
                )}
                {(previewMode === 'compact' || previewMode === 'expanded') &&
                    (isReadyToPreview ? (
                        <div className="w-full space-y-3">
                            <div className="flex items-center justify-between mb-2">
                                <p className="text-sm font-semibold text-zinc-200">
                                    {definition.name || 'Untitled Widget'}
                                </p>
                                <span className="text-[10px] text-zinc-500 font-mono bg-zinc-700/50 rounded px-1.5 py-0.5">
                                    {definition.layout}
                                </span>
                            </div>
                            <SynthesizedWidgetRenderer
                                definition={
                                    definition as SynthesizedWidgetDefinition
                                }
                            />
                        </div>
                    ) : (
                        <div className="flex flex-col items-center gap-2">
                            <span className="text-2xl text-zinc-600">🔧</span>
                            <p className="text-xs text-zinc-500">
                                Add a layout and components to preview
                            </p>
                        </div>
                    ))}
            </div>

            {assembled && (
                <div className="space-y-3">
                    <div className="grid grid-cols-3 gap-2">
                        <div className="rounded-xl border border-zinc-700 bg-zinc-800/30 p-3 text-center">
                            <p className="text-[10px] uppercase text-zinc-600 mb-1">
                                Complexity
                            </p>
                            <p className="text-sm font-medium text-zinc-200 capitalize">
                                {assembled.definition.metadata.complexity}
                            </p>
                        </div>
                        <div className="rounded-xl border border-zinc-700 bg-zinc-800/30 p-3 text-center">
                            <p className="text-[10px] uppercase text-zinc-600 mb-1">
                                Components
                            </p>
                            <p className="text-sm font-medium text-zinc-200">
                                {assembled.resolvedComponents.length}
                            </p>
                        </div>
                        <div className="rounded-xl border border-zinc-700 bg-zinc-800/30 p-3 text-center">
                            <p className="text-[10px] uppercase text-zinc-600 mb-1">
                                Permissions
                            </p>
                            <p className="text-sm font-medium text-zinc-200">
                                {assembled.requiredPermissions.length}
                            </p>
                        </div>
                    </div>

                    {assembled.issues.length > 0 && (
                        <div className="rounded-xl border border-amber-800 bg-amber-950/20 p-3 space-y-1">
                            <p className="text-[10px] uppercase text-amber-600 mb-1">
                                Issues ({assembled.issues.length})
                            </p>
                            {assembled.issues.map((issue, i) => (
                                <p
                                    key={i}
                                    className={`text-[10px] ${issue.severity === 'error' ? 'text-red-400' : 'text-amber-400'}`}
                                >
                                    {issue.severity === 'error' ? '✕' : '⚠'}{' '}
                                    {issue.message}
                                </p>
                            ))}
                        </div>
                    )}

                    {assembled.isValid && assembled.issues.length === 0 && (
                        <div className="rounded-xl border border-emerald-800 bg-emerald-950/20 p-3">
                            <p className="text-[10px] text-emerald-400">
                                ✓ Widget definition is valid and ready to save
                            </p>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
