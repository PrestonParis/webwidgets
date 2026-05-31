'use client';

import { useEffect, useMemo, useState } from 'react';
import type { Dispatch, SetStateAction } from 'react';
import {
    CheckCircle2,
    Download,
    FileText,
    Loader2,
    Sparkles,
} from 'lucide-react';
import type { FileUpload } from '@/features/uploads/types/upload';
import {
    FILE_AI_ACTIONS,
    type FileAiActionType,
} from '@/features/uploads/lib/fileAiActionOptions';
import { cn } from '@/lib/utils/utils';

type Capability = {
    id: string;
    displayName: string;
    sourceType: string;
    canExport: boolean;
};

type GeneratedResult = {
    artifact: { id: string; title: string };
    documentId: string | null;
    warnings: string[];
};

interface FileAiActionFlowProps {
    files: FileUpload[];
    onOpenArtifacts?: () => void;
}

export function FileAiActionFlow({
    files,
    onOpenArtifacts,
}: FileAiActionFlowProps) {
    const [capabilities, setCapabilities] = useState<Capability[]>([]);
    const [actionType, setActionType] =
        useState<FileAiActionType>('document_summary');
    const [selectedFiles, setSelectedFiles] = useState<string[]>([]);
    const [selectedSources, setSelectedSources] = useState<string[]>([]);
    const [title, setTitle] = useState('');
    const [instructions, setInstructions] = useState('');
    const [exportToDocuments, setExportToDocuments] = useState(true);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [result, setResult] = useState<GeneratedResult | null>(null);

    useEffect(() => {
        let mounted = true;
        fetch('/api/import-export/capabilities')
            .then((res) => res.json())
            .then((json: { capabilities?: Capability[] }) => {
                if (!mounted) return;
                setCapabilities(
                    (json.capabilities ?? []).filter(
                        (capability) =>
                            capability.canExport &&
                            !['files', 'ai_context'].includes(
                                capability.sourceType,
                            ),
                    ),
                );
            })
            .catch(() => undefined);
        return () => {
            mounted = false;
        };
    }, []);

    const selectedAction = useMemo(
        () => FILE_AI_ACTIONS.find((action) => action.type === actionType),
        [actionType],
    );

    const canGenerate =
        !loading && (selectedFiles.length > 0 || selectedSources.length > 0);

    async function generate() {
        if (!canGenerate) return;
        setLoading(true);
        setError(null);
        setResult(null);
        try {
            const res = await fetch('/api/uploads/ai-actions', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    actionType,
                    fileIds: selectedFiles,
                    adapterSourceTypes: selectedSources,
                    title: title.trim() || undefined,
                    instructions,
                    exportToDocuments,
                }),
            });
            const json = (await res.json()) as {
                data?: GeneratedResult;
                error?: string;
                message?: string;
            };
            if (!res.ok || !json.data) {
                throw new Error(
                    json.message ?? json.error ?? 'Generation failed',
                );
            }
            setResult(json.data);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Generation failed');
        } finally {
            setLoading(false);
        }
    }

    return (
        <section className="rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
            <div className="flex items-start gap-3">
                <div className="rounded-lg bg-indigo-50 p-2 text-indigo-600 dark:bg-indigo-950/40 dark:text-indigo-300">
                    <Sparkles className="h-4 w-4" />
                </div>
                <div>
                    <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                        AI file workflow
                    </h2>
                    <p className="mt-0.5 text-xs text-zinc-500">
                        Combine uploaded documents with exportable widget data.
                    </p>
                </div>
            </div>

            <div className="mt-4 grid gap-4">
                <div className="grid gap-2 sm:grid-cols-3">
                    {FILE_AI_ACTIONS.map((action) => (
                        <button
                            key={action.type}
                            type="button"
                            onClick={() => setActionType(action.type)}
                            className={cn(
                                'rounded-lg border px-3 py-2 text-left text-xs transition',
                                actionType === action.type
                                    ? 'border-indigo-500 bg-indigo-50 text-indigo-700 dark:bg-indigo-950/30 dark:text-indigo-200'
                                    : 'border-zinc-200 text-zinc-600 hover:border-zinc-300 dark:border-zinc-800 dark:text-zinc-300',
                            )}
                        >
                            <span className="block font-medium">
                                {action.label}
                            </span>
                            <span className="mt-1 block text-[11px] opacity-75">
                                {action.description}
                            </span>
                        </button>
                    ))}
                </div>

                <div>
                    <label className="text-xs font-medium text-zinc-600 dark:text-zinc-300">
                        Output title
                    </label>
                    <input
                        value={title}
                        onChange={(event) => setTitle(event.target.value)}
                        placeholder={
                            selectedAction
                                ? `${selectedAction.label} ${new Date().toISOString().slice(0, 10)}`
                                : 'Generated artifact'
                        }
                        className="mt-1 w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 outline-none focus:border-indigo-400 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-100"
                    />
                </div>

                <SourcePicker
                    title="Documents"
                    empty="Upload files first. Convert/extract text for best results."
                    items={files.map((file) => ({
                        id: file.id,
                        label: file.originalName,
                        meta: `${file.mimeType} · ${formatBytes(file.sizeBytes)}`,
                    }))}
                    selected={selectedFiles}
                    onToggle={(id) => toggleValue(id, setSelectedFiles)}
                />

                <SourcePicker
                    title="Widget and app data"
                    empty="No exportable import-export sources registered."
                    items={capabilities.map((capability) => ({
                        id: capability.sourceType,
                        label: capability.displayName,
                        meta: capability.sourceType,
                    }))}
                    selected={selectedSources}
                    onToggle={(id) => toggleValue(id, setSelectedSources)}
                />

                <div>
                    <label className="text-xs font-medium text-zinc-600 dark:text-zinc-300">
                        Extra details
                    </label>
                    <textarea
                        value={instructions}
                        onChange={(event) =>
                            setInstructions(event.target.value)
                        }
                        rows={3}
                        placeholder="Example: Compare this against my sleep goals, call out trends, and give a weekly plan."
                        className="mt-1 w-full resize-none rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 outline-none focus:border-indigo-400 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-100"
                    />
                </div>

                <label className="flex items-center gap-2 text-xs text-zinc-600 dark:text-zinc-300">
                    <input
                        type="checkbox"
                        checked={exportToDocuments}
                        onChange={(event) =>
                            setExportToDocuments(event.target.checked)
                        }
                    />
                    Export generated artifact to Documents
                </label>

                <div className="flex flex-wrap items-center gap-2">
                    <button
                        type="button"
                        disabled={!canGenerate}
                        onClick={() => void generate()}
                        className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-3 py-2 text-sm font-medium text-white disabled:cursor-not-allowed disabled:opacity-50"
                    >
                        {loading ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                            <Sparkles className="h-4 w-4" />
                        )}
                        Generate
                    </button>
                    {error && <p className="text-xs text-red-500">{error}</p>}
                </div>

                {result && (
                    <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800 dark:border-emerald-900/60 dark:bg-emerald-950/30 dark:text-emerald-200">
                        <div className="flex items-start gap-2">
                            <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
                            <div className="min-w-0 flex-1">
                                <p className="font-medium">
                                    {result.artifact.title}
                                </p>
                                <div className="mt-2 flex flex-wrap gap-2">
                                    <a
                                        href={`/api/artifacts/${result.artifact.id}/download?format=md`}
                                        className="inline-flex items-center gap-1 rounded-md bg-white px-2 py-1 text-xs text-emerald-700 dark:bg-zinc-900 dark:text-emerald-200"
                                    >
                                        <Download className="h-3 w-3" />
                                        Markdown
                                    </a>
                                    <a
                                        href={`/api/artifacts/${result.artifact.id}/download?format=html`}
                                        className="inline-flex items-center gap-1 rounded-md bg-white px-2 py-1 text-xs text-emerald-700 dark:bg-zinc-900 dark:text-emerald-200"
                                    >
                                        <Download className="h-3 w-3" />
                                        HTML
                                    </a>
                                    <a
                                        href={`/api/artifacts/${result.artifact.id}/download?format=txt`}
                                        className="inline-flex items-center gap-1 rounded-md bg-white px-2 py-1 text-xs text-emerald-700 dark:bg-zinc-900 dark:text-emerald-200"
                                    >
                                        <Download className="h-3 w-3" />
                                        Text
                                    </a>
                                    <button
                                        type="button"
                                        onClick={onOpenArtifacts}
                                        className="inline-flex items-center gap-1 rounded-md bg-white px-2 py-1 text-xs text-emerald-700 dark:bg-zinc-900 dark:text-emerald-200"
                                    >
                                        <FileText className="h-3 w-3" />
                                        View artifact
                                    </button>
                                </div>
                                {result.documentId && (
                                    <p className="mt-2 text-xs">
                                        Exported to Documents.
                                    </p>
                                )}
                                {result.warnings.length > 0 && (
                                    <ul className="mt-2 list-disc pl-4 text-xs">
                                        {result.warnings.map((warning) => (
                                            <li key={warning}>{warning}</li>
                                        ))}
                                    </ul>
                                )}
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </section>
    );
}

