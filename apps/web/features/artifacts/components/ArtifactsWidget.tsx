'use client';

import { Sparkles } from 'lucide-react';
import Link from 'next/link';
import WidgetShell from '@/features/widgets/components/WidgetShell';
import { useArtifacts } from '@/features/artifacts/hooks/useArtifacts';
import type { ArtifactType } from '@/features/artifacts/types/artifact';

const TYPE_LABELS: Record<ArtifactType, string> = {
    summary: 'Summary',
    cheatsheet: 'Cheatsheet',
    flashcards: 'Flashcards',
    study_guide: 'Study Guide',
    outline: 'Outline',
    report: 'Report',
    action_plan: 'Action Plan',
    extraction: 'Extraction',
    other: 'Other',
};

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
    });
}

export default function ArtifactsWidget() {
    const { data: artifacts, isLoading } = useArtifacts();
    const recent = artifacts.slice(0, 5);

    return (
        <WidgetShell
            icon={<Sparkles />}
            title="Artifacts"
            badge={`${artifacts.length} item${artifacts.length !== 1 ? 's' : ''}`}
            widgetId="artifacts"
            widgetType="artifacts"
            footerHref="/artifacts"
            footerLabel="View all artifacts"
        >
            {isLoading ? (
                <div className="space-y-2 mt-2">
                    {[1, 2, 3].map((i) => (
                        <div
                            key={i}
                            className="h-9 rounded-xl bg-zinc-100 dark:bg-zinc-800 animate-pulse"
                        />
                    ))}
                </div>
            ) : recent.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full py-10 space-y-3">
                    <div className="w-12 h-12 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center">
                        <Sparkles className="w-6 h-6 text-zinc-400" />
                    </div>
                    <p className="text-zinc-400 text-sm font-medium">
                        No artifacts yet
                    </p>
                    <Link
                        href="/files"
                        className="text-xs px-3 py-1.5 rounded-full bg-[#4f6ef7] text-white hover:bg-[#3d5ce5] transition-colors"
                    >
                        Generate from file
                    </Link>
                </div>
            ) : (
                <div className="space-y-1 mt-2">
                    {recent.map((artifact) => (
                        <Link
                            key={artifact.id}
                            href={`/artifacts/${artifact.id}`}
                            className="flex items-center gap-3 px-2 py-2 rounded-xl hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors group/item"
                        >
                            <Sparkles className="w-3.5 h-3.5 shrink-0 text-zinc-400" />
                            <span className="flex-1 text-xs font-medium text-zinc-700 dark:text-zinc-200 truncate">
                                {artifact.title}
                            </span>
                            <span
                                className={`shrink-0 text-[10px] px-1.5 py-0.5 rounded font-medium ${
                                    TYPE_COLORS[artifact.type] ??
                                    'bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400'
                                }`}
                            >
                                {TYPE_LABELS[artifact.type]}
                            </span>
                            <span className="shrink-0 text-[10px] text-zinc-400">
                                {formatDate(artifact.createdAt)}
                            </span>
                        </Link>
                    ))}
                </div>
            )}
        </WidgetShell>
    );
}
