'use client';

import { useInsightConsent } from '@/features/tracking/hooks/useInsightConsent';
import { useTrackingInsights } from '@/features/tracking/hooks/useTrackingInsights';
import type { TrackingEntry } from '@/features/tracking/types/tracking';

interface InsightPanelProps {
    entries: TrackingEntry[];
}

function ConsentGate({ onEnable }: { onEnable: () => void }) {
    return (
        <div className="flex flex-col items-center gap-3 py-8 text-center">
            <span className="text-3xl">🔒</span>
            <div>
                <p className="text-sm font-medium text-gray-700 dark:text-zinc-300">
                    Insights are off
                </p>
                <p className="text-xs text-gray-400 dark:text-zinc-500 mt-1 max-w-xs">
                    Enable insights to get pattern analysis based on your logs.
                    No data leaves your device without your consent.
                </p>
            </div>
            <button
                onClick={onEnable}
                className="text-xs px-3 py-1.5 rounded-lg bg-indigo-500 text-white hover:bg-indigo-600 transition-colors"
            >
                Enable insights
            </button>
        </div>
    );
}

function InsightCard({
    title,
    body,
    confidence,
    source,
}: {
    title: string;
    body: string;
    confidence: string;
    source: string;
}) {
    return (
        <div className="p-3 rounded-xl border border-gray-100 dark:border-zinc-800 bg-gray-50 dark:bg-zinc-800/50">
            <div className="flex items-start justify-between gap-2">
                <p className="text-xs font-semibold text-gray-800 dark:text-zinc-200">
                    {title}
                </p>
                <span
                    className={`text-[10px] px-1.5 py-0.5 rounded-full shrink-0 ${
                        source === 'ai'
                            ? 'bg-purple-100 dark:bg-purple-900 text-purple-600 dark:text-purple-300'
                            : 'bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-300'
                    }`}
                >
                    {source === 'ai' ? '✨ AI' : '📐 Rule'}
                </span>
            </div>
            <p className="text-xs text-gray-600 dark:text-zinc-400 mt-1">
                {body}
            </p>
            <p className="text-[10px] text-gray-400 dark:text-zinc-500 mt-1">
                Confidence: {confidence}
            </p>
        </div>
    );
}

export function InsightPanel({ entries }: InsightPanelProps) {
    const { consent, updateConsent, anyConsentGranted } = useInsightConsent();
    const { insights, loading, refresh } = useTrackingInsights(
        entries,
        consent,
    );

    if (!anyConsentGranted) {
        return (
            <ConsentGate
                onEnable={() =>
                    updateConsent({ crossCategoryCorrelations: true })
                }
            />
        );
    }

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <p className="text-sm font-semibold text-gray-800 dark:text-zinc-200">
                    Insights
                </p>
                <button
                    onClick={refresh}
                    className="text-xs text-indigo-500 hover:text-indigo-600 transition-colors"
                >
                    Refresh
                </button>
            </div>

            {loading && (
                <div className="flex justify-center py-6">
                    <div className="w-5 h-5 rounded-full border-2 border-indigo-400 border-t-transparent animate-spin" />
                </div>
            )}

            {!loading && insights.length === 0 && (
                <p className="text-xs text-center text-gray-400 dark:text-zinc-500 py-6">
                    No insights yet — keep logging to build up your data.
                </p>
            )}

            {!loading &&
                insights.map((ins) => (
                    <InsightCard
                        key={ins.id}
                        title={ins.title}
                        body={ins.body}
                        confidence={ins.confidence}
                        source={ins.source}
                    />
                ))}

            <div className="pt-2 border-t border-gray-100 dark:border-zinc-800">
                <label className="flex items-center gap-2 cursor-pointer">
                    <input
                        type="checkbox"
                        checked={consent.aiAnalysis}
                        onChange={(e) =>
                            updateConsent({ aiAnalysis: e.target.checked })
                        }
                        className="accent-indigo-500"
                    />
                    <span className="text-xs text-gray-600 dark:text-zinc-400">
                        Enable AI-assisted analysis
                    </span>
                </label>
            </div>
        </div>
    );
}
