'use client';

import { useEffect, useState } from 'react';
import Header from '@/features/ui/components/Header';
import {
    useResearchArtifacts,
    useResearchPipelineMutation,
    useResearchStatus,
} from '@/features/research/hooks/useResearchQueue';
import { useResearchSources } from '@/features/research/hooks/useResearchSources';
import type {
    ResearchPipelineDestination,
    ResearchPipelineMode,
    ResearchSourceKind,
} from '@/features/research/types/research';

export function ResearchWorkspacePage() {
    const {
        activeSource,
        clearActiveSource,
        hasHydrated,
        saveLocalSource,
        sources,
    } = useResearchSources();
    const [sourceName, setSourceName] = useState('Local Observatory');
    const [sourceKind, setSourceKind] =
        useState<ResearchSourceKind>('observatory-local');
    const [sourcePath, setSourcePath] = useState('');
    const [topic, setTopic] = useState('');
    const [mode, setMode] = useState<ResearchPipelineMode>('explore');
    const [destination, setDestination] =
        useState<ResearchPipelineDestination>('vault');
    const [webLimit, setWebLimit] = useState(5);
    const [youtubeLimit, setYoutubeLimit] = useState(3);
    const [wikiLinks, setWikiLinks] = useState(10);
    const [tags, setTags] = useState('');
    const activeRoot = activeSource?.rootPath;
    const activeKind = activeSource?.kind;
    const status = useResearchStatus(activeRoot, activeKind);
    const artifacts = useResearchArtifacts(activeRoot, activeKind, topic);
    const pipeline = useResearchPipelineMutation();

    useEffect(() => {
        if (!activeSource) return;
        const timeoutId = window.setTimeout(() => {
            setSourceName(activeSource.name);
            setSourceKind(activeSource.kind);
            setSourcePath(activeSource.rootPath);
        }, 0);
        return () => window.clearTimeout(timeoutId);
    }, [activeSource]);

    const canRun =
        Boolean(activeRoot?.trim()) &&
        Boolean(topic.trim()) &&
        activeKind === 'observatory-local' &&
        status.data?.available === true &&
        !pipeline.isPending;

    return (
        <>
            <Header />
            <main className="min-h-screen bg-zinc-50 px-4 py-6 text-zinc-950 dark:bg-zinc-950 dark:text-zinc-50 md:px-6">
                <div className="mx-auto max-w-6xl space-y-5">
                    <div>
                        <p className="text-xs font-semibold uppercase text-zinc-500">
                            Research infrastructure
                        </p>
                        <h1 className="text-2xl font-semibold">
                            Research Queue
                        </h1>
                        <p className="mt-2 max-w-3xl text-sm text-zinc-600 dark:text-zinc-300">
                            Connect a local research source, search real
                            artifacts, and run configured pipelines that write
                            to your own storage. Runtime data is read only from
                            sources you configure.
                        </p>
                    </div>

                    <section className="grid gap-4 lg:grid-cols-[420px_1fr]">
                        <div className="space-y-4">
                            <section className="rounded-lg border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
                                <div className="mb-3 flex items-center justify-between gap-3">
                                    <h2 className="text-sm font-semibold">
                                        Research Source
                                    </h2>
                                    {sources.length > 0 && (
                                        <span className="text-xs text-zinc-500">
                                            {sources.length} configured
                                        </span>
                                    )}
                                </div>
                                <div className="space-y-3">
                                    <label className="block text-xs font-medium text-zinc-500">
                                        Name
                                        <input
                                            value={sourceName}
                                            onChange={(event) =>
                                                setSourceName(
                                                    event.target.value,
                                                )
                                            }
                                            className="mt-1 w-full rounded border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-950 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50"
                                        />
                                    </label>
                                    <label className="block text-xs font-medium text-zinc-500">
                                        Type
                                        <select
                                            value={sourceKind}
                                            onChange={(event) =>
                                                setSourceKind(
                                                    event.target
                                                        .value as ResearchSourceKind,
                                                )
                                            }
                                            className="mt-1 w-full rounded border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900"
                                        >
                                            <option value="observatory-local">
                                                Local Observatory source
                                            </option>
                                            <option value="obsidian-vault">
                                                Obsidian vault
                                            </option>
                                        </select>
                                    </label>
                                    <label className="block text-xs font-medium text-zinc-500">
                                        Absolute source path
                                        <input
                                            value={sourcePath}
                                            onChange={(event) =>
                                                setSourcePath(
                                                    event.target.value,
                                                )
                                            }
                                            className="mt-1 w-full rounded border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-950 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50"
                                            placeholder="/absolute/path/to/research"
                                        />
                                    </label>
                                    <div className="flex gap-2">
                                        <button
                                            type="button"
                                            disabled={!sourcePath.trim()}
                                            onClick={() =>
                                                saveLocalSource({
                                                    name: sourceName,
                                                    rootPath: sourcePath,
                                                    kind: sourceKind,
                                                })
                                            }
                                            className="rounded bg-zinc-950 px-3 py-2 text-sm font-medium text-white disabled:opacity-40 dark:bg-zinc-50 dark:text-zinc-950"
                                        >
                                            Save source
                                        </button>
                                        <button
                                            type="button"
                                            onClick={clearActiveSource}
                                            className="rounded border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-700"
                                        >
                                            Clear
                                        </button>
                                    </div>
                                    {!hasHydrated && (
                                        <p className="text-xs text-zinc-500">
                                            Loading saved source settings.
                                        </p>
                                    )}
                                    {hasHydrated && !activeSource && (
                                        <p className="rounded border border-dashed border-zinc-300 p-2 text-xs text-zinc-500 dark:border-zinc-700">
                                            Add a local Observatory source or an
                                            Obsidian vault path to enable real
                                            artifact search. Vault creation and
                                            upload adapters stay unavailable
                                            until storage is wired.
                                        </p>
                                    )}
                                </div>
                            </section>

                            <section className="rounded-lg border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
                                <h2 className="mb-3 text-sm font-semibold">
                                    Pipeline
                                </h2>
                                <div className="space-y-3">
                                    <label className="block text-xs font-medium text-zinc-500">
                                        Topic
                                        <input
                                            value={topic}
                                            onChange={(event) =>
                                                setTopic(event.target.value)
                                            }
                                            className="mt-1 w-full rounded border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-950 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50"
                                            placeholder="Search or research a topic"
                                        />
                                    </label>
                                    <div className="grid grid-cols-2 gap-2">
                                        <SelectInput
                                            label="Mode"
                                            value={mode}
                                            onChange={(value) =>
                                                setMode(
                                                    value as ResearchPipelineMode,
                                                )
                                            }
                                            options={[
                                                ['explore', 'Explore'],
                                                ['academic', 'Academic'],
                                            ]}
                                        />
                                        <SelectInput
                                            label="Destination"
                                            value={destination}
                                            onChange={(value) =>
                                                setDestination(
                                                    value as ResearchPipelineDestination,
                                                )
                                            }
                                            options={[
                                                ['vault', 'Write to vault'],
                                                ['zip', 'Prepare zip'],
                                            ]}
                                        />
                                    </div>
                                    <div className="grid grid-cols-3 gap-2">
                                        <NumberInput
                                            label="Web"
                                            value={webLimit}
                                            onChange={setWebLimit}
                                        />
                                        <NumberInput
                                            label="YouTube"
                                            value={youtubeLimit}
                                            onChange={setYoutubeLimit}
                                        />
                                        <NumberInput
                                            label="Wiki links"
                                            value={wikiLinks}
                                            onChange={setWikiLinks}
                                        />
                                    </div>
                                    <label className="block text-xs font-medium text-zinc-500">
                                        Tags
                                        <input
                                            value={tags}
                                            onChange={(event) =>
                                                setTags(event.target.value)
                                            }
                                            className="mt-1 w-full rounded border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900"
                                            placeholder="comma,separated,tags"
                                        />
                                    </label>
                                    <button
                                        disabled={!canRun}
                                        onClick={() =>
                                            pipeline.mutate({
                                                sourceRootPath: activeRoot,
                                                sourceKind: activeKind,
                                                topic: topic.trim(),
                                                mode,
                                                destination,
                                                webLimit,
                                                youtubeLimit,
                                                wikiLinks,
                                                tags: tags
                                                    .split(',')
                                                    .map((tag) => tag.trim())
                                                    .filter(Boolean),
                                            })
                                        }
                                        className="w-full rounded bg-zinc-950 px-3 py-2 text-sm font-medium text-white disabled:opacity-40 dark:bg-zinc-50 dark:text-zinc-950"
                                    >
                                        {pipeline.isPending
                                            ? 'Running pipeline...'
                                            : 'Run pipeline'}
                                    </button>
                                </div>
                            </section>
                        </div>

                        <section className="rounded-lg border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
                            <h2 className="mb-3 text-sm font-semibold">
                                Source Status
                            </h2>
                            {status.isLoading && (
                                <p className="text-sm text-zinc-500">
                                    Checking configured source.
                                </p>
                            )}
                            {status.data && (
                                <div className="space-y-2 text-sm">
                                    <p>
                                        State:{' '}
                                        <strong>
                                            {status.data.available
                                                ? 'available'
                                                : 'unavailable'}
                                        </strong>
                                    </p>
                                    {status.data.rootPath && (
                                        <p>
                                            Root:{' '}
                                            <span className="break-all text-zinc-500">
                                                {status.data.rootPath}
                                            </span>
                                        </p>
                                    )}
                                    {status.data.sourceKind && (
                                        <p>
                                            Type:{' '}
                                            <strong>
                                                {status.data.sourceKind}
                                            </strong>
                                        </p>
                                    )}
                                    <p>
                                        Artifacts:{' '}
                                        <strong>
                                            {status.data.artifactCount}
                                        </strong>
                                    </p>
                                    <p>
                                        Local run:{' '}
                                        <strong>
                                            {status.data.localRunEnabled
                                                ? 'enabled'
                                                : 'disabled'}
                                        </strong>
                                    </p>
                                    {status.data.unavailableReason && (
                                        <p className="rounded border border-amber-200 bg-amber-50 p-2 text-xs text-amber-800 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-200">
                                            {status.data.unavailableReason}
                                        </p>
                                    )}
                                    <div className="flex flex-wrap gap-2 pt-2">
                                        {status.data.vaults.map((vault) => (
                                            <span
                                                key={`${vault.name}-${vault.path}`}
                                                className="rounded border border-zinc-200 px-2 py-1 text-xs dark:border-zinc-800"
                                            >
                                                {vault.name}:{' '}
                                                {vault.exists
                                                    ? 'ready'
                                                    : 'missing'}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            )}
                            {pipeline.data && (
                                <pre className="mt-4 max-h-72 overflow-auto rounded bg-zinc-950 p-3 text-xs text-zinc-50">
                                    {pipeline.data.output ||
                                        pipeline.data.command.join(' ')}
                                </pre>
                            )}
                            {pipeline.isError && (
                                <p className="mt-4 text-sm text-red-500">
                                    {pipeline.error.message}
                                </p>
                            )}
                        </section>
                    </section>

                    <section className="rounded-lg border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
                        <div className="mb-3 flex items-center justify-between">
                            <h2 className="text-sm font-semibold">
                                Matching Artifacts
                            </h2>
                            <span className="text-xs text-zinc-500">
                                {artifacts.data?.length ?? 0}
                            </span>
                        </div>
                        {!activeRoot && (
                            <p className="rounded border border-dashed border-zinc-300 p-3 text-sm text-zinc-500 dark:border-zinc-700">
                                Configure a research source before artifact
                                queries are sent.
                            </p>
                        )}
                        {activeRoot && artifacts.isLoading && (
                            <p className="text-sm text-zinc-500">
                                Loading artifacts from configured source.
                            </p>
                        )}
                        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                            {artifacts.data?.map((artifact) => (
                                <article
                                    key={artifact.id}
                                    className="rounded-lg border border-zinc-200 p-3 dark:border-zinc-800"
                                >
                                    <h3 className="line-clamp-2 text-sm font-medium">
                                        {artifact.title}
                                    </h3>
                                    <p className="mt-1 text-xs uppercase text-zinc-500">
                                        {artifact.sourceType} ·{' '}
                                        {artifact.category}
                                    </p>
                                    <p className="mt-2 line-clamp-3 text-xs text-zinc-600 dark:text-zinc-300">
                                        {artifact.summary}
                                    </p>
                                </article>
                            ))}
                        </div>
                    </section>
                </div>
            </main>
        </>
    );
}

function SelectInput({
    label,
    value,
    onChange,
    options,
}: {
    label: string;
    value: string;
    onChange: (value: string) => void;
    options: Array<[string, string]>;
}) {
    return (
        <label className="block text-xs font-medium text-zinc-500">
            {label}
            <select
                value={value}
                onChange={(event) => onChange(event.target.value)}
                className="mt-1 w-full rounded border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900"
            >
                {options.map(([optionValue, labelText]) => (
                    <option key={optionValue} value={optionValue}>
                        {labelText}
                    </option>
                ))}
            </select>
        </label>
    );
}

function NumberInput({
    label,
    value,
    onChange,
}: {
    label: string;
    value: number;
    onChange: (value: number) => void;
}) {
    return (
        <label className="block text-xs font-medium text-zinc-500">
            {label}
            <input
                type="number"
                min={0}
                max={50}
                value={value}
                onChange={(event) => onChange(Number(event.target.value))}
                className="mt-1 w-full rounded border border-zinc-300 bg-white px-2 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900"
            />
        </label>
    );
}
