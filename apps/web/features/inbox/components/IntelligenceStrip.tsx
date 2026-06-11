'use client';

import { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { AttentionCenter } from './AttentionCenter';
import type { Email, EmailAction } from '../types/inbox';

const ALERT_RE =
    /security|alert|urgent|verify|password|breach|suspicious|fraud|warning/i;

export function IntelligenceStrip({
    emails,
    actions,
}: {
    emails: Email[];
    actions: EmailAction[];
}) {
    const [expanded, setExpanded] = useState(false);

    const urgentCount = (() => {
        let n = 0;
        for (const a of actions) {
            if (a.completed || !a.due_date) continue;
            if (a.type !== 'deadline' && a.type !== 'event') continue;
            const days =
                (new Date(a.due_date).getTime() - Date.now()) / 86_400_000;
            if (days < 1) n++;
        }
        for (const e of emails) {
            if (ALERT_RE.test(e.subject)) n++;
        }
        return n;
    })();

    const meetingCount = actions.filter(
        (a) => a.type === 'event' && !a.completed && !a.synced,
    ).length;
    const deadlineCount = actions.filter(
        (a) => a.type === 'deadline' && !a.completed && !a.synced,
    ).length;
    const needsReplyCount = emails.filter(
        (e) => e.category === 'work' || e.category === 'personal',
    ).length;

    const total = urgentCount + meetingCount + deadlineCount + needsReplyCount;
    if (total === 0) return null;

    return (
        <div className="border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 shrink-0">
            {/* Compact summary bar */}
            <div className="flex items-center gap-3 px-4 py-2 flex-wrap">
                {urgentCount > 0 && (
                    <span className="flex items-center gap-1 text-[11px] font-medium text-red-500">
                        <span>⚠️</span>
                        {urgentCount} urgent
                    </span>
                )}
                {meetingCount > 0 && (
                    <span className="flex items-center gap-1 text-[11px] font-medium text-purple-500">
                        <span>📅</span>
                        {meetingCount} meeting{meetingCount !== 1 ? 's' : ''}
                    </span>
                )}
                {deadlineCount > 0 && (
                    <span className="flex items-center gap-1 text-[11px] font-medium text-amber-500">
                        <span>⏰</span>
                        {deadlineCount} deadline{deadlineCount !== 1 ? 's' : ''}
                    </span>
                )}
                {needsReplyCount > 0 && (
                    <span className="flex items-center gap-1 text-[11px] font-medium text-blue-500">
                        <span>↩</span>
                        {needsReplyCount} need{needsReplyCount !== 1 ? '' : 's'}{' '}
                        reply
                    </span>
                )}
                <button
                    type="button"
                    onClick={() => setExpanded((v) => !v)}
                    className="ml-auto flex items-center gap-1 text-[11px] text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 transition-colors"
                >
                    {expanded ? (
                        <>
                            <ChevronUp size={11} />
                            Collapse
                        </>
                    ) : (
                        <>
                            <ChevronDown size={11} />
                            Details
                        </>
                    )}
                </button>
            </div>

            {/* Full attention center — shown when expanded */}
            {expanded && (
                <div className="px-4 pb-4 border-t border-zinc-100 dark:border-zinc-800">
                    <AttentionCenter emails={emails} actions={actions} />
                </div>
            )}
        </div>
    );
}
