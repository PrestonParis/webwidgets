'use client';

import { getRegionLabel } from '@/features/tracking/health/lib/bodyRegions';
import { formatDate } from '@/features/tracking/lib/trackingUtils';
import type {
    InjuryLog,
    InjuryStatus,
} from '@/features/tracking/health/lib/types';

export const STATUS_TONE: Record<InjuryStatus, string> = {
    active: 'bg-rose-100 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300',
    improving:
        'bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300',
    resolved:
        'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300',
    chronic:
        'bg-violet-100 text-violet-700 dark:bg-violet-950/40 dark:text-violet-300',
};

interface InjuryHistoryCardProps {
    log: InjuryLog;
    entryId: string | null;
    onSelect: () => void;
    onUpdateStatus: (logId: string, status: InjuryStatus) => Promise<void>;
    onDelete: (id: string) => void;
}

export function InjuryHistoryCard({
    log,
    entryId,
    onSelect,
    onUpdateStatus,
    onDelete,
}: InjuryHistoryCardProps) {
    return (
        <div className="group rounded-xl border border-gray-100 bg-white p-3 transition-colors hover:bg-gray-50 dark:border-zinc-800 dark:bg-zinc-900 dark:hover:bg-zinc-800/50">
            <div className="flex items-start justify-between gap-2">
                <button
                    type="button"
                    onClick={onSelect}
                    className="min-w-0 flex-1 text-left"
                >
                    <div className="flex flex-wrap items-baseline gap-2">
                        <span className="text-sm font-semibold text-gray-800 dark:text-zinc-200">
                            {getRegionLabel(log.bodyRegionId)}
                        </span>
                        <span className="text-xs capitalize text-gray-500 dark:text-zinc-400">
                            {log.injuryType}
                        </span>
                        <span className="text-xs font-bold text-rose-600 dark:text-rose-400">
                            {log.severity}/10
                        </span>
                        {log.redFlags.length > 0 && (
                            <span className="text-xs text-amber-600 dark:text-amber-400">
                                ⚠ flagged
                            </span>
                        )}
                    </div>
                    <p className="mt-0.5 truncate text-xs text-gray-400 dark:text-zinc-500">
                        {formatDate(log.createdAt.slice(0, 10))}
                        {log.symptoms ? ` · ${log.symptoms}` : ''}
                    </p>
                </button>
                <div className="flex shrink-0 flex-col items-end gap-1.5">
                    <span
                        className={`rounded-full px-2 py-0.5 text-[10px] font-semibold capitalize ${STATUS_TONE[log.status]}`}
                    >
                        {log.status}
                    </span>
                    {entryId && (
                        <button
                            type="button"
                            onClick={() => onDelete(entryId)}
                            className="text-[11px] text-red-400 opacity-0 transition-opacity hover:text-red-600 group-hover:opacity-100"
                            aria-label={`Delete ${getRegionLabel(log.bodyRegionId)} log`}
                        >
                            Delete
                        </button>
                    )}
                </div>
            </div>
            <div className="mt-2 flex flex-wrap gap-1">
                {(
                    [
                        'active',
                        'improving',
                        'resolved',
                        'chronic',
                    ] as InjuryStatus[]
                ).map((status) => (
                    <button
                        key={status}
                        type="button"
                        disabled={status === log.status}
                        onClick={() => void onUpdateStatus(log.id, status)}
                        className={`rounded-md px-1.5 py-0.5 text-[10px] font-medium capitalize transition-colors ${
                            status === log.status
                                ? 'cursor-default opacity-40'
                                : 'border border-gray-200 text-gray-500 hover:bg-gray-100 dark:border-zinc-700 dark:text-zinc-400 dark:hover:bg-zinc-700'
                        }`}
                    >
                        {status}
                    </button>
                ))}
            </div>
        </div>
    );
}
