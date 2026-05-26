'use client';

import { useMemo, useState } from 'react';
import {
    STATUS_STYLES,
    ISSUE_TYPES,
    severityColor,
    type BodyIssue,
    type BodyIssueHistory,
    type IssueStatus,
} from '@/features/tracking/lib/health/bodyIssues';
import { BODY_REGION_MAP } from '@/features/tracking/lib/health/bodyRegions';

interface IssueTimelineProps {
    issues: BodyIssue[];
    history: Map<string, BodyIssueHistory[]>;
    onUpdateStatus: (id: string, status: IssueStatus) => Promise<void>;
}

type StatusFilter = 'all' | IssueStatus;
type SortKey = 'onset_desc' | 'onset_asc' | 'severity_desc';

const STATUS_FILTER_OPTIONS: { id: StatusFilter; label: string }[] = [
    { id: 'all', label: 'All' },
    { id: 'active', label: 'Active' },
    { id: 'improving', label: 'Improving' },
    { id: 'resolved', label: 'Resolved' },
];

/** Small sparkline for severity history */
function MiniSparkline({ entries }: { entries: BodyIssueHistory[] }) {
    if (entries.length < 2) return null;
    const W = 40;
    const H = 12;
    const pts = entries.map((e, i) => {
        const x = (i / (entries.length - 1)) * W;
        const y = H - (e.severity / 10) * H;
        return `${x},${y}`;
    });
    return (
        <svg
            width={W}
            height={H}
            viewBox={`0 0 ${W} ${H}`}
            aria-hidden
            className="shrink-0"
        >
            <polyline
                points={pts.join(' ')}
                fill="none"
                stroke="#6366f1"
                strokeWidth={1.5}
                strokeLinejoin="round"
                strokeLinecap="round"
            />
        </svg>
    );
}

function groupByDate(issues: BodyIssue[]): Map<string, BodyIssue[]> {
    const map = new Map<string, BodyIssue[]>();
    for (const issue of issues) {
        const date = issue.onsetDate;
        const arr = map.get(date) ?? [];
        arr.push(issue);
        map.set(date, arr);
    }
    return map;
}

function formatDate(d: string): string {
    try {
        return new Date(d + 'T00:00:00').toLocaleDateString(undefined, {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
        });
    } catch {
        return d;
    }
}

