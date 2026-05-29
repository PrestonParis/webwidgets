'use client';

import { useMemo, useState } from 'react';
import {
    STATUS_STYLES,
    ISSUE_TYPES,
    type BodyIssue,
    type BodyIssueHistory,
    type IssueStatus,
} from '@/features/tracking/health/lib/bodyIssues';
import { TimelineIssueRow } from './TimelineIssueRow';

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

void STATUS_STYLES;
void ISSUE_TYPES;

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
        const result =
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

    const grouped = useMemo(() => {
        const map = new Map<string, BodyIssue[]>();
        for (const issue of filtered) {
            const arr = map.get(issue.onsetDate) ?? [];
            arr.push(issue);
            map.set(issue.onsetDate, arr);
        }
        return map;
    }, [filtered]);

    const sortedDates = useMemo(() => {
        const dates = Array.from(grouped.keys());
        return sortKey === 'onset_asc'
            ? dates.sort()
            : dates.sort((a, b) => b.localeCompare(a));
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
            <div className="flex flex-wrap items-center gap-2">
                <div className="flex flex-wrap gap-1">
                    {STATUS_FILTER_OPTIONS.map((opt) => (
                        <button
                            key={opt.id}
                            type="button"
                            onClick={() => setStatusFilter(opt.id)}
                            className={`rounded-full border px-2.5 py-1 text-[11px] font-medium transition-colors ${statusFilter === opt.id ? 'border-indigo-400 bg-indigo-50 text-indigo-700 dark:border-indigo-500 dark:bg-indigo-950/40 dark:text-indigo-300' : 'border-gray-200 text-gray-500 dark:border-zinc-700 dark:text-zinc-400'}`}
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
            {filtered.length === 0 && (
                <p className="py-10 text-center text-sm text-gray-400 dark:text-zinc-500">
                    No issues match these filters.
                </p>
            )}
            {sortedDates.map((date) => (
                <div key={date} className="space-y-1.5">
                    <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-400 dark:text-zinc-500">
                        {formatDate(date)}
                    </p>
                    {(grouped.get(date) ?? []).map((issue) => (
                        <TimelineIssueRow
                            key={issue.id}
                            issue={issue}
                            history={history.get(issue.id) ?? []}
                            isExpanded={expandedId === issue.id}
                            updatingId={updatingId}
                            onToggle={() =>
                                setExpandedId(
                                    expandedId === issue.id ? null : issue.id,
                                )
                            }
                            onStatusChange={(id, s) =>
                                void handleStatusChange(id, s)
                            }
                        />
                    ))}
                </div>
            ))}
        </div>
    );
}