function SourcePicker({
    title,
    empty,
    items,
    selected,
    onToggle,
}: {
    title: string;
    empty: string;
    items: Array<{ id: string; label: string; meta: string }>;
    selected: string[];
    onToggle: (id: string) => void;
}) {
    return (
        <div>
            <p className="text-xs font-medium text-zinc-600 dark:text-zinc-300">
                {title}
            </p>
            {items.length === 0 ? (
                <p className="mt-1 text-xs text-zinc-400">{empty}</p>
            ) : (
                <div className="mt-2 grid max-h-44 gap-2 overflow-y-auto sm:grid-cols-2">
                    {items.map((item) => (
                        <label
                            key={item.id}
                            className="flex cursor-pointer items-start gap-2 rounded-lg border border-zinc-200 px-3 py-2 text-xs dark:border-zinc-800"
                        >
                            <input
                                type="checkbox"
                                checked={selected.includes(item.id)}
                                onChange={() => onToggle(item.id)}
                                className="mt-0.5"
                            />
                            <span className="min-w-0">
                                <span className="block truncate font-medium text-zinc-700 dark:text-zinc-200">
                                    {item.label}
                                </span>
                                <span className="block truncate text-zinc-400">
                                    {item.meta}
                                </span>
                            </span>
                        </label>
                    ))}
                </div>
            )}
        </div>
    );
}

function toggleValue(
    value: string,
    setter: Dispatch<SetStateAction<string[]>>,
) {
    setter((current) =>
        current.includes(value)
            ? current.filter((item) => item !== value)
            : [...current, value],
    );
}

function formatBytes(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
