'use client';

import { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { EmailAction, EmailCardProps } from '@/features/inbox/types/inbox';
import { cn } from '@/lib/utils/utils';
import { useEmailCard } from '@/features/inbox/hooks/useEmailCard';
import { useCategoryColors } from '@/features/inbox/hooks/useCategoryColors';
import { EmailKnowledgePanel } from './EmailKnowledgePanel';

// ── Constants ─────────────────────────────────────────────────────────────────

const CATEGORY_STYLES: Record<string, { badge: string; dot: string }> = {
    work: {
        badge: 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300',
        dot: 'bg-blue-400',
    },
    personal: {
        badge: 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300',
        dot: 'bg-green-400',
    },
    finance: {
        badge: 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300',
        dot: 'bg-amber-400',
    },
    promotions: {
        badge: 'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300',
        dot: 'bg-orange-400',
    },
    social: {
        badge: 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300',
        dot: 'bg-purple-400',
    },
    notifications: {
        badge: 'bg-gray-100 dark:bg-zinc-700/50 text-gray-600 dark:text-zinc-300',
        dot: 'bg-gray-400',
    },
    shopping: {
        badge: 'bg-pink-100 dark:bg-pink-900/30 text-pink-700 dark:text-pink-300',
        dot: 'bg-pink-400',
    },
    other: {
        badge: 'bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400',
        dot: 'bg-zinc-400',
    },
};

// ── Sidetab — reads color from useCategoryColors (shared with sidebar picker) ─

function CategorySidetab({ category }: { category: string }) {
    const { getColor } = useCategoryColors();
    return (
        <div className={cn('w-2 self-stretch shrink-0', getColor(category))} />
    );
}

// High-priority categories
const HIGH_PRIORITY = new Set(['work', 'finance']);
const LOW_PRIORITY = new Set(['promotions', 'notifications', 'shopping']);

function getPriority(category: string): 'high' | 'normal' | 'low' {
    if (HIGH_PRIORITY.has(category)) return 'high';
    if (LOW_PRIORITY.has(category)) return 'low';
    return 'normal';
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function senderInitial(sender: string): string {
    const name = (sender.split('<')[0] ?? sender).trim();
    return (name[0] ?? '?').toUpperCase();
}

function senderName(sender: string): string {
    return (sender.split('<')[0] ?? sender).trim();
}

function senderDomain(sender: string): string {
    const match = sender.match(/@([^>]+)/);
    return match?.[1] ?? '';
}

function formatRelativeTime(dateStr: string): string {
    let date = new Date(dateStr);
    // ISO 8601 with +HH:MM offset sometimes parses wrong in older envs — normalise to Z
    if (isNaN(date.getTime())) {
        date = new Date(
            dateStr.replace(/([+-]\d{2}):(\d{2})$/, (_, h, m) => {
                const total =
                    (Number(h.replace('+', '')) * 60 + Number(m)) *
                    (h.startsWith('-') ? -1 : 1);
                return total === 0 ? 'Z' : dateStr;
            }),
        );
    }
    if (isNaN(date.getTime())) return dateStr;
    const diff = Date.now() - date.getTime();
    if (diff < 0)
        return date.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
        });
    const minutes = Math.floor(diff / 60_000);
    const hours = Math.floor(diff / 3_600_000);
    const days = Math.floor(diff / 86_400_000);
    if (diff < 60_000) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days === 1) return 'Yesterday';
    if (days < 7) return date.toLocaleDateString('en-US', { weekday: 'short' });
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

// Decode HTML entities from Gmail/Outlook snippets (e.g. &#39; → ', &amp; → &)
function decodeHtml(text: string): string {
    if (typeof document === 'undefined') return text;
    const el = document.createElement('textarea');
    el.innerHTML = text;
    return el.value;
}

