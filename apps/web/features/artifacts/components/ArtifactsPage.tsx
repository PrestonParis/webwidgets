'use client';

import { useState } from 'react';
import { Sparkles, Download, Archive } from 'lucide-react';
import { useArtifacts } from '@/features/artifacts/hooks/useArtifacts';
import { useArtifactMutations } from '@/features/artifacts/hooks/useArtifactMutations';
import type {
    Artifact,
    ArtifactType,
} from '@/features/artifacts/types/artifact';
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

function downloadMarkdown(artifact: Artifact) {
    const blob = new Blob([artifact.content], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${artifact.title.replace(/[^a-z0-9]/gi, '_')}.md`;
    a.click();
    URL.revokeObjectURL(url);
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
        <div className="flex h-full min-h-[600px] bg-white dark:bg-zinc-950 rounded-2xl border border-zinc-200 dark:border-zinc-800 overflow-hidden">
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
                                <button
                                    onClick={() => downloadMarkdown(selected)}
                                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 text-xs hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors"
                                >
                                    <Download className="w-3.5 h-3.5" />
                                    Export
                                </button>
                                <button
                                    onClick={() => void handleArchive(selected)}
                                    className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-600 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                                    title="Archive"
                                >
                                    <Archive className="w-4 h-4" />
                                </button>
                            </div>
                        </div>

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
