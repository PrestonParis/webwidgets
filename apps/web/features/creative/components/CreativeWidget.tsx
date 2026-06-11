'use client';

import { apiRouteFetch } from '@/lib/api/client';
import { useEffect, useState } from 'react';
import { Layers, Palette } from 'lucide-react';
import WidgetShell from '@/features/widgets/components/WidgetShell';
import type { ProjectRecord } from '../hooks/useCreativeStudio';

export default function CreativeWidget({
    widgetId = 'creative',
}: {
    widgetId?: string;
}) {
    const [projects, setProjects] = useState<ProjectRecord[] | null>(null);
    const [layerCount, setLayerCount] = useState(0);

    useEffect(() => {
        void apiRouteFetch('/api/creative/projects')
            .then((r) =>
                r.ok
                    ? (r.json() as Promise<ProjectRecord[]>)
                    : Promise.resolve([]),
            )
            .then(async (ps) => {
                setProjects(ps);
                if (ps.length > 0) {
                    const top = ps[0]!;
                    const layers = await apiRouteFetch(
                        `/api/creative/projects/${top.id}/layers`,
                    )
                        .then((r) =>
                            r.ok
                                ? (r.json() as Promise<unknown[]>)
                                : Promise.resolve([]),
                        )
                        .catch(() => [] as unknown[]);
                    setLayerCount(layers.length);
                }
            })
            .catch(() => {
                setProjects([]);
            });
    }, []);

    return (
        <WidgetShell
            icon={<Palette size={16} />}
            title="Creative Studio"
            badge={
                layerCount > 0 ? (
                    <span className="text-[10px] font-bold text-zinc-400">
                        {layerCount} LAYERS
                    </span>
                ) : undefined
            }
            widgetId={widgetId}
            widgetType="creative"
            footerHref="/creative"
            footerLabel="Open studio ->"
        >
            <div className="space-y-2.5">
                {projects === null ? (
                    <p className="text-xs text-zinc-400">Loading…</p>
                ) : projects.length === 0 ? (
                    <div className="rounded-lg border border-dashed border-zinc-200 dark:border-zinc-800 p-4 text-center">
                        <Palette className="mx-auto mb-2 h-5 w-5 text-zinc-300 dark:text-zinc-600" />
                        <p className="text-xs font-medium text-zinc-600 dark:text-zinc-400">
                            No projects yet
                        </p>
                        <p className="mt-1 text-[11px] leading-4 text-zinc-400 dark:text-zinc-500">
                            Open the studio to create your first creative
                            project.
                        </p>
                    </div>
                ) : (
                    <>
                        <div className="flex items-center gap-3">
                            <Palette
                                size={14}
                                className="shrink-0 text-blue-500"
                            />
                            <p className="text-xs font-semibold text-zinc-800 dark:text-zinc-200">
                                {projects.length}
                                <span className="ml-1 font-normal text-zinc-500 dark:text-zinc-400">
                                    {projects.length === 1
                                        ? 'project'
                                        : 'projects'}
                                </span>
                            </p>
                        </div>
                        {layerCount > 0 && (
                            <div className="flex items-center gap-3">
                                <Layers
                                    size={14}
                                    className="shrink-0 text-emerald-500"
                                />
                                <p className="text-xs font-semibold text-zinc-800 dark:text-zinc-200">
                                    {layerCount}
                                    <span className="ml-1 font-normal text-zinc-500 dark:text-zinc-400">
                                        {layerCount === 1 ? 'layer' : 'layers'}{' '}
                                        in active project
                                    </span>
                                </p>
                            </div>
                        )}
                        <div className="mt-1 space-y-1">
                            {projects.slice(0, 3).map((p) => (
                                <div
                                    key={p.id}
                                    className="flex items-center gap-2 rounded border border-zinc-100 dark:border-zinc-800 px-2 py-1.5"
                                >
                                    <span className="flex-1 truncate text-xs text-zinc-700 dark:text-zinc-300">
                                        {p.title}
                                    </span>
                                    <span className="shrink-0 rounded-full bg-zinc-100 dark:bg-zinc-800 px-1.5 py-0.5 text-[10px] text-zinc-500 dark:text-zinc-400">
                                        {p.format}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </>
                )}
            </div>
        </WidgetShell>
    );
}