// When the email has no meaningful subject, derive one from the snippet
function displaySubject(subject: string, snippet: string): string {
    const s = subject?.trim();
    if (s && s !== '(no subject)' && s.length > 2) return s;
    const decoded = decodeHtml(snippet ?? '')
        .trim()
        .replace(/^["'“]/, '');
    if (decoded.length > 3) return decoded.slice(0, 72);
    return '(no subject)';
}

// Deterministic color from string (for sender avatar)
const AVATAR_COLORS = [
    'bg-violet-500',
    'bg-blue-500',
    'bg-emerald-500',
    'bg-rose-500',
    'bg-amber-500',
    'bg-cyan-500',
    'bg-fuchsia-500',
    'bg-teal-500',
];

function avatarColor(str: string): string {
    let h = 0;
    for (let i = 0; i < str.length; i++) h = (h * 31 + str.charCodeAt(i)) >>> 0;
    return AVATAR_COLORS[h % AVATAR_COLORS.length] ?? 'bg-zinc-500';
}

// ── Main component ────────────────────────────────────────────────────────────

export function EmailCard({
    mail,
    emailActions = [],
    extracting,
    onClassify,
    onExtract,
    onConfirmAction,
    onConfirmAll,
    onRejectAction,
}: EmailCardProps & {
    emailActions?: EmailAction[];
    extracting?: boolean;
    onExtract: () => void;
    onConfirmAction: (id: string) => void;
    onConfirmAll: () => void;
    onRejectAction: (id: string) => void;
}) {
    const { open, setOpen, bodyOpen, body, bodyLoading, handleReadEmail } =
        useEmailCard(emailActions, extracting);

    const [expanded, setExpanded] = useState(false);

    const category = mail.category ?? 'other';
    const categoryStyle =
        CATEGORY_STYLES[category] ?? CATEGORY_STYLES['other']!;
    const priority = getPriority(category);
    const initial = senderInitial(mail.sender);
    const name = senderName(mail.sender);
    const domain = senderDomain(mail.sender);
    const color = avatarColor(domain || name);

    const unsyncedActions = emailActions.filter(
        (a) => !a.synced && !a.completed,
    );

    const subject = displaySubject(mail.subject, mail.snippet);
    // Short label for multi-account disambiguation (part before @)
    const accountLabel = mail.account_email
        ? (mail.account_email.split('@')[0] ?? mail.account_email)
        : null;

    return (
        <div
            className={cn(
                'group flex items-stretch',
                priority === 'low' && 'opacity-75',
            )}
        >
            {/* Colored sidetab */}
            <CategorySidetab category={category} />

            {/* Card body */}
            <div className="flex-1 min-w-0">
                {/* Dense row — always visible */}
                <div
                    role="button"
                    tabIndex={0}
                    className="flex items-center gap-2.5 px-3 py-2 cursor-pointer hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors"
                    onClick={() => setExpanded((v) => !v)}
                    onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ')
                            setExpanded((v) => !v);
                    }}
                >
                    {/* Avatar */}
                    <div
                        className={cn(
                            'shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-white text-[10px] font-bold',
                            color,
                        )}
                    >
                        {initial}
                    </div>

                    <div className="flex-1 min-w-0">
                        {/* Row 1: sender + account badge + time */}
                        <div className="flex items-center justify-between gap-2">
                            <div className="flex items-center gap-1.5 min-w-0">
                                <span className="text-xs font-semibold text-zinc-800 dark:text-zinc-100 truncate">
                                    {name}
                                </span>
                                {accountLabel && (
                                    <span className="text-[9px] px-1 py-0.5 rounded border border-zinc-200 dark:border-zinc-700 text-zinc-400 dark:text-zinc-600 shrink-0 font-mono">
                                        {accountLabel}
                                    </span>
                                )}
                            </div>
                            <div className="flex items-center gap-1 shrink-0">
                                <span className="text-[10px] text-zinc-400 dark:text-zinc-500">
                                    {formatRelativeTime(mail.date)}
                                </span>
                                {expanded ? (
                                    <ChevronUp
                                        size={11}
                                        className="text-zinc-400"
                                    />
                                ) : (
                                    <ChevronDown
                                        size={11}
                                        className="text-zinc-400"
                                    />
                                )}
                            </div>
                        </div>

                        {/* Row 2: subject · snippet + badges */}
                        {!expanded && (
                            <div className="flex items-center gap-1.5 mt-0.5">
                                <p className="text-xs text-zinc-500 dark:text-zinc-400 truncate flex-1">
                                    <span className="font-medium text-zinc-700 dark:text-zinc-300">
                                        {subject}
                                    </span>
                                    {mail.snippet && (
                                        <span className="text-zinc-400 dark:text-zinc-500">
                                            {' '}
                                            {decodeHtml(mail.snippet)}
                                        </span>
                                    )}
                                </p>
                                <div className="flex items-center gap-1 shrink-0">
                                    {unsyncedActions.some(
                                        (a) => a.type === 'action',
                                    ) && (
                                        <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400">
                                            Task
                                        </span>
                                    )}
                                    {unsyncedActions.some(
                                        (a) => a.type === 'deadline',
                                    ) && (
                                        <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400">
                                            Due
                                        </span>
                                    )}
                                    {unsyncedActions.some(
                                        (a) => a.type === 'event',
                                    ) && (
                                        <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400">
                                            Event
                                        </span>
                                    )}
                                    {unsyncedActions.length === 0 &&
                                        category !== 'other' && (
                                            <span
                                                className={cn(
                                                    'text-[9px] font-bold px-1.5 py-0.5 rounded',
                                                    categoryStyle.badge,
                                                )}
                                            >
                                                {category}
                                            </span>
                                        )}
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Knowledge panel — fires AI summary on expand */}
                {expanded && (
                    <EmailKnowledgePanel
                        emailId={mail.id}
                        subject={mail.subject}
                        sender={mail.sender}
                        snippet={mail.snippet}
                        category={category}
                        isManual={mail.is_manual ?? false}
                        providers={mail.providers ?? []}
                        body={body}
                        bodyLoading={bodyLoading}
                        bodyOpen={bodyOpen}
                        emailActions={emailActions}
                        extracting={extracting ?? false}
                        categoryPickerOpen={open}
                        onReadEmail={() => void handleReadEmail(mail.id)}
                        onExtract={onExtract}
                        onConfirmAction={onConfirmAction}
                        onConfirmAll={onConfirmAll}
                        onRejectAction={onRejectAction}
                        onOpenCategoryPicker={() => setOpen((v) => !v)}
                        onClassify={(cat) => {
                            void onClassify(
                                mail.id,
                                cat,
                                mail.sender,
                                mail.subject,
                            );
                            setOpen(false);
                        }}
                    />
                )}
            </div>
        </div>
    );
}
