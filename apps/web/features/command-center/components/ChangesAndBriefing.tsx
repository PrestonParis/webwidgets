import { ArrowUpRight, Clock3 } from 'lucide-react';
import type { CommandCenterController } from '../hooks/useCommandCenter';
import { changesSince } from '../lib/commandCenterSelectors';
import { SectionShell } from './SectionShell';

function timeLabel(value: string) {
    return new Intl.DateTimeFormat(undefined, {
        dateStyle: 'medium',
        timeStyle: 'short',
    }).format(new Date(value));
}

export function ChangesSection({
    controller,
}: {
    controller: CommandCenterController;
}) {
    const lastSeen = controller.seen.data?.lastSeenAt;
    const changes = controller.timeline.data?.items ?? [];
    const fresh = changesSince(changes, lastSeen ?? null);
    return (
        <SectionShell
            description={
                lastSeen
                    ? `New timeline signals since ${timeLabel(lastSeen)}.`
                    : 'Your latest collected timeline signals.'
            }
            error={controller.timeline.isError}
            href="/news"
            linkLabel="Open timeline"
            loading={controller.timeline.isLoading}
            title={`What changed${fresh.length ? ` · ${fresh.length} new` : ''}`}
        >
            {!changes.length ? (
                <EmptyChanges />
            ) : (
                <ol className="mt-4 grid gap-3">
                    {changes.slice(0, 5).map((item) => (
                        <li
                            className="rounded-xl bg-zinc-50 p-3 dark:bg-zinc-900"
                            key={item.id}
                        >
                            <div className="flex items-start justify-between gap-3">
                                <div>
                                    <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
                                        {item.title}
                                    </p>
                                    {item.summary ? (
                                        <p className="mt-1 line-clamp-2 text-xs leading-5 text-zinc-600 dark:text-zinc-300">
                                            {item.summary}
                                        </p>
                                    ) : null}
                                </div>
                                {(!lastSeen || item.occurredAt > lastSeen) && (
                                    <span className="rounded-full bg-blue-100 px-2 py-0.5 text-[10px] font-semibold text-blue-700 dark:bg-blue-950 dark:text-blue-300">
                                        New
                                    </span>
                                )}
                            </div>
                            <p className="mt-2 flex items-center gap-1 text-[11px] text-zinc-500">
                                <Clock3 aria-hidden size={11} />
                                {item.sourceLabel} ·{' '}
                                {timeLabel(item.occurredAt)}
                            </p>
                        </li>
                    ))}
                </ol>
            )}
        </SectionShell>
    );
}

function EmptyChanges() {
    return (
        <div className="mt-4 rounded-xl border border-dashed border-zinc-300 p-5 dark:border-zinc-700">
            <p className="text-sm font-medium">Collect your first signal</p>
            <p className="mt-1 text-xs leading-5 text-zinc-500">
                Connect Gmail, Calendar, or an RSS source, or create a task.
            </p>
            <a
                className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-blue-600 dark:text-blue-400"
                href="/integrations"
            >
                Connect a source <ArrowUpRight aria-hidden size={12} />
            </a>
        </div>
    );
}

export function BriefingSection({
    controller,
}: {
    controller: CommandCenterController;
}) {
    const briefing = controller.briefing.data;
    const important =
        briefing?.items.filter((item) => item.section !== 'changed') ?? [];
    return (
        <SectionShell
            description="Evidence-backed priorities, due items, and review needs."
            error={controller.briefing.isError}
            href="/news"
            linkLabel="Inspect evidence"
            loading={controller.briefing.isLoading}
            title="What matters now"
        >
            {!briefing || !important.length ? (
                <p className="mt-4 text-sm leading-6 text-zinc-500">
                    No current briefing yet. Once timeline events arrive,
                    generate one from Timeline Intelligence.
                </p>
            ) : (
                <ol className="mt-4 grid gap-3">
                    {important.slice(0, 4).map((item) => (
                        <li key={item.id}>
                            <p className="text-[11px] font-semibold uppercase tracking-wide text-blue-600 dark:text-blue-400">
                                {item.section}
                            </p>
                            <p className="mt-1 text-sm font-medium">
                                {item.title}
                            </p>
                            <p className="mt-1 text-xs leading-5 text-zinc-500">
                                {item.summary}
                            </p>
                        </li>
                    ))}
                </ol>
            )}
            {briefing?.status === 'stale' || briefing?.status === 'failed' ? (
                <p className="mt-4 text-xs text-amber-700 dark:text-amber-300">
                    This briefing is {briefing.status}. Generate a current one
                    before acting on it.
                </p>
            ) : null}
        </SectionShell>
    );
}
