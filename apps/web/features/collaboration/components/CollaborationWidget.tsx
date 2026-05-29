'use client';

import { GitBranch, Users } from 'lucide-react';
import WidgetShell from '@/features/widgets/components/WidgetShell';
import { useWidgetData } from '@/features/dashboard/runtime/useWidgetData';

export default function CollaborationWidget({
    widgetId = 'collaboration',
}: {
    widgetId?: string;
}) {
    const { payload, loading } = useWidgetData(widgetId, 'collaboration');

    // Extract workspaces and handoffs from adapter payloads
    const workspaces =
        (payload?.sources['collaboration_workspaces']?.data as Array<{
            id: string;
            name: string;
            scope?: string;
            status?: string;
        }> | null) ?? null;

    const handoffs =
        (payload?.sources['collaboration_handoffs']?.data as Array<{
            id: string;
            complete?: boolean;
        }> | null) ?? [];

    const openHandoffs = handoffs.filter((h) => !h.complete).length;

    return (
        <WidgetShell
            icon={<Users size={16} />}
            title="Collaboration"
            widgetId={widgetId}
            widgetType="collaboration"
            footerHref="/collaboration"
            footerLabel="Open workspace ->"
        >
            <div className="space-y-2.5">
                {loading || workspaces === null ? (
                    <p className="text-xs text-zinc-400">Loading…</p>
                ) : workspaces.length === 0 ? (
                    <p className="text-xs text-zinc-500 dark:text-zinc-400">
                        No shared workspaces yet. Create one to start
                        collaborating.
                    </p>
                ) : (
                    <>
                        <div className="flex items-center gap-3">
                            <Users
                                size={14}
                                className="shrink-0 text-blue-500"
                            />
                            <p className="text-xs font-semibold text-zinc-800 dark:text-zinc-200">
                                {workspaces.length}
                                <span className="ml-1 font-normal text-zinc-500 dark:text-zinc-400">
                                    shared workspaces
                                </span>
                            </p>
                        </div>
                        <div className="flex items-center gap-3">
                            <GitBranch
                                size={14}
                                className="shrink-0 text-amber-500"
                            />
                            <p className="text-xs font-semibold text-zinc-800 dark:text-zinc-200">
                                {openHandoffs}
                                <span className="ml-1 font-normal text-zinc-500 dark:text-zinc-400">
                                    open handoffs
                                </span>
                            </p>
                        </div>
                    </>
                )}
            </div>
        </WidgetShell>
    );
}
