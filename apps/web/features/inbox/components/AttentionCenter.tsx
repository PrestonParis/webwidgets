'use client';

import { useMemo } from 'react';
import type { Email, EmailAction } from '../types/inbox';

// ── Helpers ───────────────────────────────────────────────────────────────────

function senderName(sender: string) {
    return (sender.split('<')[0] ?? sender).trim();
}

function formatDue(
    iso: string | null,
): { label: string; urgent: boolean } | null {
    if (!iso) return null;
    const d = new Date(iso);
    if (isNaN(d.getTime())) return null;
    const diff = Math.ceil((d.getTime() - Date.now()) / 86_400_000);
    if (diff < 0) return { label: `${Math.abs(diff)}d overdue`, urgent: true };
    if (diff === 0) return { label: 'Today', urgent: true };
    if (diff === 1) return { label: 'Tomorrow', urgent: false };
    if (diff < 7)
        return {
            label: d.toLocaleDateString('en-US', { weekday: 'long' }),
            urgent: false,
        };
    return {
        label: d.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
        }),
        urgent: false,
    };
}

function truncate(s: string, n: number) {
    return s.length > n ? s.slice(0, n) + '…' : s;
}

const ALERT_RE =
    /security|alert|urgent|verify|password|breach|suspicious|fraud|warning|compromised/i;

// ── Types ─────────────────────────────────────────────────────────────────────

interface AttentionItem {
    key: string;
    title: string;
    source: string | null;
    due: { label: string; urgent: boolean } | null;
    isOverdue?: boolean;
}

interface Section {
    id: string;
    label: string;
    icon: string;
    accent: string;
    items: AttentionItem[];
}

// ── Item row ──────────────────────────────────────────────────────────────────

function ItemRow({ item }: { item: AttentionItem }) {
    return (
        <li className="flex items-start gap-1.5 min-w-0 py-0.5">
            <span className="text-gray-300 dark:text-zinc-600 mt-0.5 shrink-0 leading-none">
                •
            </span>
            <div className="min-w-0 flex-1">
                <p
                    className={`text-xs leading-snug truncate ${
                        item.isOverdue
                            ? 'text-red-600 dark:text-red-400 font-medium'
                            : 'text-gray-700 dark:text-zinc-300'
                    }`}
                >
                    {item.title}
                </p>
                <div className="flex items-center gap-1.5 flex-wrap">
                    {item.source && (
                        <span className="text-[10px] text-gray-400 dark:text-zinc-500 truncate">
                            {item.source}
                        </span>
                    )}
                    {item.due && (
                        <span
                            className={`text-[10px] font-medium shrink-0 ${
                                item.due.urgent
                                    ? 'text-red-500 dark:text-red-400'
                                    : 'text-gray-400 dark:text-zinc-500'
                            }`}
                        >
                            {item.due.label}
                        </span>
                    )}
                </div>
            </div>
        </li>
    );
}

// ── Main component ────────────────────────────────────────────────────────────

