'use client';

import { useState } from 'react';
import { BookOpenCheck, Loader2, Search } from 'lucide-react';
import WidgetShell from '@/features/widgets/components/WidgetShell';
import {
    useResearchArtifacts,
    useResearchPipelineMutation,
    useResearchStatus,
} from '@/features/research/hooks/useResearchQueue';
import { useResearchSources } from '@/features/research/hooks/useResearchSources';

export default function ResearchQueueWidget({
    widgetId = 'research-queue',
}: {
    widgetId?: string;
}) {
    const [topic, setTopic] = useState('');
    const { activeSource, hasHydrated } = useResearchSources();
    const activeRoot = activeSource?.rootPath;
    const activeKind = activeSource?.kind;
    const status = useResearchStatus(activeRoot, activeKind);
    const artifacts = useResearchArtifacts(activeRoot, activeKind, topic);
    const pipeline = useResearchPipelineMutation();
    const artifactCount = artifacts.data?.length ?? 0;

    return (
        <WidgetShell
            icon={<BookOpenCheck size={16} />}
            title="Research Queue"
            badge={
                status.data?.available
                    ? `${status.data.artifactCount} artifacts`
                    : 'unavailable'
            }
            widgetId={widgetId}
            widgetType="research-queue"
            footerHref="/research"
            footerLabel="Open research workspace ->"
        >
            <div className="space-y-3">
                <div className="flex items-center gap-2 rounded-lg border border-zinc-200 bg-white px-2.5 py-2 dark:border-zinc-800 dark:bg-zinc-950">
                    <Search size={14} className="text-zinc-400" />
                    <input
                        value={topic}
                        onChange={(event) => setTopic(event.target.value)}
                        placeholder="Research a topic..."
                        className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-zinc-400"
                    />
                </div>

                {!hasHydrated && (
                    <div className="flex items-center gap-2 text-xs text-zinc-500">
                        <Loader2 size={14} className="animate-spin" />
                        Loading source settings
                    </div>
                )}
                {hasHydrated && !activeSource && (
                    <div className="rounded border border-dashed border-zinc-300 p-2 text-xs text-zinc-500 dark:border-zinc-700">
                        Add a research source from the workspace before running
                        pipelines.
                    </div>
                )}
                {activeSource && status.isLoading && (
                    <div className="flex items-center gap-2 text-xs text-zinc-500">
                        <Loader2 size={14} className="animate-spin" />
                        Checking source
                    </div>
                )}
                {status.data && !status.data.available && (
                    <div className="rounded border border-amber-200 bg-amber-50 p-2 text-xs text-amber-800 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-200">
                        {status.data.unavailableReason}
                    </div>
                )}

                <button
                    type="button"
                    disabled={
                        !activeRoot ||
                        activeKind !== 'observatory-local' ||
                        !topic.trim() ||
                        pipeline.isPending ||
                        status.data?.available !== true
                    }
                    onClick={() =>
                        pipeline.mutate({
                            sourceRootPath: activeRoot,
                            sourceKind: activeKind,
                            topic: topic.trim(),
                            mode: 'explore',
                            destination: 'vault',
                            webLimit: 5,
                            youtubeLimit: 3,
                            wikiLinks: 10,
                            tags: [],
                        })
                    }
                    className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-zinc-950 px-3 py-2 text-sm font-medium text-white disabled:opacity-40 dark:bg-zinc-50 dark:text-zinc-950"
                >
                    {pipeline.isPending && (
                        <Loader2 size={14} className="animate-spin" />
                    )}
                    Run topic pipeline
                </button>

                {pipeline.isError && (
                    <p className="text-xs text-red-500">
                        {pipeline.error.message}
                    </p>
                )}

                <div className="space-y-2">
                    {artifacts.isLoading && (
                        <p className="text-xs text-zinc-500">
                            Loading research artifacts.
                        </p>
                    )}
                    {activeRoot &&
                        !artifacts.isLoading &&
                        artifactCount === 0 && (
                            <p className="rounded border border-dashed border-zinc-300 p-2 text-xs text-zinc-500 dark:border-zinc-700">
                                No matching research artifacts.
                            </p>
                        )}
                    {artifacts.data?.slice(0, 4).map((artifact) => (
                        <div
                            key={artifact.id}
                            className="rounded-lg border border-zinc-200 p-2 dark:border-zinc-800"
                        >
                            <p className="line-clamp-1 text-xs font-semibold">
                                {artifact.title}
                            </p>
                            <p className="mt-1 text-[10px] uppercase text-zinc-500">
                                {artifact.sourceType} · {artifact.category}
                            </p>
                        </div>
                    ))}
                </div>
            </div>
        </WidgetShell>
    );
}
