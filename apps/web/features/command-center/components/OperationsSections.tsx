import Link from 'next/link';
import type { CommandCenterController } from '../hooks/useCommandCenter';
import {
    candidateOutcomes,
    impairedSources,
} from '../lib/commandCenterSelectors';
import { SectionShell } from './SectionShell';

export function AutomationHealthSection({
    controller,
}: {
    controller: CommandCenterController;
}) {
    const automation = controller.automation.data;
    const active = automation?.instances.filter((item) => item.enabled) ?? [];
    const errors =
        automation?.runs.filter((item) => item.status === 'failed') ?? [];
    return (
        <SectionShell
            description="The bounded background loop and its safety state."
            error={controller.automation.isError}
            href="/automation"
            linkLabel="Review runs"
            loading={controller.automation.isLoading}
            title="Automation health"
        >
            <div className="mt-4 grid grid-cols-3 gap-2 text-center">
                <Metric label="Active" value={active.length} />
                <Metric
                    label="Approvals"
                    value={automation?.approvals.length ?? 0}
                />
                <Metric label="Errors" value={errors.length} />
            </div>
            <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-xl bg-zinc-50 p-3 dark:bg-zinc-900">
                <div>
                    <p className="text-sm font-medium">
                        {automation?.globalEnabled
                            ? 'Automations are running'
                            : 'All automations are paused'}
                    </p>
                    <p className="mt-1 text-xs text-zinc-500">
                        Pausing does not discard pending approvals or history.
                    </p>
                </div>
                <button
                    className="rounded-lg border border-zinc-300 px-3 py-2 text-xs font-semibold disabled:opacity-50 dark:border-zinc-700"
                    disabled={controller.pause.isPending}
                    onClick={() =>
                        controller.pause.mutate(
                            Boolean(automation?.globalEnabled),
                        )
                    }
                    type="button"
                >
                    {automation?.globalEnabled ? 'Pause all' : 'Resume all'}
                </button>
            </div>
            {controller.pause.isError ? (
                <p className="mt-3 text-xs text-red-600" role="alert">
                    The automation state did not change.
                </p>
            ) : null}
        </SectionShell>
    );
}

function Metric({ label, value }: { label: string; value: number }) {
    return (
        <div className="rounded-xl bg-zinc-50 p-3 dark:bg-zinc-900">
            <p className="text-lg font-semibold">{value}</p>
            <p className="text-[11px] text-zinc-500">{label}</p>
        </div>
    );
}

export function SourceFailuresSection({
    controller,
}: {
    controller: CommandCenterController;
}) {
    const sources = controller.timeline.data?.sources ?? [];
    const impaired = impairedSources(sources);
    return (
        <SectionShell
            description="Stale and disconnected inputs stay visible until resolved."
            error={controller.timeline.isError}
            href="/integrations"
            linkLabel="Manage connections"
            loading={controller.timeline.isLoading}
            title="Source attention"
        >
            {!impaired.length ? (
                <p className="mt-4 text-sm text-zinc-500">
                    {sources.length
                        ? 'No connected sources need attention.'
                        : 'No sources are connected yet.'}
                </p>
            ) : (
                <ul className="mt-4 grid gap-2">
                    {impaired.map((source) => (
                        <li
                            className="flex items-center justify-between gap-3 rounded-xl bg-amber-50 p-3 dark:bg-amber-950/30"
                            key={source.id}
                        >
                            <div>
                                <p className="text-sm font-medium">
                                    {source.label}
                                </p>
                                <p className="mt-1 text-xs text-amber-800 dark:text-amber-200">
                                    {source.health.replaceAll('_', ' ')}
                                    {source.issueCode
                                        ? ` · ${source.issueCode}`
                                        : ''}
                                </p>
                            </div>
                            <Link
                                className="text-xs font-semibold text-amber-900 underline dark:text-amber-100"
                                href="/integrations"
                            >
                                Reconnect
                            </Link>
                        </li>
                    ))}
                </ul>
            )}
        </SectionShell>
    );
}

export function OutcomesSection({
    controller,
}: {
    controller: CommandCenterController;
}) {
    const completedCandidates = candidateOutcomes(
        controller.candidates.data ?? [],
    );
    const runOutcomes = (controller.automation.data?.runs ?? []).filter(
        (item) => ['completed', 'failed'].includes(item.status),
    );
    const unavailable =
        controller.candidates.isError && controller.automation.isError;
    return (
        <SectionShell
            description="Verified completions and failures, never inferred success."
            error={unavailable}
            href="/activity"
            linkLabel="Open activity"
            loading={
                controller.candidates.isLoading ||
                controller.automation.isLoading
            }
            title="Recent outcomes"
        >
            {!completedCandidates.length && !runOutcomes.length ? (
                <p className="mt-4 text-sm text-zinc-500">
                    No completed or failed V1 actions yet.
                </p>
            ) : (
                <ul className="mt-4 grid gap-2">
                    {completedCandidates.slice(0, 3).map((item) => (
                        <li
                            className="rounded-xl bg-zinc-50 p-3 text-sm dark:bg-zinc-900"
                            key={item.id}
                        >
                            <OutcomeStatus failed={item.state === 'failed'} />
                            {typeof item.payload['title'] === 'string'
                                ? item.payload['title']
                                : 'Task action'}
                        </li>
                    ))}
                    {runOutcomes.slice(0, 3).map((run) => (
                        <li
                            className="rounded-xl bg-zinc-50 p-3 text-sm dark:bg-zinc-900"
                            key={run.id}
                        >
                            <OutcomeStatus failed={run.status === 'failed'} />
                            {run.automationName}
                            {run.errorMessage ? ` · ${run.errorMessage}` : ''}
                        </li>
                    ))}
                </ul>
            )}
        </SectionShell>
    );
}

function OutcomeStatus({ failed }: { failed: boolean }) {
    return (
        <span
            className={`mr-2 inline-block rounded-full px-2 py-0.5 text-[10px] font-semibold ${failed ? 'bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300' : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'}`}
        >
            {failed ? 'Failed' : 'Completed'}
        </span>
    );
}
