'use client';

import { useEffect, useMemo, useState } from 'react';
import { Sparkles, Download, Archive, Loader2 } from 'lucide-react';
import { useArtifacts } from '@/features/artifacts/hooks/useArtifacts';
import { useArtifactMutations } from '@/features/artifacts/hooks/useArtifactMutations';
import type {
    Artifact,
    ArtifactType,
} from '@/features/artifacts/types/artifact';
import type {
    ConversionExtension,
    ConversionJob,
    SupportedConversion,
} from '@/features/convert/types/conversion';
import { cn } from '@/lib/utils/utils';

const TYPE_TABS: Array<{ label: string; value: ArtifactType | 'all' }> = [
    { label: 'All', value: 'all' },
    { label: 'Cheatsheets', value: 'cheatsheet' },
    { label: 'Summaries', value: 'summary' },
    { label: 'Flashcards', value: 'flashcards' },
    { label: 'Study Guides', value: 'study_guide' },
    { label: 'Other', value: 'other' },
];

const TYPE_COLORS: Partial<Record<ArtifactType, string>> = {
    cheatsheet:
        'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300',
    summary:
        'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300',
    flashcards:
        'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300',
    study_guide:
        'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300',
};

function formatDate(dateStr: string): string {
    return new Date(dateStr).toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
    });
}

