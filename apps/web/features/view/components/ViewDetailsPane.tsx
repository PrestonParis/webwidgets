'use client';

import { apiRouteFetch } from '@/lib/api/client';
import { createElement, useState } from 'react';
import {
    X,
    Download,
    Trash2,
    Star,
    Archive,
    Pencil,
    Check,
    FileText,
    Loader2,
    Sparkles,
} from 'lucide-react';
import type { ViewFile } from '@/features/view/types/viewFile';
import { getFileIcon } from '@/features/view/lib/fileIcons';
import { formatFileSize } from '@/features/view/lib/formatFileSize';
import { deleteUpload } from '@/features/uploads/api/uploadApi';
import { useQueryClient } from '@tanstack/react-query';
import { useExtraction } from '@/features/extraction/hooks/useExtraction';
import Image from 'next/image';

interface ViewDetailsPaneProps {
    file: ViewFile;
    onClose: () => void;
    onOpen: (file: ViewFile) => void;
    onDeleted: () => void;
}

function formatDate(iso: string): string {
    try {
        return new Intl.DateTimeFormat(undefined, {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        }).format(new Date(iso));
    } catch {
        return iso;
    }
}

export function ViewDetailsPane({
    file,
    onClose,
    onOpen,
    onDeleted,
}: ViewDetailsPaneProps) {
    const queryClient = useQueryClient();
    const [editingName, setEditingName] = useState(false);
    const [nameValue, setNameValue] = useState(file.name);
    const [renaming, setRenaming] = useState(false);
    const [downloading, setDownloading] = useState(false);
    const [deleting, setDeleting] = useState(false);
    const [favoriteState, setFavoriteState] = useState(file.favorite);
    const [favoriteDisabled, setFavoriteDisabled] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [extracting, setExtracting] = useState(false);
    const [generatingCheatsheet, setGeneratingCheatsheet] = useState(false);

    const { extraction, refetch: refetchExtraction } = useExtraction(file.id);

    const handleExtract = async () => {
        setExtracting(true);
        setError(null);
        try {
            const res = await apiRouteFetch(`/api/uploads/${file.id}/extract`, {
                method: 'POST',
            });
            if (!res.ok) {
                const body = (await res.json()) as {
                    error?: string;
                    reason?: string;
                };
                throw new Error(
                    body.reason ?? body.error ?? 'Extraction failed',
                );
            }
            await refetchExtraction();
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Extraction failed');
        } finally {
            setExtracting(false);
        }
    };

    const handleGenerateCheatsheet = async () => {
        setGeneratingCheatsheet(true);
        setError(null);
        try {
            // Create a cheatsheet_generation job
            const jobRes = await apiRouteFetch('/api/jobs', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    type: 'cheatsheet_generation',
                    metadata: { fileId: file.id, title: file.name },
                }),
            });
            if (!jobRes.ok) throw new Error('Failed to create job');
            const { id: jobId } = (await jobRes.json()) as { id: string };

            // Run the job synchronously
            const runRes = await apiRouteFetch(`/api/jobs/${jobId}/run`, {
                method: 'POST',
            });
            if (!runRes.ok) {
                const body = (await runRes.json()) as { error?: string };
                throw new Error(body.error ?? 'Cheatsheet generation failed');
            }
            // Invalidate artifacts so the widget/page refreshes
            await queryClient.invalidateQueries({ queryKey: ['artifacts'] });
        } catch (err) {
            setError(
                err instanceof Error
                    ? err.message
                    : 'Cheatsheet generation failed',
            );
        } finally {
            setGeneratingCheatsheet(false);
        }
    };

    const handleRename = async () => {
        const trimmed = nameValue.trim();
        if (!trimmed || trimmed === file.name) {
            setEditingName(false);
            return;
        }
        setRenaming(true);
        setError(null);
        try {
            const res = await apiRouteFetch(`/api/uploads/${file.id}/rename`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name: trimmed }),
            });
            if (!res.ok) throw new Error('Rename failed');
            await queryClient.invalidateQueries({ queryKey: ['view-files'] });
            setEditingName(false);
        } catch {
            setError('Rename failed');
        } finally {
            setRenaming(false);
        }
    };

    const handleDownload = async () => {
        setDownloading(true);
        setError(null);
        try {
            const res = await apiRouteFetch(`/api/uploads/${file.id}/download`);
            if (!res.ok) throw new Error('Download failed');
            const { downloadUrl } = (await res.json()) as {
                downloadUrl: string;
            };
            const a = document.createElement('a');
            a.href = downloadUrl;
            a.download = file.name;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
        } catch {
            setError('Download failed');
        } finally {
            setDownloading(false);
        }
    };

    const handleDelete = async () => {
        if (!confirm(`Delete "${file.name}"? This cannot be undone.`)) return;
        setDeleting(true);
        setError(null);
        try {
            await deleteUpload(file.id);
            await queryClient.invalidateQueries({ queryKey: ['view-files'] });
            onDeleted();
        } catch {
            setError('Delete failed');
            setDeleting(false);
        }
    };

    const handleFavorite = async () => {
        setFavoriteDisabled(true);
        try {
            const res = await apiRouteFetch(
                `/api/uploads/${file.id}/favorite`,
                {
                    method: 'POST',
                },
            );
            const data = (await res.json()) as {
                ok: boolean;
                favorite?: boolean;
                message?: string;
            };
            if (data.ok && data.favorite !== undefined) {
                setFavoriteState(data.favorite);
                await queryClient.invalidateQueries({
                    queryKey: ['view-files'],
                });
            }
            // If ok=false (metadata table not configured), show tooltip but don't error
        } catch {
            // silently fail
        } finally {
            setFavoriteDisabled(false);
        }
    };

    return (
        <div className="flex w-70 shrink-0 flex-col border-l border-zinc-800 bg-zinc-950/80">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-zinc-800 px-4 py-3">
                <p className="text-xs font-semibold uppercase tracking-widest text-zinc-500">
                    Details
                </p>
                <button
                    onClick={onClose}
                    className="rounded p-0.5 text-zinc-600 hover:bg-zinc-800 hover:text-zinc-300 transition-colors"
                >
                    <X size={14} />
                </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4">
                {/* Preview / Icon */}
                <div className="mb-4 flex items-center justify-center rounded-xl border border-zinc-800 bg-zinc-900 py-8">
                    {file.mimeType.startsWith('image/') ? (
                        <Image
                            src={`/api/uploads/${file.id}/content`}
                            alt={file.name}
                            className="max-h-30 max-w-full rounded object-contain"
                            onError={(e) => {
                                (e.target as HTMLImageElement).style.display =
                                    'none';
                            }}
                        />
                    ) : (
                        createElement(getFileIcon(file.mimeType), {
                            size: 48,
                            className: 'text-zinc-500',
                        })
                    )}
                </div>

                {/* File name (editable) */}
                <div className="mb-4">
                    {editingName ? (
                        <div className="flex items-center gap-1">
                            <input
                                autoFocus
                                type="text"
                                value={nameValue}
                                onChange={(e) => setNameValue(e.target.value)}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter') void handleRename();
                                    if (e.key === 'Escape') {
                                        setEditingName(false);
                                        setNameValue(file.name);
                                    }
                                }}
                                className="flex-1 rounded border border-zinc-700 bg-zinc-900 px-2 py-1 text-sm text-zinc-200 focus:border-indigo-500 focus:outline-none"
                            />
                            <button
                                onClick={() => void handleRename()}
                                disabled={renaming}
                                className="rounded bg-indigo-600 p-1 text-white hover:bg-indigo-500 disabled:opacity-50"
                            >
                                <Check size={13} />
                            </button>
                        </div>
                    ) : (
                        <div className="flex items-start gap-1">
                            <p className="flex-1 break-all text-sm font-semibold text-zinc-100">
                                {file.name}
                            </p>
                            <button
                                onClick={() => setEditingName(true)}
                                className="mt-0.5 shrink-0 rounded p-0.5 text-zinc-600 hover:bg-zinc-800 hover:text-zinc-300 transition-colors"
                                title="Rename"
                            >
                                <Pencil size={11} />
                            </button>
                        </div>
                    )}
                </div>

                {/* Metadata */}
                <dl className="mb-4 space-y-2 text-xs">
                    <div className="flex justify-between">
                        <dt className="text-zinc-500">Type</dt>
                        <dd className="truncate text-right text-zinc-300">
                            {file.mimeType}
                        </dd>
                    </div>
                    <div className="flex justify-between">
                        <dt className="text-zinc-500">Extension</dt>
                        <dd className="text-zinc-300">
                            {file.extension ? `.${file.extension}` : 'N/A'}
                        </dd>
                    </div>
                    <div className="flex justify-between">
                        <dt className="text-zinc-500">Size</dt>
                        <dd className="tabular-nums text-zinc-300">
                            {formatFileSize(file.sizeBytes)}
                        </dd>
                    </div>
                    <div className="flex justify-between">
                        <dt className="text-zinc-500">Uploaded</dt>
                        <dd className="text-right text-zinc-300">
                            {formatDate(file.uploadedAt)}
                        </dd>
                    </div>
                    {file.lastOpenedAt && (
                        <div className="flex justify-between">
                            <dt className="text-zinc-500">Last opened</dt>
                            <dd className="text-right text-zinc-300">
                                {formatDate(file.lastOpenedAt)}
                            </dd>
                        </div>
                    )}
                    <div className="flex justify-between">
                        <dt className="text-zinc-500">Source</dt>
                        <dd>
                            <span className="rounded-full bg-zinc-800 px-2 py-0.5 text-[10px] text-zinc-400">
                                {file.sourceLabel}
                            </span>
                        </dd>
                    </div>
                </dl>

                {/* Text extraction section */}
                <div className="mb-4 rounded-xl border border-zinc-800 bg-zinc-900/50 p-3">
                    <p className="mb-2 text-[10px] font-semibold uppercase tracking-widest text-zinc-500">
                        Content Extraction
                    </p>
                    {!extraction && (
                        <div className="space-y-2">
                            <p className="text-xs text-zinc-600">
                                Extract text to enable AI cheatsheet generation.
                            </p>
                            <button
                                onClick={() => void handleExtract()}
                                disabled={extracting}
                                className="flex w-full items-center justify-center gap-1.5 rounded-lg border border-zinc-700 py-1.5 text-xs text-zinc-300 hover:bg-zinc-800 disabled:opacity-50 transition-colors"
                            >
                                {extracting ? (
                                    <Loader2
                                        size={12}
                                        className="animate-spin"
                                    />
                                ) : (
                                    <FileText size={12} />
                                )}
                                {extracting ? 'Extracting…' : 'Extract Text'}
                            </button>
                        </div>
                    )}
                    {extraction?.extractionStatus === 'processing' && (
                        <div className="flex items-center gap-2 text-xs text-amber-400">
                            <Loader2 size={12} className="animate-spin" />
                            Extracting text…
                        </div>
                    )}
                    {extraction?.extractionStatus === 'ready' && (
                        <div className="space-y-2">
                            <p className="text-xs text-emerald-400">
                                {extraction.characterCount.toLocaleString()}{' '}
                                chars extracted
                                {extraction.tokenEstimate
                                    ? ` (~${extraction.tokenEstimate.toLocaleString()} tokens)`
                                    : ''}
                            </p>
                            <button
                                onClick={() => void handleGenerateCheatsheet()}
                                disabled={generatingCheatsheet}
                                className="flex w-full items-center justify-center gap-1.5 rounded-lg bg-violet-700 py-1.5 text-xs font-medium text-white hover:bg-violet-600 disabled:opacity-50 transition-colors"
                            >
                                {generatingCheatsheet ? (
                                    <Loader2
                                        size={12}
                                        className="animate-spin"
                                    />
                                ) : (
                                    <Sparkles size={12} />
                                )}
                                {generatingCheatsheet
                                    ? 'Generating…'
                                    : 'Generate Cheatsheet'}
                            </button>
                        </div>
                    )}
                    {extraction?.extractionStatus === 'failed' && (
                        <div className="space-y-2">
                            <p className="text-xs text-red-400">
                                {extraction.extractionError ??
                                    'Extraction failed'}
                            </p>
                            <button
                                onClick={() => void handleExtract()}
                                disabled={extracting}
                                className="flex w-full items-center justify-center gap-1.5 rounded-lg border border-zinc-700 py-1.5 text-xs text-zinc-300 hover:bg-zinc-800 disabled:opacity-50 transition-colors"
                            >
                                {extracting ? (
                                    <Loader2
                                        size={12}
                                        className="animate-spin"
                                    />
                                ) : (
                                    <FileText size={12} />
                                )}
                                Retry Extraction
                            </button>
                        </div>
                    )}
                </div>

                {error && (
                    <p className="mb-3 rounded-lg bg-red-950/40 px-3 py-2 text-xs text-red-400">
                        {error}
                    </p>
                )}
            </div>

            {/* Action buttons */}
            <div className="border-t border-zinc-800 p-4 space-y-2">
                <button
                    onClick={() => onOpen(file)}
                    className="w-full rounded-lg bg-indigo-600 py-2 text-sm font-medium text-white hover:bg-indigo-500 transition-colors"
                >
                    Open preview
                </button>
                <div className="grid grid-cols-2 gap-2">
                    <button
                        onClick={() => void handleDownload()}
                        disabled={downloading}
                        className="flex items-center justify-center gap-1.5 rounded-lg border border-zinc-700 py-1.5 text-xs text-zinc-300 hover:bg-zinc-800 disabled:opacity-50 transition-colors"
                    >
                        <Download size={13} />
                        {downloading ? 'Downloading…' : 'Download'}
                    </button>
                    <button
                        onClick={() => void handleFavorite()}
                        disabled={favoriteDisabled}
                        title={
                            favoriteDisabled
                                ? 'Extended metadata not configured'
                                : favoriteState
                                  ? 'Unfavorite'
                                  : 'Favorite'
                        }
                        className={`flex items-center justify-center gap-1.5 rounded-lg border py-1.5 text-xs transition-colors disabled:opacity-50 ${favoriteState ? 'border-amber-600 bg-amber-950/30 text-amber-400' : 'border-zinc-700 text-zinc-300 hover:bg-zinc-800'}`}
                    >
                        <Star
                            size={13}
                            fill={favoriteState ? 'currentColor' : 'none'}
                        />
                        {favoriteState ? 'Favorited' : 'Favorite'}
                    </button>
                </div>
                <div className="grid grid-cols-2 gap-2">
                    <button
                        title="Coming soon"
                        className="flex items-center justify-center gap-1.5 rounded-lg border border-zinc-800 py-1.5 text-xs text-zinc-600 cursor-not-allowed"
                    >
                        {/* TODO(view-v2): Archive action — requires file_metadata table with archived column */}
                        <Archive size={13} />
                        Archive
                    </button>
                    <button
                        onClick={() => void handleDelete()}
                        disabled={deleting}
                        className="flex items-center justify-center gap-1.5 rounded-lg border border-zinc-800 py-1.5 text-xs text-red-500 hover:border-red-700 hover:bg-red-950/30 disabled:opacity-50 transition-colors"
                    >
                        <Trash2 size={13} />
                        {deleting ? 'Deleting…' : 'Delete'}
                    </button>
                </div>
            </div>
        </div>
    );
}
