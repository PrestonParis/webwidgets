'use client';

import {
    INJURY_STATUSES,
    TISSUE_TYPE_CONFIG_MAP,
    type InjuryLog,
    type InjuryStatus,
} from '@/features/tracking/health/lib/types';

const STATUS_TONE: Record<InjuryStatus, string> = {
    active: 'bg-rose-100 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300',
    improving:
        'bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300',
    resolved:
        'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300',
    chronic:
        'bg-violet-100 text-violet-700 dark:bg-violet-950/40 dark:text-violet-300',
};

function timeAgo(iso: string): string {
    const date = new Date(iso);
    if (Number.isNaN(date.getTime())) return iso;
    return date.toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
    });
}

interface InjuryLogHistoryProps {
    regionLogs: InjuryLog[];
    onUpdateStatus: (logId: string, status: InjuryStatus) => Promise<void>;
}

export function InjuryLogHistory({
    regionLogs,
    onUpdateStatus,
}: InjuryLogHistoryProps) {
    if (regionLogs.length === 0) return null;
    return (
        <section>
            <p className="mb-2 text-xs font-semibold text-gray-700 dark:text-zinc-300">
                History for this region ({regionLogs.length})
            </p>
            <div className="space-y-2">
                {regionLogs.map((log) => (
                    <div
                        key={log.id}
                        className="rounded-xl border border-gray-100 bg-gray-50 p-2.5 dark:border-zinc-800 dark:bg-zinc-800/60"
                    >
                        <div className="flex items-center justify-between gap-2">
                            <div className="min-w-0">
                                <p className="truncate text-xs font-semibold text-gray-800 capitalize dark:text-zinc-200">
                                    {log.injuryType} · {log.severity}/10
                                </p>
                                <p className="text-[10px] text-gray-400 dark:text-zinc-500">
                                    {timeAgo(log.createdAt)} ·{' '}
                                    {
                                        TISSUE_TYPE_CONFIG_MAP[log.tissueType]
                                            ?.label
                                    }
                                    {log.redFlags.length > 0
                                        ? ' · ⚠ flagged'
                                        : ''}
                                </p>
                            </div>
                            <span
                                className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold capitalize ${STATUS_TONE[log.status]}`}
                            >
                                {log.status}
                            </span>
                        </div>
                        {log.symptoms && (
                            <p className="mt-1 text-[11px] text-gray-500 dark:text-zinc-400">
                                {log.symptoms}
                            </p>
                        )}
                        <div className="mt-1.5 flex flex-wrap gap-1">
                            {INJURY_STATUSES.map((status) => (
                                <button
                                    key={status}
                                    type="button"
                                    disabled={status === log.status}
                                    onClick={() =>
                                        void onUpdateStatus(log.id, status)
                                    }
                                    className={`rounded-md px-1.5 py-0.5 text-[10px] font-medium capitalize transition-colors ${status === log.status ? 'cursor-default opacity-40' : 'border border-gray-200 text-gray-500 hover:bg-white dark:border-zinc-700 dark:text-zinc-400 dark:hover:bg-zinc-700'}`}
                                >
                                    {status}
                                </button>
                            ))}
                        </div>
                    </div>
                ))}
            </div>
        </section>
    );
}