export default function ArtifactsPage({ initialId }: { initialId?: string }) {
    const [activeTab, setActiveTab] = useState<ArtifactType | 'all'>('all');
    const { data: allArtifacts, isLoading, refresh } = useArtifacts();
    const { archiveArtifact } = useArtifactMutations(refresh);

    const [selectedId, setSelectedId] = useState<string | null>(
        initialId ?? null,
    );

    const filtered =
        activeTab === 'all'
            ? allArtifacts
            : allArtifacts.filter((a) => a.type === activeTab);

    const selected = allArtifacts.find((a) => a.id === selectedId) ?? null;

    const handleArchive = async (a: Artifact) => {
        await archiveArtifact(a.id);
        if (selectedId === a.id) setSelectedId(null);
    };

    return (
        <div className="flex h-full min-h-150 bg-white dark:bg-zinc-950 rounded-2xl border border-zinc-200 dark:border-zinc-800 overflow-hidden">
            {/* Sidebar */}
            <div className="w-72 shrink-0 border-r border-zinc-200 dark:border-zinc-800 flex flex-col">
                {/* Type filter tabs */}
                <div className="px-3 py-3 border-b border-zinc-100 dark:border-zinc-800">
                    <div className="flex flex-wrap gap-1">
                        {TYPE_TABS.map((tab) => (
                            <button
                                key={tab.value}
                                onClick={() => setActiveTab(tab.value)}
                                className={cn(
                                    'px-2.5 py-1 rounded-full text-xs font-medium transition-colors',
                                    activeTab === tab.value
                                        ? 'bg-[#4f6ef7] text-white'
                                        : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-700',
                                )}
                            >
                                {tab.label}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto">
                    {isLoading ? (
                        <div className="space-y-1 p-2">
                            {[1, 2, 3].map((i) => (
                                <div
                                    key={i}
                                    className="h-12 rounded-lg bg-zinc-100 dark:bg-zinc-800 animate-pulse"
                                />
                            ))}
                        </div>
                    ) : filtered.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-32 text-zinc-400 text-sm">
                            No artifacts
                        </div>
                    ) : (
                        <div className="p-2 space-y-0.5">
                            {filtered.map((a) => (
                                <button
                                    key={a.id}
                                    onClick={() => setSelectedId(a.id)}
                                    className={cn(
                                        'w-full flex items-start gap-2 px-3 py-2.5 rounded-lg text-left transition-colors',
                                        selectedId === a.id
                                            ? 'bg-[#4f6ef7]/10 text-[#4f6ef7]'
                                            : 'hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300',
                                    )}
                                >
                                    <Sparkles className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                                    <div className="flex-1 min-w-0">
                                        <div className="text-xs font-medium truncate">
                                            {a.title}
                                        </div>
                                        <div className="flex items-center gap-1.5 mt-0.5">
                                            <span
                                                className={`text-[10px] px-1 py-0.5 rounded ${
                                                    TYPE_COLORS[a.type] ??
                                                    'bg-zinc-100 text-zinc-500 dark:bg-zinc-700 dark:text-zinc-400'
                                                }`}
                                            >
                                                {a.type}
                                            </span>
                                            <span className="text-[10px] text-zinc-400">
                                                {formatDate(a.createdAt)}
                                            </span>
                                        </div>
                                    </div>
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Viewer panel */}
            <div className="flex-1 flex flex-col min-w-0">
                {selected ? (
                    <>
                        <div className="flex items-center justify-between px-6 py-3 border-b border-zinc-100 dark:border-zinc-800">
                            <div>
                                <h2 className="text-sm font-semibold text-zinc-800 dark:text-zinc-100">
                                    {selected.title}
                                </h2>
                                <p className="text-[10px] text-zinc-400">
                                    {selected.type} ·{' '}
                                    {formatDate(selected.createdAt)}
                                </p>
                            </div>
                            <div className="flex items-center gap-2">
                                <a
                                    href={`/api/artifacts/${selected.id}/download?format=md`}
                                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 text-xs hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors"
                                >
                                    <Download className="w-3.5 h-3.5" />
                                    MD
                                </a>
                                <a
                                    href={`/api/artifacts/${selected.id}/download?format=html`}
                                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 text-xs hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors"
                                >
                                    <Download className="w-3.5 h-3.5" />
                                    HTML
                                </a>
                                <a
                                    href={`/api/artifacts/${selected.id}/download?format=txt`}
                                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 text-xs hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors"
                                >
                                    <Download className="w-3.5 h-3.5" />
                                    TXT
                                </a>
                                <button
                                    onClick={() => void handleArchive(selected)}
                                    className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-600 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                                    title="Archive"
                                >
                                    <Archive className="w-4 h-4" />
                                </button>
                            </div>
                        </div>

                        <ArtifactConversionPanel artifact={selected} />

                        <div className="flex-1 overflow-y-auto p-6">
                            {/* Render markdown as preformatted text — replace with a markdown renderer for production */}
                            <pre className="whitespace-pre-wrap font-sans text-sm text-zinc-700 dark:text-zinc-300 leading-relaxed">
                                {selected.content}
                            </pre>
                        </div>
                    </>
                ) : (
                    <div className="flex-1 flex flex-col items-center justify-center text-zinc-400">
                        <Sparkles className="w-12 h-12 mb-3 opacity-20" />
                        <p className="text-sm">Select an artifact to view</p>
                    </div>
                )}
            </div>
        </div>
    );
}

function ArtifactConversionPanel({ artifact }: { artifact: Artifact }) {
    const [conversions, setConversions] = useState<SupportedConversion[]>([]);
    const [target, setTarget] = useState<ConversionExtension | ''>('');
    const [jobId, setJobId] = useState<string | null>(null);
    const [job, setJob] = useState<ConversionJob | null>(null);
    const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const source = artifactSourceExtension(artifact);
    const options = useMemo(
        () =>
            conversions
                .filter((conversion) => conversion.sourceExtension === source)
                .sort((a, b) =>
                    a.targetExtension.localeCompare(b.targetExtension),
                ),
        [conversions, source],
    );

    useEffect(() => {
        let mounted = true;
        fetch('/api/conversion/v1/conversions')
            .then((response) => response.json())
            .then((json: { conversions?: SupportedConversion[] }) => {
                if (!mounted) return;
                setConversions(json.conversions ?? []);
            })
            .catch(() => undefined);
        return () => {
            mounted = false;
        };
    }, []);

    useEffect(() => {
        setTarget('');
        setJobId(null);
        setJob(null);
        setDownloadUrl(null);
        setError(null);
    }, [artifact.id]);

    useEffect(() => {
        if (!jobId) return;
        if (job?.status === 'completed' || job?.status === 'failed') return;
        const interval = window.setInterval(() => {
            fetch(`/api/conversion/v1/jobs/${jobId}`)
                .then((response) => response.json())
                .then((nextJob: ConversionJob) => setJob(nextJob))
                .catch(() => undefined);
        }, 1500);
        return () => window.clearInterval(interval);
    }, [job?.status, jobId]);

    useEffect(() => {
        if (!jobId || job?.status !== 'completed' || downloadUrl) return;
        fetch(`/api/conversion/v1/jobs/${jobId}/download`)
            .then((response) => response.json())
            .then((json: { downloadUrl?: string }) => {
                setDownloadUrl(json.downloadUrl ?? null);
            })
            .catch(() => undefined);
    }, [downloadUrl, job?.status, jobId]);

    async function startConversion() {
        if (!target) return;
        setLoading(true);
        setError(null);
        setJobId(null);
        setJob(null);
        setDownloadUrl(null);
        try {
            const response = await fetch(
                `/api/artifacts/${artifact.id}/convert`,
                {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ targetExtension: target }),
                },
            );
            const json = (await response.json()) as {
                job?: ConversionJob;
                jobId?: string;
                error?: string;
            };
            if (!response.ok || !json.jobId) {
                throw new Error(json.error ?? 'Conversion failed');
            }
            setJobId(json.jobId);
            setJob(json.job ?? null);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Conversion failed');
        } finally {
            setLoading(false);
        }
    }

    if (options.length === 0) return null;

    return (
        <div className="flex flex-wrap items-center gap-2 border-b border-zinc-100 px-6 py-2 text-xs dark:border-zinc-800">
            <span className="text-zinc-500">Convert with service</span>
            <select
                value={target}
                onChange={(event) =>
                    setTarget(event.target.value as ConversionExtension)
                }
                className="rounded-md border border-zinc-200 bg-white px-2 py-1 text-zinc-700 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-200"
            >
                <option value="">Choose format</option>
                {options.map((conversion) => (
                    <option
                        key={`${conversion.sourceExtension}-${conversion.targetExtension}`}
                        value={conversion.targetExtension}
                    >
                        {conversion.targetExtension.toUpperCase()}
                    </option>
                ))}
            </select>
            <button
                type="button"
                disabled={!target || loading}
                onClick={() => void startConversion()}
                className="inline-flex items-center gap-1 rounded-md bg-zinc-900 px-2 py-1 text-white disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-900"
            >
                {loading ? (
                    <Loader2 className="h-3 w-3 animate-spin" />
                ) : (
                    <Download className="h-3 w-3" />
                )}
                Convert
            </button>
            {job && (
                <span className="text-zinc-400">
                    {job.targetExtension.toUpperCase()} {job.status}
                </span>
            )}
            {downloadUrl && (
                <a
                    href={downloadUrl}
                    className="rounded-md bg-emerald-50 px-2 py-1 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-200"
                >
                    Download converted file
                </a>
            )}
            {error && <span className="text-red-500">{error}</span>}
        </div>
    );
}

function artifactSourceExtension(artifact: Artifact): ConversionExtension {
    if (artifact.contentFormat === 'plain_text') return 'txt';
    if (artifact.contentFormat === 'json') return 'json';
    return 'md';
}
