'use client';

import {
    STATUS_STYLES,
    ISSUE_TYPES,
    severityColor,
    type BodyIssue,
    type BodyIssueHistory,
    type IssueStatus,
} from '@/features/tracking/health/lib/bodyIssues';
import { BODY_REGION_MAP } from '@/features/tracking/health/lib/bodyRegions';

function MiniSparkline({ entries }: { entries: BodyIssueHistory[] }) {
    if (entries.length < 2) return null;
    const W = 40;
    const H = 12;
    const pts = entries.map(
        (e, i) =>
            `${(i / (entries.length - 1)) * W},${H - (e.severity / 10) * H}`,
    );
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

interface TimelineIssueRowProps {
    issue: BodyIssue;
    history: BodyIssueHistory[];
    isExpanded: boolean;
    updatingId: string | null;
    onToggle: () => void;
    onStatusChange: (id: string, s: IssueStatus) => void;
}

export function TimelineIssueRow({
    issue,
    history,
    isExpanded,
    updatingId,
    onToggle,
    onStatusChange,
}: TimelineIssueRowProps) {
    const region = BODY_REGION_MAP[issue.regionId];
    const typeInfo = ISSUE_TYPES.find((t) => t.id === issue.issueType);

    return (
        <div className="rounded-xl border border-gray-100 dark:border-zinc-800 bg-white dark:bg-zinc-900 overflow-hidden">
            <button
                type="button"
                onClick={onToggle}
                className="w-full flex items-center gap-2 px-3 py-2.5 text-left hover:bg-gray-50 dark:hover:bg-zinc-800/50 transition-colors"
            >
                <span className="text-base leading-none shrink-0">
                    {typeInfo?.emoji ?? '•'}
                </span>
                <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-medium text-gray-800 dark:text-zinc-200 truncate">
                            {region?.displayName ?? issue.regionId}
                        </span>
                        <span className="text-xs text-gray-500 dark:text-zinc-400 capitalize">
                            {typeInfo?.label ?? issue.issueType}
                        </span>
                    </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                    <MiniSparkline entries={history} />
                    <span
                        className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold text-white shrink-0"
                        style={{
                            backgroundColor: severityColor(issue.severity),
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
            {isExpanded && (
                <div className="px-3 pb-3 border-t border-gray-100 dark:border-zinc-800 pt-2 space-y-2">
                    {issue.notes && (
                        <p className="text-xs text-gray-500 dark:text-zinc-400">
                            {issue.notes}
                        </p>
                    )}
                    {history.length > 0 && (
                        <div>
                            <p className="text-[10px] font-semibold uppercase text-gray-400 dark:text-zinc-500 mb-1">
                                Severity history
                            </p>
                            <div className="flex items-end gap-1">
                                {history.map((h) => (
                                    <div
                                        key={h.id}
                                        className="flex flex-col items-center gap-0.5"
                                        title={`${h.recordedAt.slice(0, 10)}: ${h.severity}/10`}
                                    >
                                        <div
                                            className="w-3 rounded-sm"
                                            style={{
                                                height: `${(h.severity / 10) * 32}px`,
                                                backgroundColor: severityColor(
                                                    h.severity,
                                                ),
                                                opacity: 0.8,
                                            }}
                                        />
                                        <span className="text-[8px] text-gray-400 dark:text-zinc-500">
                                            {h.severity}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                    <div className="flex gap-1 flex-wrap">
                        {(
                            ['active', 'improving', 'resolved'] as IssueStatus[]
                        ).map((s) => (
                            <button
                                key={s}
                                type="button"
                                disabled={
                                    s === issue.status ||
                                    updatingId === issue.id
                                }
                                onClick={() => onStatusChange(issue.id, s)}
                                className={`rounded-md px-1.5 py-0.5 text-[10px] font-medium capitalize transition-colors ${s === issue.status ? 'cursor-default opacity-40' : 'border border-gray-200 dark:border-zinc-700 text-gray-500 dark:text-zinc-400 hover:bg-gray-100 dark:hover:bg-zinc-700'}`}
                            >
                                {updatingId === issue.id ? '…' : s}
                            </button>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
