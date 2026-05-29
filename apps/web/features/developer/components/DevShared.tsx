'use client';

import { cn } from '@/lib/utils/utils';
import type {
    DiagnosticStatus,
    DeveloperWorkspaceSnapshot,
} from '@/features/developer/schemas/infrastructureSchemas';

export type { DeveloperWorkspaceSnapshot };
export type { DiagnosticStatus };

export type SectionId =
    | 'overview'
    | 'api'
    | 'logs'
    | 'cron'
    | 'queues'
    | 'docker'
    | 'schema'
    | 'realtime'
    | 'network'
    | 'metrics'
    | 'integrations'
    | 'flags'
    | 'env'
    | 'errors'
    | 'storage';

const statusStyles: Record<DiagnosticStatus, string> = {
    healthy:
        'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950 dark:text-emerald-200',
    degraded:
        'border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-200',
    unhealthy:
        'border-red-200 bg-red-50 text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-200',
    unavailable:
        'border-zinc-200 bg-zinc-50 text-zinc-600 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300',
    unknown:
        'border-sky-200 bg-sky-50 text-sky-700 dark:border-sky-900 dark:bg-sky-950 dark:text-sky-200',
};

export function StatusBadge({ status }: { status: DiagnosticStatus }) {
    return (
        <span
            className={cn(
                'inline-flex items-center rounded border px-2 py-0.5 text-[11px] font-semibold uppercase',
                statusStyles[status],
            )}
        >
            {status}
        </span>
    );
}

export function Panel({
    title,
    children,
    action,
}: {
    title: string;
    children: React.ReactNode;
    action?: React.ReactNode;
}) {
    return (
        <section className="rounded-lg border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
            <div className="mb-3 flex items-center justify-between gap-3">
                <h2 className="text-sm font-semibold text-zinc-950 dark:text-zinc-50">
                    {title}
                </h2>
                {action}
            </div>
            {children}
        </section>
    );
}

export function Unavailable({ children }: { children: React.ReactNode }) {
    return (
        <div className="rounded-lg border border-dashed border-zinc-300 bg-zinc-50 p-4 text-sm text-zinc-600 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300">
            {children}
        </div>
    );
}
