'use client';

import { useState } from 'react';
import { Brain, CheckCircle2, AlertTriangle, XCircle } from 'lucide-react';
import { Button } from '@/features/ui/components/Button';
import type { ContextExportPanelProps } from '@/features/import-export/types/importExport';

const STATUS_ICON = {
    ready: <CheckCircle2 size={14} className="text-emerald-500" />,
    empty: <AlertTriangle size={14} className="text-amber-500" />,
    failed: <XCircle size={14} className="text-red-500" />,
    requested: <Brain size={14} className="text-blue-500" />,
    collecting: <Brain size={14} className="text-blue-500" />,
    unavailable: <XCircle size={14} className="text-zinc-400" />,
    permission_denied: <XCircle size={14} className="text-red-400" />,
};

export function ContextExportPanel({
    contextExports,
    onGenerate,
}: ContextExportPanelProps) {
    const [running, setRunning] = useState(false);
    const [latest, setLatest] = useState<{
        payload?: {
            systemPromptContent?: string;
            warnings?: string[];
            availableSources?: number;
        };
    } | null>(null);

    const handleGenerate = async () => {
        setRunning(true);
        const result = await onGenerate();
        setLatest(result as typeof latest);
        setRunning(false);
    };

    const recent = contextExports[0];

    return (
        <div className="space-y-5">
            {/* Generate */}
            <div className="rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 p-5">
                <div className="flex items-start gap-3 mb-4">
                    <Brain
                        size={20}
                        className="text-violet-500 shrink-0 mt-0.5"
                    />
                    <div>
                        <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                            Context Bundle
                        </h3>
                        <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                            Generate a snapshot of your personal context for use
                            in AI conversations. Collects data from the context
                            graph and registered sources.
                        </p>
                    </div>
                </div>
                <Button
                    icon={Brain}
                    variant="primary"
                    loading={running}
                    onClick={() => void handleGenerate()}
                >
                    Generate Context Bundle
                </Button>

                {latest?.payload && (
                    <div className="mt-4 rounded-lg border border-zinc-100 dark:border-zinc-800 p-3 space-y-2">
                        <p className="text-xs text-zinc-500 dark:text-zinc-400">
                            Sources available:{' '}
                            <strong className="text-zinc-700 dark:text-zinc-300">
                                {latest.payload.availableSources ?? 0}
                            </strong>
                        </p>
                        <p className="text-xs text-zinc-500 dark:text-zinc-400">
                            System prompt length:{' '}
                            <strong className="text-zinc-700 dark:text-zinc-300">
                                {latest.payload.systemPromptContent?.length ??
                                    0}{' '}
                                chars
                            </strong>
                        </p>
                        {(latest.payload.warnings ?? []).length > 0 && (
                            <ul className="text-xs text-amber-600 space-y-0.5">
                                {(latest.payload.warnings ?? []).map(
                                    (w: string, i: number) => (
                                        <li key={i}>{w}</li>
                                    ),
                                )}
                            </ul>
                        )}
                        {latest.payload.systemPromptContent && (
                            <details className="mt-2">
                                <summary className="text-xs font-medium text-zinc-600 dark:text-zinc-400 cursor-pointer">
                                    Preview system prompt
                                </summary>
                                <pre className="mt-2 text-xs text-zinc-600 dark:text-zinc-400 whitespace-pre-wrap bg-zinc-50 dark:bg-zinc-800 rounded p-2 max-h-40 overflow-y-auto">
                                    {latest.payload.systemPromptContent}
                                </pre>
                            </details>
                        )}
                    </div>
                )}
            </div>

            {/* History */}
            {contextExports.length > 0 && (
                <div className="rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 p-5">
                    <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 mb-3">
                        Recent Exports
                    </h3>
                    <div className="space-y-2">
                        {contextExports.map((exp) => (
                            <div
                                key={exp.id}
                                className="flex items-center gap-3 rounded-lg px-3 py-2 bg-zinc-50 dark:bg-zinc-800"
                            >
                                {STATUS_ICON[exp.status] ??
                                    STATUS_ICON.unavailable}
                                <div className="flex-1 min-w-0">
                                    <p className="text-xs text-zinc-600 dark:text-zinc-400">
                                        {new Date(
                                            exp.createdAt,
                                        ).toLocaleString()}
                                    </p>
                                    <p className="text-xs text-zinc-400">
                                        {exp.availableSources} sources ·{' '}
                                        {exp.status}
                                        {exp.warnings.length > 0 &&
                                            ` · ${exp.warnings.length} warning(s)`}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                    {recent && (
                        <p className="mt-3 text-xs text-zinc-400 dark:text-zinc-500">
                            Exports expire 1 hour after generation.
                        </p>
                    )}
                </div>
            )}
        </div>
    );
}
