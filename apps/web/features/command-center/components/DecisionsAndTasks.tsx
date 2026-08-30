import Link from 'next/link';
import type { CommandCenterController } from '../hooks/useCommandCenter';
import { nextTasks, pendingCandidates } from '../lib/commandCenterSelectors';
import { CandidateReview } from './CandidateReview';
import { SectionShell } from './SectionShell';

export function DecisionsSection({
    controller,
}: {
    controller: CommandCenterController;
}) {
    const candidates = pendingCandidates(controller.candidates.data ?? []);
    const automationApprovals = controller.automation.data?.approvals ?? [];
    return (
        <SectionShell
            description="Nothing writes externally until you approve the exact payload."
            error={controller.candidates.isError}
            href="/automation"
            linkLabel={
                automationApprovals.length
                    ? `${automationApprovals.length} automation approval${automationApprovals.length === 1 ? '' : 's'}`
                    : 'Automation approvals'
            }
            loading={controller.candidates.isLoading}
            title="Needs your approval"
        >
            {!candidates.length ? (
                <div className="mt-4 text-sm leading-6 text-zinc-500">
                    <p>No commitment candidates need review.</p>
                    <Link
                        className="mt-2 inline-block text-xs font-semibold text-blue-600 dark:text-blue-400"
                        href="/news"
                    >
                        Review timeline signals
                    </Link>
                </div>
            ) : (
                <div className="mt-4 grid gap-3">
                    {candidates.slice(0, 3).map((candidate) => (
                        <CandidateReview
                            candidate={candidate}
                            disabled={controller.review.isPending}
                            key={candidate.id}
                            onReview={(body) =>
                                controller.review.mutate({
                                    candidateId: candidate.id,
                                    body,
                                })
                            }
                        />
                    ))}
                </div>
            )}
            {controller.review.isError ? (
                <p className="mt-3 text-xs text-red-600" role="alert">
                    That decision was not saved. Refresh the candidate before
                    trying again.
                </p>
            ) : null}
        </SectionShell>
    );
}

function dueLabel(value: string | null) {
    if (!value) return 'No due date';
    return new Intl.DateTimeFormat(undefined, {
        dateStyle: 'medium',
        timeStyle: 'short',
    }).format(new Date(value));
}

export function TasksSection({
    controller,
}: {
    controller: CommandCenterController;
}) {
    const tasks = nextTasks(controller.tasks.data ?? []);
    return (
        <SectionShell
            description="The nearest concrete work, ordered by due date."
            error={controller.tasks.isError}
            href="/dashboard"
            linkLabel="Open task widgets"
            loading={controller.tasks.isLoading}
            title="Next actions"
        >
            {!tasks.length ? (
                <p className="mt-4 text-sm leading-6 text-zinc-500">
                    No open tasks. Approve a task candidate or create one in
                    your workspace.
                </p>
            ) : (
                <ol className="mt-4 divide-y divide-zinc-100 dark:divide-zinc-800">
                    {tasks.slice(0, 6).map((task) => (
                        <li
                            className="flex items-start gap-3 py-3 first:pt-0"
                            key={task.id}
                        >
                            <button
                                aria-label={`Complete ${task.text}`}
                                className="mt-0.5 h-5 w-5 shrink-0 rounded-full border-2 border-zinc-300 hover:border-emerald-600 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-600 dark:border-zinc-700"
                                disabled={controller.finishTask.isPending}
                                onClick={() =>
                                    controller.finishTask.mutate(task.id)
                                }
                                type="button"
                            />
                            <div>
                                <p className="text-sm font-medium">
                                    {task.text}
                                </p>
                                <p className="mt-1 text-[11px] text-zinc-500">
                                    {dueLabel(task.due_at)}
                                </p>
                            </div>
                        </li>
                    ))}
                </ol>
            )}
            {controller.finishTask.isError ? (
                <p className="mt-3 text-xs text-red-600" role="alert">
                    The task was not completed. Try again after refreshing.
                </p>
            ) : null}
        </SectionShell>
    );
}
