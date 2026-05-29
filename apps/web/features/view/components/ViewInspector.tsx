'use client';

import type {
    NormalizedViewDocument,
    ViewLayer,
} from '@/features/view/schemas/objectSchemas';
import { analyzeViewDocument } from '@/features/view/analyzers/viewAnalyzer';
import { getTransformsForStrategy } from '@/features/view/transforms/viewTransforms';

export function ViewInspector({
    document,
    layers,
    onToggleLayer,
}: {
    document: NormalizedViewDocument | null;
    layers: ViewLayer[];
    onToggleLayer: (id: string) => void;
}) {
    const analysis = document ? analyzeViewDocument(document) : null;
    const transforms = document
        ? getTransformsForStrategy(document.strategy)
        : [];

    return (
        <aside className="w-72 shrink-0 border-l border-zinc-800 bg-zinc-950 p-3">
            <div className="space-y-5">
                <section>
                    <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-zinc-500">
                        Metadata
                    </p>
                    {document ? (
                        <dl className="space-y-1 text-xs">
                            <div className="flex justify-between gap-3">
                                <dt className="text-zinc-500">Type</dt>
                                <dd className="text-zinc-300">
                                    {document.category}
                                </dd>
                            </div>
                            <div className="flex justify-between gap-3">
                                <dt className="text-zinc-500">Strategy</dt>
                                <dd className="text-zinc-300">
                                    {document.strategy}
                                </dd>
                            </div>
                            <div className="flex justify-between gap-3">
                                <dt className="text-zinc-500">Words</dt>
                                <dd className="text-zinc-300">
                                    {analysis?.stats.words ?? 0}
                                </dd>
                            </div>
                        </dl>
                    ) : (
                        <p className="text-xs text-zinc-600">
                            No file selected.
                        </p>
                    )}
                </section>
                <section>
                    <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-zinc-500">
                        Layers
                    </p>
                    <div className="space-y-1">
                        {layers.map((layer) => (
                            <button
                                key={layer.id}
                                onClick={() => onToggleLayer(layer.id)}
                                className="flex w-full items-center justify-between rounded-md bg-zinc-900 px-2 py-1.5 text-xs"
                            >
                                <span
                                    className={
                                        layer.visible
                                            ? 'text-zinc-300'
                                            : 'text-zinc-600'
                                    }
                                >
                                    {layer.name}
                                </span>
                                <span className="text-zinc-600">
                                    {layer.visible ? 'on' : 'off'}
                                </span>
                            </button>
                        ))}
                    </div>
                </section>
                <section>
                    <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-zinc-500">
                        Analysis
                    </p>
                    <div className="flex flex-wrap gap-1">
                        {(analysis?.entities ?? [])
                            .slice(0, 8)
                            .map((entity) => (
                                <span
                                    key={entity}
                                    className="rounded bg-zinc-900 px-1.5 py-0.5 text-[10px] text-zinc-400"
                                >
                                    {entity}
                                </span>
                            ))}
                        {analysis && analysis.entities.length === 0 && (
                            <p className="text-xs text-zinc-600">
                                No entities detected.
                            </p>
                        )}
                    </div>
                </section>
                <section>
                    <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-zinc-500">
                        Transforms
                    </p>
                    <div className="space-y-1">
                        {transforms.map((transform) => (
                            <div
                                key={transform.id}
                                className="rounded-md border border-zinc-800 px-2 py-1.5 text-xs text-zinc-400"
                            >
                                {transform.label}
                            </div>
                        ))}
                    </div>
                </section>
            </div>
        </aside>
    );
}
