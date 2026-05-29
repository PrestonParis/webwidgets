'use client';

import { RefreshCcw } from 'lucide-react';
import { Button } from '@/features/ui/components/Button';
import { useWorkspaceActivity } from '../hooks/useWorkspaceActivity';

const ACTION_LABELS: Record<string, string> = {
    workspace_created: 'Created workspace',
    member_invited: 'Invited member',
    member_joined: 'Joined workspace',
    member_removed: 'Removed member',
    member_role_changed: 'Changed member role',
    invite_revoked: 'Revoked invite',
    handoff_created: 'Created handoff',
    handoff_updated: 'Updated handoff',
    handoff_resolved: 'Resolved handoff',
    approval_requested: 'Requested approval',
    approval_approved: 'Approved',
    approval_rejected: 'Rejected',
    approval_withdrawn: 'Withdrew approval',
    comment_added: 'Added comment',
};

function formatTime(iso: string): string {
    const date = new Date(iso);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMin = Math.floor(diffMs / 60_000);
    if (diffMin < 1) return 'just now';
    if (diffMin < 60) return `${diffMin}m ago`;
    const diffHr = Math.floor(diffMin / 60);
    if (diffHr < 24) return `${diffHr}h ago`;
    return date.toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
    });
}

interface ActivityFeedProps {
    workspaceId: string;
}

export function ActivityFeed({ workspaceId }: ActivityFeedProps) {
    const { events, loading, refresh } = useWorkspaceActivity(workspaceId);

    return (
        <div className="space-y-3">
            <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                    Activity
                </h3>
                <Button
                    size="xs"
                    variant="ghost"
                    icon={RefreshCcw}
                    onClick={refresh}
                >
                    Refresh
                </Button>
            </div>

            {loading ? (
                <div className="py-8 text-center text-sm text-zinc-500 dark:text-zinc-400">
                    Loading activity…
                </div>
            ) : events.length === 0 ? (
                <div className="rounded-lg border border-dashed border-zinc-300 bg-zinc-50 p-6 text-center dark:border-zinc-700 dark:bg-zinc-950">
                    <p className="text-sm text-zinc-500 dark:text-zinc-400">
                        No activity yet.
                    </p>
                </div>
            ) : (
                <ul className="max-h-[400px] space-y-1 overflow-y-auto">
                    {events.map((event) => (
                        <li
                            key={event.id}
                            className="flex items-start gap-3 rounded-lg px-3 py-2.5 transition hover:bg-zinc-50 dark:hover:bg-zinc-800/50"
                        >
                            <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-zinc-100 text-[10px] font-semibold uppercase text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300">
                                {(event.actor_email ?? '?')[0]?.toUpperCase() ??
                                    '?'}
                            </span>
                            <div className="min-w-0 flex-1">
                                <span className="text-sm text-zinc-800 dark:text-zinc-200">
                                    <span className="font-medium">
                                        {event.actor_email ?? 'Someone'}
                                    </span>{' '}
                                    {ACTION_LABELS[event.action] ??
                                        event.action}
                                </span>
                                <div className="mt-0.5 text-xs text-zinc-400 dark:text-zinc-500">
                                    {formatTime(event.created_at)}
                                </div>
                            </div>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
}
