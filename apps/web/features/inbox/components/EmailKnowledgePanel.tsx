'use client';

import { apiRouteFetch } from '@/lib/api/client';
import { useEffect, useRef, useState } from 'react';
import { ExternalLink, Loader2, Zap } from 'lucide-react';
import { cn } from '@/lib/utils/utils';
import { EMAIL_CATEGORIES } from '../types/inbox';
import type { EmailAction } from '../types/inbox';
import type { EmailSummary } from '@/app/api/inbox/summarize/route';

// ── Module-level cache so summaries persist across expand/collapse ────────────

const summaryCache = new Map<string, EmailSummary>();

// ── Config ─────────────────────────────────────────────────────────────────────

const EMAIL_TYPE_CONFIG: Record<
    string,
    { icon: string; label: string; bg: string; text: string }
> = {
    meeting: {
        icon: '📅',
        label: 'Meeting',
        bg: 'bg-purple-50 dark:bg-purple-950/20',
        text: 'text-purple-700 dark:text-purple-300',
    },
    task: {
        icon: '✅',
        label: 'Task',
        bg: 'bg-emerald-50 dark:bg-emerald-950/20',
        text: 'text-emerald-700 dark:text-emerald-300',
    },
    deadline: {
        icon: '⏰',
        label: 'Deadline',
        bg: 'bg-red-50 dark:bg-red-950/20',
        text: 'text-red-700 dark:text-red-300',
    },
    document: {
        icon: '📄',
        label: 'Document',
        bg: 'bg-blue-50 dark:bg-blue-950/20',
        text: 'text-blue-700 dark:text-blue-300',
    },
    reminder: {
        icon: '🔔',
        label: 'Reminder',
        bg: 'bg-amber-50 dark:bg-amber-950/20',
        text: 'text-amber-700 dark:text-amber-300',
    },
    followup: {
        icon: '↩',
        label: 'Follow-up',
        bg: 'bg-blue-50 dark:bg-blue-950/20',
        text: 'text-blue-700 dark:text-blue-300',
    },
    finance: {
        icon: '💳',
        label: 'Finance',
        bg: 'bg-amber-50 dark:bg-amber-950/20',
        text: 'text-amber-700 dark:text-amber-300',
    },
    alert: {
        icon: '⚠️',
        label: 'Alert',
        bg: 'bg-red-50 dark:bg-red-950/20',
        text: 'text-red-700 dark:text-red-300',
    },
    verification: {
        icon: '🔒',
        label: 'Verification',
        bg: 'bg-zinc-100 dark:bg-zinc-800',
        text: 'text-zinc-600 dark:text-zinc-400',
    },
    update: {
        icon: '📋',
        label: 'Update',
        bg: 'bg-blue-50 dark:bg-blue-950/20',
        text: 'text-blue-600 dark:text-blue-400',
    },
    newsletter: {
        icon: '📰',
        label: 'Newsletter',
        bg: 'bg-zinc-100 dark:bg-zinc-800',
        text: 'text-zinc-500 dark:text-zinc-400',
    },
    other: {
        icon: '📧',
        label: 'Email',
        bg: 'bg-zinc-100 dark:bg-zinc-800',
        text: 'text-zinc-500 dark:text-zinc-400',
    },
};

const ACTION_ICON: Record<string, string> = {
    action: '✓',
    event: '📅',
    deadline: '⏰',
};
const ACTION_COLOR: Record<string, string> = {
    action: 'text-emerald-600 dark:text-emerald-400',
    event: 'text-purple-600 dark:text-purple-400',
    deadline: 'text-red-600 dark:text-red-400',
};

