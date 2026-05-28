'use client';

import {
    BODY_REGIONS,
    type TissueType,
} from '@/features/tracking/health/lib/bodyRegions';
import {
    TISSUE_TYPE_CONFIGS,
    type InjuryLog,
    type InjuryStatus,
} from '@/features/tracking/health/lib/types';
import { TrackingSection } from '@/features/tracking/components/TrackingSurface';
import { InjuryHistoryCard } from './InjuryHistoryCard';

const HISTORY_PAGE_SIZE = 20;

const STATUS_FILTERS: { id: InjuryStatus | 'all'; label: string }[] = [
    { id: 'all', label: 'All' },
    { id: 'active', label: 'Active' },
    { id: 'improving', label: 'Improving' },
    { id: 'chronic', label: 'Chronic' },
    { id: 'resolved', label: 'Resolved' },
];

interface HealthHistoryTabProps {
    injuryLogs: InjuryLog[];
    regionFilter: string;
    tissueFilter: TissueType | null;
    statusFilter: InjuryStatus | 'all';
    page: number;
    entryIdByLogId: Map<string, string>;
    onRegionFilterChange: (v: string) => void;
    onTissueFilterChange: (v: TissueType | null) => void;
    onStatusFilterChange: (v: InjuryStatus | 'all') => void;
    onPageChange: (v: number) => void;
    onSelectLog: (regionId: string) => void;
    onUpdateStatus: (logId: string, status: InjuryStatus) => Promise<void>;
    onDelete: (id: string) => void;
}

export function HealthHistoryTab({
    injuryLogs,
    regionFilter,
    tissueFilter,
    statusFilter,
    page,
    entryIdByLogId,
    onRegionFilterChange,
    onTissueFilterChange,
    onStatusFilterChange,
    onPageChange,
    onSelectLog,
    onUpdateStatus,
    onDelete,
}: HealthHistoryTabProps) {
    const loggedRegionIds = BODY_REGIONS.filter((r) =>
        injuryLogs.some((l) => l.bodyRegionId === r.id),
    );

    const filtered = injuryLogs.filter((log) => {
        if (tissueFilter && log.tissueType !== tissueFilter) return false;
        if (statusFilter !== 'all' && log.status !== statusFilter) return false;
        if (regionFilter !== 'all' && log.bodyRegionId !== regionFilter)
            return false;
        return true;
    });

    const pageCount = Math.max(
        1,
        Math.ceil(filtered.length / HISTORY_PAGE_SIZE),
    );
    const safePage = Math.min(page, pageCount - 1);
    const pageItems = filtered.slice(
        safePage * HISTORY_PAGE_SIZE,
        (safePage + 1) * HISTORY_PAGE_SIZE,
    );

    const selectCls =
        'rounded-lg border border-gray-200 bg-white px-2 py-1 text-xs text-gray-700 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300';

    return (
        <TrackingSection>
            <div className="mb-3 flex flex-wrap items-center gap-2">
                <select
                    value={regionFilter}
                    onChange={(e) => {
                        onRegionFilterChange(e.target.value);
                        onPageChange(0);
                    }}
                    className={selectCls}
                    aria-label="Filter by region"
                >
                    <option value="all">All regions</option>
                    {loggedRegionIds.map((r) => (
                        <option key={r.id} value={r.id}>
                            {r.displayName}
                        </option>
                    ))}
                </select>
                <select
                    value={tissueFilter ?? 'all'}
                    onChange={(e) => {
                        onTissueFilterChange(
                            e.target.value === 'all'
                                ? null
                                : (e.target.value as TissueType),
                        );
                        onPageChange(0);
                    }}
                    className={selectCls}
                    aria-label="Filter by tissue type"
                >
                    <option value="all">All tissue</option>
                    {TISSUE_TYPE_CONFIGS.map((c) => (
                        <option key={c.id} value={c.id}>
                            {c.label}
                        </option>
                    ))}
                </select>
                <div className="flex flex-wrap gap-1">
                    {STATUS_FILTERS.map((f) => (
                        <button
                            key={f.id}
                            type="button"
                            onClick={() => {
                                onStatusFilterChange(f.id);
                                onPageChange(0);
                            }}
                            className={`rounded-full border px-2.5 py-1 text-[11px] font-medium transition-colors ${statusFilter === f.id ? 'border-indigo-400 bg-indigo-50 text-indigo-700 dark:border-indigo-500 dark:bg-indigo-950/40 dark:text-indigo-300' : 'border-gray-200 text-gray-500 dark:border-zinc-700 dark:text-zinc-400'}`}
                        >
                            {f.label}
                        </button>
                    ))}
                </div>
            </div>

            {filtered.length === 0 ? (
                <p className="py-10 text-center text-sm text-gray-400 dark:text-zinc-500">
                    No injury logs match these filters.
                </p>
            ) : (
                <div className="space-y-2">
                    {pageItems.map((log) => (
                        <InjuryHistoryCard
                            key={log.id}
                            log={log}
                            entryId={entryIdByLogId.get(log.id) ?? null}
                            onSelect={() => onSelectLog(log.bodyRegionId)}
                            onUpdateStatus={onUpdateStatus}
                            onDelete={onDelete}
                        />
                    ))}
                    {pageCount > 1 && (
                        <div className="flex items-center justify-between pt-2">
                            <button
                                type="button"
                                onClick={() =>
                                    onPageChange(Math.max(0, safePage - 1))
                                }
                                disabled={safePage === 0}
                                className="rounded-lg border border-gray-200 px-3 py-1.5 text-xs text-gray-500 disabled:opacity-40 dark:border-zinc-700"
                            >
                                Previous
                            </button>
                            <span className="text-xs text-gray-400 dark:text-zinc-500">
                                Page {safePage + 1} of {pageCount}
                            </span>
                            <button
                                type="button"
                                onClick={() =>
                                    onPageChange(
                                        Math.min(pageCount - 1, safePage + 1),
                                    )
                                }
                                disabled={safePage >= pageCount - 1}
                                className="rounded-lg border border-gray-200 px-3 py-1.5 text-xs text-gray-500 disabled:opacity-40 dark:border-zinc-700"
                            >
                                Next
                            </button>
                        </div>
                    )}
                </div>
            )}
        </TrackingSection>
    );
}