export function IssueTimeline({
    issues,
    history,
    onUpdateStatus,
}: IssueTimelineProps) {
    const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
    const [sortKey, setSortKey] = useState<SortKey>('onset_desc');
    const [expandedId, setExpandedId] = useState<string | null>(null);
    const [updatingId, setUpdatingId] = useState<string | null>(null);

    const counts = useMemo(() => {
        const c = { active: 0, improving: 0, resolved: 0 };
        for (const i of issues) c[i.status]++;
        return c;
    }, [issues]);

    const filtered = useMemo(() => {
        let result =
            statusFilter === 'all'
                ? [...issues]
                : issues.filter((i) => i.status === statusFilter);
        if (sortKey === 'onset_desc')
            result.sort((a, b) => b.onsetDate.localeCompare(a.onsetDate));
        else if (sortKey === 'onset_asc')
            result.sort((a, b) => a.onsetDate.localeCompare(b.onsetDate));
        else if (sortKey === 'severity_desc')
            result.sort((a, b) => b.severity - a.severity);
        return result;
    }, [issues, statusFilter, sortKey]);

    const grouped = useMemo(() => groupByDate(filtered), [filtered]);
    const sortedDates = useMemo(() => {
        const dates = Array.from(grouped.keys());
        if (sortKey === 'onset_asc') return dates.sort();
        return dates.sort((a, b) => b.localeCompare(a));
    }, [grouped, sortKey]);

    async function handleStatusChange(id: string, s: IssueStatus) {
        setUpdatingId(id);
        try {
            await onUpdateStatus(id, s);
        } finally {
            setUpdatingId(null);
        }
    }

    return (
        <div className="space-y-4">
            {/* Summary */}
            <div className="flex flex-wrap items-center gap-2 text-xs">
                <span className="font-medium text-rose-600 dark:text-rose-400">
                    {counts.active} active
                </span>
                <span className="text-gray-300 dark:text-zinc-600">·</span>
                <span className="font-medium text-amber-600 dark:text-amber-400">
                    {counts.improving} improving
                </span>
                <span className="text-gray-300 dark:text-zinc-600">·</span>
                <span className="font-medium text-emerald-600 dark:text-emerald-400">
                    {counts.resolved} resolved
                </span>
            </div>

            {/* Filters */}
            <div className="flex flex-wrap items-center gap-2">
                <div className="flex flex-wrap gap-1">
                    {STATUS_FILTER_OPTIONS.map((opt) => (
                        <button
                            key={opt.id}
                            type="button"
                            onClick={() => setStatusFilter(opt.id)}
                            className={`rounded-full border px-2.5 py-1 text-[11px] font-medium transition-colors ${
                                statusFilter === opt.id
                                    ? 'border-indigo-400 bg-indigo-50 text-indigo-700 dark:border-indigo-500 dark:bg-indigo-950/40 dark:text-indigo-300'
                                    : 'border-gray-200 text-gray-500 dark:border-zinc-700 dark:text-zinc-400'
                            }`}
                        >
                            {opt.label}
                        </button>
                    ))}
                </div>
                <select
                    value={sortKey}
                    onChange={(e) => setSortKey(e.target.value as SortKey)}
                    className="ml-auto rounded-lg border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-2 py-1 text-xs text-gray-700 dark:text-zinc-300 focus:outline-none"
                >
                    <option value="onset_desc">Newest first</option>
                    <option value="onset_asc">Oldest first</option>
                    <option value="severity_desc">Severity (high→low)</option>
                </select>
            </div>

            {/* Empty state */}
            {filtered.length === 0 && (
                <p className="py-10 text-center text-sm text-gray-400 dark:text-zinc-500">
                    No issues match these filters.
                </p>
            )}

            {/* Date-grouped list */}
            {sortedDates.map((date) => {
                const dateIssues = grouped.get(date) ?? [];
                return (
                    <div key={date} className="space-y-1.5">
                        <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-400 dark:text-zinc-500">
                            {formatDate(date)}
                        </p>
                        {dateIssues.map((issue) => {
                            const region = BODY_REGION_MAP[issue.regionId];
                            const typeInfo = ISSUE_TYPES.find(
                                (t) => t.id === issue.issueType,
                            );
                            const issueHistory = history.get(issue.id) ?? [];
                            const isExpanded = expandedId === issue.id;

                            return (
                                <div
                                    key={issue.id}
                                    className="rounded-xl border border-gray-100 dark:border-zinc-800 bg-white dark:bg-zinc-900 overflow-hidden"
                                >
                                    {/* Row */}
                                    <button
                                        type="button"
                                        onClick={() =>
                                            setExpandedId(
                                                isExpanded ? null : issue.id,
                                            )
                                        }
                                        className="w-full flex items-center gap-2 px-3 py-2.5 text-left hover:bg-gray-50 dark:hover:bg-zinc-800/50 transition-colors"
                                    >
                                        <span className="text-base leading-none shrink-0">
                                            {typeInfo?.emoji ?? '•'}
                                        </span>
                                        <div className="min-w-0 flex-1">
                                            <div className="flex items-center gap-2 flex-wrap">
                                                <span className="text-sm font-medium text-gray-800 dark:text-zinc-200 truncate">
                                                    {region?.displayName ??
                                                        issue.regionId}
                                                </span>
                                                <span className="text-xs text-gray-500 dark:text-zinc-400 capitalize">
                                                    {typeInfo?.label ??
                                                        issue.issueType}
                                                </span>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2 shrink-0">
                                            <MiniSparkline
                                                entries={issueHistory}
                                            />
                                            <span
                                                className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold text-white shrink-0"
                                                style={{
                                                    backgroundColor:
                                                        severityColor(
                                                            issue.severity,
                                                        ),
                                                }}
                                                aria-label={`Severity ${issue.severity}`}
                                            >
                                                {issue.severity}
                                            </span>
                                            <span
                                                className={`rounded-full px-1.5 py-0.5 text-[10px] font-semibold capitalize ${STATUS_STYLES[issue.status]}`}
                                            >
                                                {issue.status}
                                            </span>
                                            <svg
                                                className={`w-3 h-3 text-gray-400 dark:text-zinc-500 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                                                fill="none"
                                                stroke="currentColor"
                                                viewBox="0 0 24 24"
                                                aria-hidden
                                            >
                                                <path
                                                    strokeLinecap="round"
                                                    strokeLinejoin="round"
                                                    strokeWidth={2}
                                                    d="M19 9l-7 7-7-7"
                                                />
                                            </svg>
                                        </div>
                                    </button>

                                    {/* Expanded content */}
                                    {isExpanded && (
                                        <div className="px-3 pb-3 border-t border-gray-100 dark:border-zinc-800 pt-2 space-y-2">
                                            {issue.notes && (
                                                <p className="text-xs text-gray-500 dark:text-zinc-400">
                                                    {issue.notes}
                                                </p>
                                            )}
                                            {issueHistory.length > 0 && (
                                                <div>
                                                    <p className="text-[10px] font-semibold uppercase text-gray-400 dark:text-zinc-500 mb-1">
                                                        Severity history
                                                    </p>
                                                    <div className="flex items-end gap-1">
                                                        {issueHistory.map(
                                                            (h) => (
                                                                <div
                                                                    key={h.id}
                                                                    className="flex flex-col items-center gap-0.5"
                                                                    title={`${h.recordedAt.slice(0, 10)}: ${h.severity}/10`}
                                                                >
                                                                    <div
                                                                        className="w-3 rounded-sm"
                                                                        style={{
                                                                            height: `${(h.severity / 10) * 32}px`,
                                                                            backgroundColor:
                                                                                severityColor(
                                                                                    h.severity,
                                                                                ),
                                                                            opacity: 0.8,
                                                                        }}
                                                                    />
                                                                    <span className="text-[8px] text-gray-400 dark:text-zinc-500">
                                                                        {
                                                                            h.severity
                                                                        }
                                                                    </span>
                                                                </div>
                                                            ),
                                                        )}
                                                    </div>
                                                </div>
                                            )}
                                            <div className="flex gap-1 flex-wrap">
                                                {(
                                                    [
                                                        'active',
                                                        'improving',
                                                        'resolved',
                                                    ] as IssueStatus[]
                                                ).map((s) => (
                                                    <button
                                                        key={s}
                                                        type="button"
                                                        disabled={
                                                            s ===
                                                                issue.status ||
                                                            updatingId ===
                                                                issue.id
                                                        }
                                                        onClick={() =>
                                                            void handleStatusChange(
                                                                issue.id,
                                                                s,
                                                            )
                                                        }
                                                        className={`rounded-md px-1.5 py-0.5 text-[10px] font-medium capitalize transition-colors ${
                                                            s === issue.status
                                                                ? 'cursor-default opacity-40'
                                                                : 'border border-gray-200 dark:border-zinc-700 text-gray-500 dark:text-zinc-400 hover:bg-gray-100 dark:hover:bg-zinc-700'
                                                        }`}
                                                    >
                                                        {updatingId === issue.id
                                                            ? '…'
                                                            : s}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                );
            })}
        </div>
    );
}