const CATEGORY_STYLES: Record<string, string> = {
    work: 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300',
    personal:
        'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300',
    finance:
        'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300',
    promotions:
        'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300',
    social: 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300',
    notifications:
        'bg-gray-100 dark:bg-zinc-700/50 text-gray-600 dark:text-zinc-300',
    shopping:
        'bg-pink-100 dark:bg-pink-900/30 text-pink-700 dark:text-pink-300',
    other: 'bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400',
};

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatDue(iso: string | null): string | null {
    if (!iso) return null;
    const d = new Date(iso);
    if (isNaN(d.getTime())) return null;
    const diff = Math.ceil((d.getTime() - Date.now()) / 86_400_000);
    if (diff < 0) return `${Math.abs(diff)}d overdue`;
    if (diff === 0) return 'Today';
    if (diff === 1) return 'Tomorrow';
    if (diff < 7) return d.toLocaleDateString('en-US', { weekday: 'short' });
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function gmailUrl(emailId: string): string | null {
    const match = /^gmail:(.+)$/.exec(emailId);
    return match ? `https://mail.google.com/mail/u/0/#all/${match[1]}` : null;
}

// ── Props ─────────────────────────────────────────────────────────────────────

export interface EmailKnowledgePanelProps {
    emailId: string;
    subject: string;
    sender: string;
    snippet: string;
    category: string;
    isManual: boolean;
    providers: string[];
    body: string | null;
    bodyLoading: boolean;
    bodyOpen: boolean;
    emailActions: EmailAction[];
    extracting: boolean;
    categoryPickerOpen: boolean;
    onReadEmail: () => void;
    onExtract: () => void;
    onConfirmAction: (id: string) => void;
    onConfirmAll: () => void;
    onRejectAction: (id: string) => void;
    onOpenCategoryPicker: () => void;
    onClassify: (cat: string) => void;
}

// ── Component ─────────────────────────────────────────────────────────────────

export function EmailKnowledgePanel({
    emailId,
    subject,
    sender,
    snippet,
    category,
    isManual,
    providers,
    body,
    bodyLoading,
    bodyOpen,
    emailActions,
    extracting,
    categoryPickerOpen,
    onReadEmail,
    onExtract,
    onConfirmAction,
    onConfirmAll,
    onRejectAction,
    onOpenCategoryPicker,
    onClassify,
}: EmailKnowledgePanelProps) {
    const [summary, setSummary] = useState<EmailSummary | null>(
        () => summaryCache.get(emailId) ?? null,
    );
    const [summaryLoading, setSummaryLoading] = useState(false);
    const fetchedWithBody = useRef(false);

    // Initial fetch on panel open — use snippet as fallback when body not loaded yet
    useEffect(() => {
        const cached = summaryCache.get(emailId);
        if (cached) {
            setSummary(cached);
            return;
        }
        const text = body ?? snippet;
        if (!text || text.length < 40) return;

        setSummaryLoading(true);
        void apiRouteFetch('/api/inbox/summarize', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ emailId, subject, body: text, sender }),
        })
            .then((r) => (r.ok ? (r.json() as Promise<EmailSummary>) : null))
            .then((data) => {
                if (data) {
                    summaryCache.set(emailId, data);
                    setSummary(data);
                }
            })
            .catch(() => {})
            .finally(() => setSummaryLoading(false));
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Re-fetch with full body once it loads (only if initial summary used snippet)
    useEffect(() => {
        if (!body || fetchedWithBody.current) return;
        fetchedWithBody.current = true;
        // Only upgrade if we have a cached snippet-only summary or no summary
        const existing = summaryCache.get(emailId);
        if (existing && body.length <= (snippet?.length ?? 0) + 50) return;

        setSummaryLoading(true);
        summaryCache.delete(emailId);
        void apiRouteFetch('/api/inbox/summarize', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ emailId, subject, body, sender }),
        })
            .then((r) => (r.ok ? (r.json() as Promise<EmailSummary>) : null))
            .then((data) => {
                if (data) {
                    summaryCache.set(emailId, data);
                    setSummary(data);
                }
            })
            .catch(() => {})
            .finally(() => setSummaryLoading(false));
    }, [body, emailId, subject, sender, snippet]);

    const typeConfig =
        EMAIL_TYPE_CONFIG[summary?.emailType ?? 'other'] ??
        EMAIL_TYPE_CONFIG['other']!;
    const catStyle = CATEGORY_STYLES[category] ?? CATEGORY_STYLES['other']!;
    const gmailLink = gmailUrl(emailId);
    const pendingActions = emailActions.filter(
        (a) => !a.synced && !a.completed,
    );
    const syncedCount = emailActions.filter((a) => a.synced).length;

    const hasKeyInfo =
        (summary?.keyDates.length ?? 0) > 0 ||
        (summary?.peopleMentioned.length ?? 0) > 0 ||
        (summary?.requiredActions.length ?? 0) > 0;

    return (
        <div className="px-4 pb-4 space-y-3">
            {/* ── AI Summary panel ─────────────────────────────────────────── */}
            {(summaryLoading || summary) && (
                <div className="rounded-xl bg-zinc-50 dark:bg-zinc-800/40 border border-zinc-100 dark:border-zinc-800 p-3 ml-11">
                    {summaryLoading && !summary ? (
                        <div className="flex items-center gap-2">
                            <Loader2
                                size={11}
                                className="text-zinc-400 animate-spin shrink-0"
                            />
                            <span className="text-xs text-zinc-400">
                                Analyzing…
                            </span>
                        </div>
                    ) : summary ? (
                        <div className="space-y-2.5">
                            {/* TL;DR */}
                            <div className="flex items-start gap-2">
                                <Zap
                                    size={11}
                                    className="text-amber-500 shrink-0 mt-0.5"
                                />
                                <p className="text-xs text-gray-700 dark:text-zinc-300 leading-relaxed">
                                    {summary.tldr}
                                </p>
                            </div>

                            {/* Key info grid */}
                            {hasKeyInfo && (
                                <div
                                    className={cn(
                                        'grid gap-3 pt-2 border-t border-zinc-100 dark:border-zinc-700/50',
                                        [
                                            summary.keyDates.length > 0,
                                            summary.peopleMentioned.length > 0,
                                            summary.requiredActions.length > 0,
                                        ].filter(Boolean).length === 1
                                            ? 'grid-cols-1'
                                            : 'grid-cols-3',
                                    )}
                                >
                                    {summary.keyDates.length > 0 && (
                                        <div>
                                            <p className="text-[9px] font-bold uppercase tracking-wider text-zinc-400 mb-1">
                                                Dates
                                            </p>
                                            {summary.keyDates
                                                .slice(0, 3)
                                                .map((d, i) => (
                                                    <p
                                                        key={i}
                                                        className="text-[10px] text-zinc-600 dark:text-zinc-400 leading-snug"
                                                    >
                                                        • {d}
                                                    </p>
                                                ))}
                                        </div>
                                    )}
                                    {summary.peopleMentioned.length > 0 && (
                                        <div>
                                            <p className="text-[9px] font-bold uppercase tracking-wider text-zinc-400 mb-1">
                                                People
                                            </p>
                                            {summary.peopleMentioned
                                                .slice(0, 3)
                                                .map((p, i) => (
                                                    <p
                                                        key={i}
                                                        className="text-[10px] text-zinc-600 dark:text-zinc-400 leading-snug"
                                                    >
                                                        • {p}
                                                    </p>
                                                ))}
                                        </div>
                                    )}
                                    {summary.requiredActions.length > 0 && (
                                        <div>
                                            <p className="text-[9px] font-bold uppercase tracking-wider text-zinc-400 mb-1">
                                                Required
                                            </p>
                                            {summary.requiredActions
                                                .slice(0, 3)
                                                .map((a, i) => (
                                                    <p
                                                        key={i}
                                                        className="text-[10px] text-zinc-600 dark:text-zinc-400 leading-snug"
                                                    >
                                                        • {a}
                                                    </p>
                                                ))}
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    ) : null}
                </div>
            )}

            {/* ── Badges ───────────────────────────────────────────────────── */}
            <div className="flex items-center gap-2 flex-wrap ml-11">
                {summary && (
                    <span
                        className={cn(
                            'text-[10px] font-bold px-2 py-0.5 rounded-md flex items-center gap-1',
                            typeConfig.bg,
                            typeConfig.text,
                        )}
                    >
                        <span>{typeConfig.icon}</span>
                        <span>{typeConfig.label}</span>
                    </span>
                )}
                <button
                    type="button"
                    onClick={onOpenCategoryPicker}
                    className={cn(
                        'text-[10px] uppercase font-bold px-2 py-0.5 rounded-md hover:opacity-80 transition-opacity',
                        catStyle,
                    )}
                >
                    {category}
                    {isManual && ' ✎'}
                </button>
                {providers.length > 1 && (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-purple-50 dark:bg-purple-950/30 text-purple-600 dark:text-purple-300">
                        Gmail + Outlook
                    </span>
                )}
                <span className="ml-auto text-[9px] tabular-nums text-zinc-400 dark:text-zinc-600">
                    {emailActions.length > 0
                        ? `${syncedCount}/${emailActions.length} synced`
                        : 'No actions yet'}
                </span>
            </div>

            {/* ── Category picker ───────────────────────────────────────────── */}
            {categoryPickerOpen && (
                <div className="flex flex-wrap gap-1.5 ml-11 pt-2 border-t border-gray-100 dark:border-zinc-800">
                    {EMAIL_CATEGORIES.map((cat) => {
                        const style =
                            CATEGORY_STYLES[cat] ?? CATEGORY_STYLES['other']!;
                        return (
                            <button
                                key={cat}
                                onClick={() => onClassify(cat)}
                                className={cn(
                                    'text-[10px] px-2.5 py-1 rounded-lg font-semibold border transition-all',
                                    category === cat
                                        ? cn(style, 'border-current')
                                        : 'bg-gray-50 dark:bg-zinc-800 text-gray-500 dark:text-zinc-400 border-transparent hover:border-gray-300 dark:hover:border-zinc-600',
                                )}
                            >
                                {cat}
                            </button>
                        );
                    })}
                </div>
            )}

            {/* ── Extracted actions ─────────────────────────────────────────── */}
            {emailActions.length > 0 && (
                <div className="ml-11 space-y-1.5">
                    <p className="text-[9px] font-bold uppercase tracking-wider text-zinc-400 dark:text-zinc-600">
                        Extracted Actions
                    </p>
                    {emailActions.map((a) => {
                        const due = formatDue(a.due_date);
                        const isOverdue =
                            !!a.due_date && new Date(a.due_date) < new Date();
                        return (
                            <div
                                key={a.id}
                                className="flex items-start gap-2 text-xs"
                            >
                                <span
                                    className={cn(
                                        'shrink-0 mt-0.5 text-sm leading-none',
                                        ACTION_COLOR[a.type] ?? 'text-gray-400',
                                    )}
                                >
                                    {ACTION_ICON[a.type] ?? '·'}
                                </span>
                                <div className="flex-1 min-w-0">
                                    <span className="font-medium text-gray-800 dark:text-zinc-200">
                                        {a.title}
                                    </span>
                                    {a.description && (
                                        <span className="text-gray-400 dark:text-zinc-500 ml-1">
                                            {a.description}
                                        </span>
                                    )}
                                    {due && (
                                        <span
                                            className={cn(
                                                'ml-2 text-[10px] font-medium',
                                                isOverdue
                                                    ? 'text-red-500'
                                                    : 'text-gray-400 dark:text-zinc-500',
                                            )}
                                        >
                                            {due}
                                        </span>
                                    )}
                                    {a.action_url && (
                                        <a
                                            href={a.action_url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="ml-2 inline-flex items-center gap-0.5 text-[10px] text-blue-500 hover:underline"
                                        >
                                            Link <ExternalLink size={9} />
                                        </a>
                                    )}
                                </div>
                                <div className="flex items-center gap-1 shrink-0">
                                    {a.synced ? (
                                        <span className="text-[10px] text-emerald-500">
                                            ✓ synced
                                        </span>
                                    ) : (
                                        <>
                                            <button
                                                onClick={() =>
                                                    onConfirmAction(a.id)
                                                }
                                                className="w-6 h-6 flex items-center justify-center rounded-md bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 hover:bg-green-100 transition-colors text-[11px] font-bold"
                                                title="Confirm: add to To-Do / Calendar"
                                            >
                                                ✓
                                            </button>
                                            <button
                                                onClick={() =>
                                                    onRejectAction(a.id)
                                                }
                                                className="w-6 h-6 flex items-center justify-center rounded-md bg-gray-50 dark:bg-zinc-800 text-gray-400 hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-500 transition-colors text-[11px]"
                                                title="Dismiss"
                                            >
                                                ✕
                                            </button>
                                        </>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                    {pendingActions.length > 1 && (
                        <button
                            onClick={onConfirmAll}
                            className="text-[11px] font-semibold px-3 py-1.5 rounded-lg bg-green-600 text-white hover:bg-green-700 transition-colors"
                        >
                            Confirm all ({pendingActions.length}) → Add to To-Do
                            / Calendar
                        </button>
                    )}
                </div>
            )}

            {/* ── Raw email body ────────────────────────────────────────────── */}
            {bodyOpen && (
                <div className="ml-11">
                    <div className="p-3 bg-gray-50 dark:bg-zinc-800 rounded-xl text-xs text-gray-700 dark:text-zinc-300 whitespace-pre-wrap max-h-56 overflow-y-auto leading-relaxed">
                        {bodyLoading ? (
                            <span className="text-gray-400 italic">
                                Loading…
                            </span>
                        ) : body ? (
                            body
                        ) : (
                            <span className="text-gray-400 italic">
                                Could not load email body.
                            </span>
                        )}
                    </div>
                </div>
            )}

            {/* ── Action toolbar ────────────────────────────────────────────── */}
            <div className="ml-11 flex items-center gap-3 flex-wrap pt-1 border-t border-gray-50 dark:border-zinc-800/50">
                <button
                    onClick={onReadEmail}
                    className="text-[11px] font-medium text-gray-400 dark:text-zinc-500 hover:text-gray-600 dark:hover:text-zinc-300 transition-colors"
                >
                    {bodyOpen ? 'Hide body' : 'Read email'}
                </button>
                <button
                    onClick={onExtract}
                    disabled={extracting}
                    className="text-[11px] font-semibold text-blue-500 dark:text-blue-400 hover:text-blue-700 disabled:opacity-50 disabled:cursor-wait transition-colors flex items-center gap-1"
                >
                    <Zap size={9} />
                    {extracting
                        ? 'Extracting…'
                        : emailActions.length > 0
                          ? 'Re-extract'
                          : 'Extract actions'}
                </button>
                {gmailLink && (
                    <a
                        href={gmailLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[11px] font-medium text-gray-400 dark:text-zinc-500 hover:text-gray-600 dark:hover:text-zinc-300 transition-colors flex items-center gap-0.5"
                    >
                        Open Gmail <ExternalLink size={9} />
                    </a>
                )}
            </div>
        </div>
    );
}
