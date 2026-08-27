'use client';

import { FileText, RefreshCw } from 'lucide-react';
import { BriefingItemCard } from '@/features/news/components/BriefingItemCard';
import { BriefingPreferencesForm } from '@/features/news/components/BriefingPreferencesForm';
import { useBriefing } from '@/features/news/hooks/useBriefing';

export function BriefingPanel() {
    const briefing = useBriefing();
    const data = briefing.query.data;
    const generating = Boolean(
        data?.activeJobId || briefing.generate.isPending,
    );
    return (
        <section
            aria-labelledby="briefing-heading"
            className="mb-8 rounded-lg border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-950"
        >
            <header className="flex flex-wrap items-start justify-between gap-3">
                <div>
                    <h2
                        className="flex items-center gap-2 font-semibold"
                        id="briefing-heading"
                    >
                        <FileText aria-hidden size={17} /> Briefing
                    </h2>
                    <p className="mt-1 text-xs text-zinc-500">
                        Ranked changes with links to the timeline evidence
                        behind every item.
                    </p>
                </div>
                <button
                    className="inline-flex items-center gap-2 rounded-md bg-zinc-950 px-3 py-2 text-xs font-semibold text-white disabled:opacity-50 dark:bg-zinc-50 dark:text-zinc-950"
                    disabled={generating}
                    onClick={() =>
                        briefing.generate.mutate(
                            data?.preferences.windowHours ?? 24,
                        )
                    }
                    type="button"
                >
                    <RefreshCw
                        aria-hidden
                        className={generating ? 'animate-spin' : ''}
                        size={13}
                    />
                    {generating ? 'Generating…' : 'Generate now'}
                </button>
            </header>
            <BriefingBody briefing={briefing} />
            {data ? (
                <BriefingPreferencesForm
                    initial={data.preferences}
                    onSave={(preferences) =>
                        briefing.preferences.mutate(preferences)
                    }
                    saving={briefing.preferences.isPending}
                />
            ) : null}
        </section>
    );
}

function BriefingBody({
    briefing,
}: {
    briefing: ReturnType<typeof useBriefing>;
}) {
    const record = briefing.query.data?.briefing;
    if (briefing.query.isLoading)
        return <p className="py-6 text-sm text-zinc-500">Loading briefing…</p>;
    if (briefing.query.isError || briefing.generate.isError)
        return (
            <p className="py-6 text-sm text-red-600" role="alert">
                Briefing service is unavailable. Timeline data was not changed.
            </p>
        );
    if (!record)
        return (
            <p className="py-6 text-sm text-zinc-500">
                Generate your first briefing after timeline events arrive.
            </p>
        );
    if (record.status === 'queued' || record.status === 'generating')
        return (
            <p className="py-6 text-sm text-zinc-500" role="status">
                The durable worker is generating this briefing…
            </p>
        );
    if (record.status === 'failed')
        return (
            <p className="py-6 text-sm text-red-600" role="alert">
                This briefing failed safely. Generate again after checking
                source health.
            </p>
        );
    return (
        <div className="mt-4">
            {record.status === 'stale' ? (
                <p className="mb-2 rounded-md bg-amber-50 p-2 text-xs text-amber-950 dark:bg-amber-950/40 dark:text-amber-100">
                    This briefing has expired. Generate a new one for current
                    coverage.
                </p>
            ) : null}
            {record.warnings.map((warning) => (
                <p
                    className="mb-2 rounded-md bg-amber-50 p-2 text-xs text-amber-950 dark:bg-amber-950/40 dark:text-amber-100"
                    key={warning}
                >
                    {warning}
                </p>
            ))}
            {record.status === 'empty' ? (
                <p className="py-5 text-sm text-zinc-500">
                    No new supported developments were found in this window.
                </p>
            ) : null}
            {record.items.map((item) => (
                <BriefingItemCard
                    disabled={briefing.feedback.isPending}
                    item={item}
                    key={item.id}
                    onFeedback={(rating) =>
                        briefing.feedback.mutate({
                            briefingId: record.id,
                            itemId: item.id,
                            rating,
                        })
                    }
                />
            ))}
            {record.generatedAt ? (
                <p className="mt-3 text-[11px] text-zinc-500">
                    Generated {new Date(record.generatedAt).toLocaleString()} ·{' '}
                    {record.modelProvider} · {record.inputEventCount} events
                    reviewed
                </p>
            ) : null}
        </div>
    );
}
