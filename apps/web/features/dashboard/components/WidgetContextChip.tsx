'use client';

import { useState } from 'react';
import type { WidgetType } from '@/features/dashboard/types/dashboard';
import { getWidgetLayer, LAYER_META } from '@/features/context/lib/contextLayers';
import { getWidgetManifest } from '@/features/dashboard/runtime/widgetManifestRegistry';
import { cn } from '@/lib/utils/utils';

interface WidgetContextChipProps {
    widgetType: WidgetType;
    className?: string;
}

export function WidgetContextChip({
    widgetType,
    className,
}: WidgetContextChipProps) {
    const [open, setOpen] = useState(false);
    const layer = getWidgetLayer(widgetType);
    const meta = LAYER_META[layer];
    const context = getWidgetManifest(widgetType)?.context;

    if (
        process.env.NODE_ENV !== 'production' &&
        !context &&
        typeof window !== 'undefined'
    ) {
        console.info(
            `[WidgetContextChip] No manifest coverage for widget type "${widgetType}" — layer chip shown without consumes/produces.`,
        );
    }

    return (
        <div className={cn('relative', className)}>
            <button
                type="button"
                data-no-drag
                title={meta.label}
                aria-label={`${meta.label} widget`}
                onClick={(event) => {
                    event.stopPropagation();
                    setOpen((value) => !value);
                }}
                onPointerDown={(event) => event.stopPropagation()}
                className="flex h-3 w-3 items-center justify-center rounded-full ring-2 ring-white dark:ring-zinc-950"
                style={{ backgroundColor: meta.color }}
            />
            {open && (
                <div
                    data-no-drag
                    className="absolute left-0 top-5 z-30 w-52 rounded-lg border border-zinc-200 bg-white p-2.5 text-xs shadow-xl dark:border-zinc-800 dark:bg-zinc-950"
                    onPointerDown={(event) => event.stopPropagation()}
                >
                    <p className="font-semibold text-zinc-700 dark:text-zinc-200">
                        {meta.label}
                    </p>
                    {context ? (
                        <div className="mt-1.5 space-y-1 text-zinc-500 dark:text-zinc-400">
                            {(context.consumedNodeTypes?.length ?? 0) > 0 && (
                                <p>
                                    Consumes:{' '}
                                    {context.consumedNodeTypes!.join(', ')}
                                </p>
                            )}
                            {(context.producedNodeTypes?.length ?? 0) > 0 && (
                                <p>
                                    Produces:{' '}
                                    {context.producedNodeTypes!.join(', ')}
                                </p>
                            )}
                            {!context.contextConsumer &&
                                !context.contextProducer && (
                                    <p>No context data dependencies.</p>
                                )}
                        </div>
                    ) : (
                        <p className="mt-1.5 text-zinc-400">
                            No context data declared for this widget yet.
                        </p>
                    )}
                </div>
            )}
        </div>
    );
}