export function AttentionCenter({
    emails,
    actions,
}: {
    emails: Email[];
    actions: EmailAction[];
}) {
    const sections = useMemo<Section[]>(() => {
        const emailById = new Map(emails.map((e) => [e.id, e]));
        const result: Section[] = [];

        // ── Urgent ────────────────────────────────────────────────────────────
        const urgentItems: AttentionItem[] = [];

        // Overdue + today deadlines/events from actions
        for (const a of actions) {
            if (a.completed || !a.due_date) continue;
            if (a.type !== 'deadline' && a.type !== 'event') continue;
            const d = new Date(a.due_date);
            const days = (d.getTime() - Date.now()) / 86_400_000;
            if (days >= 1) continue;
            const source = emailById.get(a.email_id);
            urgentItems.push({
                key: a.id,
                title: a.title,
                source: source ? senderName(source.sender) : null,
                due: formatDue(a.due_date),
                isOverdue: days < 0,
            });
        }

        // Security / alert emails
        for (const e of emails) {
            if (ALERT_RE.test(e.subject)) {
                urgentItems.push({
                    key: `alert-${e.id}`,
                    title: truncate(e.subject, 52),
                    source: senderName(e.sender),
                    due: null,
                    isOverdue: false,
                });
            }
        }

        if (urgentItems.length > 0) {
            result.push({
                id: 'urgent',
                label: 'Urgent',
                icon: '🔴',
                accent: 'text-red-500',
                items: urgentItems.slice(0, 5),
            });
        }

        // ── Upcoming (1–7 days) ───────────────────────────────────────────────
        const upcomingItems: AttentionItem[] = actions
            .filter((a) => {
                if (a.completed || !a.due_date) return false;
                if (a.type !== 'deadline' && a.type !== 'event') return false;
                const days =
                    (new Date(a.due_date).getTime() - Date.now()) / 86_400_000;
                return days >= 1 && days < 7;
            })
            .sort(
                (a, b) =>
                    new Date(a.due_date!).getTime() -
                    new Date(b.due_date!).getTime(),
            )
            .slice(0, 5)
            .map((a) => {
                const source = emailById.get(a.email_id);
                return {
                    key: a.id,
                    title: a.title,
                    source: source ? senderName(source.sender) : null,
                    due: formatDue(a.due_date),
                };
            });

        if (upcomingItems.length > 0) {
            result.push({
                id: 'upcoming',
                label: 'Upcoming',
                icon: '📆',
                accent: 'text-blue-500',
                items: upcomingItems,
            });
        }

        // ── Awaiting Response ────────────────────────────────────────────────
        const awaitingItems: AttentionItem[] = emails
            .filter((e) => e.category === 'work' || e.category === 'personal')
            .slice(0, 4)
            .map((e) => ({
                key: e.id,
                title: senderName(e.sender),
                source: truncate(e.subject, 48),
                due: null,
            }));

        if (awaitingItems.length > 0) {
            result.push({
                id: 'awaiting',
                label: 'Awaiting Response',
                icon: '↩',
                accent: 'text-blue-500',
                items: awaitingItems,
            });
        }

        // ── Finance ───────────────────────────────────────────────────────────
        const financeItems: AttentionItem[] = emails
            .filter((e) => e.category === 'finance')
            .slice(0, 4)
            .map((e) => ({
                key: e.id,
                title: truncate(e.subject, 48),
                source: senderName(e.sender),
                due: null,
            }));

        if (financeItems.length > 0) {
            result.push({
                id: 'finance',
                label: 'Finance',
                icon: '💳',
                accent: 'text-amber-500',
                items: financeItems,
            });
        }

        return result;
    }, [emails, actions]);

    if (sections.length === 0) return null;

    return (
        <div className="rounded-xl border border-gray-100 dark:border-zinc-800 bg-white dark:bg-zinc-900 overflow-hidden">
            <div className="px-4 py-2.5 border-b border-gray-50 dark:border-zinc-800/60">
                <h3 className="text-[10px] font-bold uppercase tracking-wider text-gray-400 dark:text-zinc-500">
                    Attention Center
                </h3>
            </div>
            <div className="p-4">
                <div
                    className={`grid gap-5 ${
                        sections.length === 1
                            ? 'grid-cols-1'
                            : sections.length === 2
                              ? 'grid-cols-2'
                              : sections.length === 3
                                ? 'grid-cols-3'
                                : 'grid-cols-2 xl:grid-cols-4'
                    }`}
                >
                    {sections.map((section) => (
                        <div key={section.id}>
                            <p
                                className={`text-[10px] font-bold uppercase tracking-wider mb-2 flex items-center gap-1.5 ${section.accent}`}
                            >
                                <span>{section.icon}</span>
                                {section.label}
                            </p>
                            <ul className="space-y-0.5">
                                {section.items.map((item) => (
                                    <ItemRow key={item.key} item={item} />
                                ))}
                            </ul>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
