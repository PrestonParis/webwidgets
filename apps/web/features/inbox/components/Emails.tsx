'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { ArrowLeft, ChevronDown, RefreshCw, Users, Zap } from 'lucide-react';
import { computePriorityScore } from '@/features/inbox/lib/priorityScore';
import { useEmails } from '@/features/inbox/hooks/useEmails';
import { useEmailActions } from '@/features/inbox/hooks/useEmailActions';
import { useEmailConnection } from '@/features/inbox/hooks/useEmailConnection';
import {
    useCategoryColors,
    COLOR_PALETTE,
} from '@/features/inbox/hooks/useCategoryColors';
import { EmailList } from './EmailList';
import { IntelligenceStrip } from './IntelligenceStrip';
import { EmailUnauthorized } from './EmailUnauthorized';
import { EmailConnectPrompt } from './EmailConnectPrompt';
import { EmailActionsPanel } from './EmailActionsPanel';
import { EmailActionLog } from './EmailActionLog';
import { InboxRightRail } from './InboxRightRail';
import type { Email, EmailAction } from '@/features/inbox/types/inbox';
import { EMAIL_CATEGORIES } from '@/features/inbox/types/inbox';

// ── Filter keys ───────────────────────────────────────────────────────────────

const FILTER_ATTENTION = 'attention';
const FILTER_NEEDS_REPLY = 'needs_reply';
const FILTER_TASKS = 'tasks';
const FILTER_DEADLINES = 'deadlines';
const FILTER_MEETINGS = 'meetings';
const FILTER_SECURITY = '__security__';
const FILTER_DEVELOPMENT = '__development__';

type InboxFilter = string | null;

const DEV_DOMAINS =
    /github\.com|vercel\.com|npmjs\.com|gitlab\.com|heroku\.com|netlify\.com|render\.com|railway\.app|supabase\.io|cloudflare\.com|aws\.amazon\.com|linear\.app/i;
const ALERT_RE =
    /security|alert|urgent|verify|password|breach|suspicious|fraud|warning|compromised/i;

// ── Helpers ───────────────────────────────────────────────────────────────────

function mergeProviders(
    emails: Email[],
    gmailEmails: Email[],
    outlookEmails: Email[],
    view: 'gmail' | 'outlook' | 'all',
) {
    if (view === 'gmail') return gmailEmails;
    if (view === 'outlook') return outlookEmails;
    return emails;
}

// ── Accounts Dropdown ─────────────────────────────────────────────────────────

function AccountsDropdown() {
    const [open, setOpen] = useState(false);
    const ref = useRef<HTMLDivElement>(null);
    const { googleAccounts, microsoftAccounts, connectGmail, connectOutlook } =
        useEmailConnection();

    useEffect(() => {
        function handleClick(e: MouseEvent) {
            if (ref.current && !ref.current.contains(e.target as Node)) {
                setOpen(false);
            }
        }
        if (open) document.addEventListener('mousedown', handleClick);
        return () => document.removeEventListener('mousedown', handleClick);
    }, [open]);

    const total = googleAccounts.length + microsoftAccounts.length;

    return (
        <div ref={ref} className="relative">
            <button
                type="button"
                onClick={() => setOpen((v) => !v)}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium border border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors"
            >
                <Users size={12} />
                {total > 0
                    ? `${total} Account${total !== 1 ? 's' : ''}`
                    : 'Connect'}
                <ChevronDown
                    size={10}
                    className={`transition-transform ${open ? 'rotate-180' : ''}`}
                />
            </button>
            {open && (
                <div className="absolute right-0 top-full mt-1.5 w-56 bg-white dark:bg-zinc-900 rounded-xl border border-zinc-100 dark:border-zinc-800 shadow-lg p-2 space-y-0.5 z-50">
                    {(googleAccounts.length > 0 ||
                        microsoftAccounts.length > 0) && (
                        <div className="px-2 py-1 mb-1">
                            <p className="text-[9px] font-bold uppercase tracking-wider text-zinc-400 mb-1.5">
                                Connected
                            </p>
                            {googleAccounts.map((a) => (
                                <div
                                    key={a.id}
                                    className="flex items-center gap-2 py-0.5 text-xs text-zinc-600 dark:text-zinc-400"
                                >
                                    <span className="w-2 h-2 rounded-full bg-red-400 shrink-0" />
                                    <span className="truncate">{a.email}</span>
                                </div>
                            ))}
                            {microsoftAccounts.map((a) => (
                                <div
                                    key={a.id}
                                    className="flex items-center gap-2 py-0.5 text-xs text-zinc-600 dark:text-zinc-400"
                                >
                                    <span className="w-2 h-2 rounded-full bg-blue-500 shrink-0" />
                                    <span className="truncate">{a.email}</span>
                                </div>
                            ))}
                        </div>
                    )}
                    <div className="border-t border-zinc-100 dark:border-zinc-800 pt-1.5">
                        <button
                            onClick={() => {
                                connectGmail();
                                setOpen(false);
                            }}
                            className="w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg text-xs text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors"
                        >
                            <span className="w-2 h-2 rounded-full bg-red-400 shrink-0" />
                            {googleAccounts.length > 0
                                ? 'Add Gmail account'
                                : 'Connect Gmail'}
                        </button>
                        <button
                            onClick={() => {
                                connectOutlook();
                                setOpen(false);
                            }}
                            className="w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg text-xs text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors"
                        >
                            <span className="w-2 h-2 rounded-full bg-blue-500 shrink-0" />
                            {microsoftAccounts.length > 0
                                ? 'Add Outlook account'
                                : 'Connect Outlook'}
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}

// ── Filter sidebar ────────────────────────────────────────────────────────────

const CATEGORY_ICONS: Record<string, string> = {
    work: '💼',
    personal: '👤',
    finance: '💳',
    promotions: '🏷️',
    social: '💬',
    notifications: '🔔',
    shopping: '🛒',
    other: '📁',
};

function FilterSidebar({
    emails,
    actions,
    active,
    onSelect,
    colors,
    onSetColor,
}: {
    emails: Email[];
    actions: EmailAction[];
    active: InboxFilter;
    onSelect: (f: InboxFilter) => void;
    colors: Record<string, string>;
    onSetColor: (category: string, color: string) => void;
}) {
    const [pickerOpen, setPickerOpen] = useState<string | null>(null);
    const pickerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!pickerOpen) return;
        function handleClick(e: MouseEvent) {
            if (
                pickerRef.current &&
                !pickerRef.current.contains(e.target as Node)
            ) {
                setPickerOpen(null);
            }
        }
        document.addEventListener('mousedown', handleClick);
        return () => document.removeEventListener('mousedown', handleClick);
    }, [pickerOpen]);

    const counts = useMemo(() => {
        const cat: Record<string, number> = {};
        for (const e of emails) {
            const c = e.category ?? 'other';
            cat[c] = (cat[c] ?? 0) + 1;
        }
        const attention = emails.filter(
            (e) => e.category === 'work' || e.category === 'finance',
        ).length;
        const needsReply = emails.filter(
            (e) => e.category === 'work' || e.category === 'personal',
        ).length;
        const tasks = actions.filter(
            (a) => a.type === 'action' && !a.completed,
        ).length;
        const deadlines = actions.filter(
            (a) => a.type === 'deadline' && !a.completed,
        ).length;
        const meetings = actions.filter(
            (a) => a.type === 'event' && !a.completed,
        ).length;
        const security = emails.filter((e) => ALERT_RE.test(e.subject)).length;
        const development = emails.filter((e) =>
            DEV_DOMAINS.test(e.sender),
        ).length;
        return {
            cat,
            attention,
            needsReply,
            tasks,
            deadlines,
            meetings,
            security,
            development,
        };
    }, [emails, actions]);

    function Btn({
        label,
        count,
        filterKey,
        icon,
    }: {
        label: string;
        count: number;
        filterKey: InboxFilter;
        icon?: string | undefined;
    }) {
        const isActive = active === filterKey;
        return (
            <button
                type="button"
                onClick={() => onSelect(isActive ? null : filterKey)}
                className={`w-full flex items-center justify-between px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                    isActive
                        ? 'bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-950'
                        : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800'
                }`}
            >
                <span className="flex items-center gap-1.5 truncate">
                    {icon && <span className="shrink-0">{icon}</span>}
                    <span className="truncate">{label}</span>
                </span>
                {count > 0 && (
                    <span className="tabular-nums ml-1 shrink-0">{count}</span>
                )}
            </button>
        );
    }

    return (
        <nav className="py-3 space-y-0.5 px-2">
            <Btn
                label="All Mail"
                count={emails.length}
                filterKey={null}
                icon="📬"
            />

            {(counts.attention > 0 ||
                counts.tasks > 0 ||
                counts.deadlines > 0 ||
                counts.meetings > 0) && (
                <>
                    <p className="text-[9px] font-bold uppercase tracking-widest text-zinc-400 dark:text-zinc-600 px-2 pt-3 pb-1">
                        Smart
                    </p>
                    {counts.needsReply > 0 && (
                        <Btn
                            label="Needs Reply"
                            count={counts.needsReply}
                            filterKey={FILTER_NEEDS_REPLY}
                            icon="↩"
                        />
                    )}
                    {counts.tasks > 0 && (
                        <Btn
                            label="Tasks"
                            count={counts.tasks}
                            filterKey={FILTER_TASKS}
                            icon="✓"
                        />
                    )}
                    {counts.deadlines > 0 && (
                        <Btn
                            label="Deadlines"
                            count={counts.deadlines}
                            filterKey={FILTER_DEADLINES}
                            icon="⏰"
                        />
                    )}
                    {counts.meetings > 0 && (
                        <Btn
                            label="Meetings"
                            count={counts.meetings}
                            filterKey={FILTER_MEETINGS}
                            icon="📅"
                        />
                    )}
                    {counts.security > 0 && (
                        <Btn
                            label="Security"
                            count={counts.security}
                            filterKey={FILTER_SECURITY}
                            icon="🔒"
                        />
                    )}
                    {counts.development > 0 && (
                        <Btn
                            label="Development"
                            count={counts.development}
                            filterKey={FILTER_DEVELOPMENT}
                            icon="⚙️"
                        />
                    )}
                </>
            )}

            <p className="text-[9px] font-bold uppercase tracking-widest text-zinc-400 dark:text-zinc-600 px-2 pt-3 pb-1">
                Categories
            </p>
            {EMAIL_CATEGORIES.filter((c) => (counts.cat[c] ?? 0) > 0).map(
                (cat) => {
                    const isActive = active === cat;
                    const currentColor = colors[cat] ?? 'bg-zinc-400';
                    return (
                        <div key={cat} className="relative">
                            <div
                                className={`flex items-center rounded-lg transition-colors ${
                                    isActive
                                        ? 'bg-zinc-900 dark:bg-zinc-100'
                                        : 'hover:bg-zinc-100 dark:hover:bg-zinc-800'
                                }`}
                            >
                                {/* Filter button — takes up all space except the swatch */}
                                <button
                                    type="button"
                                    onClick={() =>
                                        onSelect(isActive ? null : cat)
                                    }
                                    className={`flex-1 flex items-center justify-between pl-3 pr-1.5 py-1.5 text-xs font-medium min-w-0 ${
                                        isActive
                                            ? 'text-white dark:text-zinc-950'
                                            : 'text-zinc-600 dark:text-zinc-400'
                                    }`}
                                >
                                    <span className="flex items-center gap-1.5 truncate">
                                        <span className="shrink-0">
                                            {CATEGORY_ICONS[cat]}
                                        </span>
                                        <span className="truncate">
                                            {cat.charAt(0).toUpperCase() +
                                                cat.slice(1)}
                                        </span>
                                    </span>
                                    {(counts.cat[cat] ?? 0) > 0 && (
                                        <span className="tabular-nums ml-1 shrink-0">
                                            {counts.cat[cat]}
                                        </span>
                                    )}
                                </button>

                                {/* Color swatch — opens picker */}
                                <button
                                    type="button"
                                    title="Change color"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setPickerOpen(
                                            pickerOpen === cat ? null : cat,
                                        );
                                    }}
                                    className="shrink-0 p-1.5 mr-1 rounded"
                                >
                                    <span
                                        className={`block w-2.5 h-2.5 rounded-full ${currentColor} ring-1 ring-white/20 ring-offset-1 ring-offset-transparent`}
                                    />
                                </button>
                            </div>

                            {/* Color picker popover */}
                            {pickerOpen === cat && (
                                <div
                                    ref={pickerRef}
                                    className="absolute left-2 top-full mt-1 z-50 bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-700 shadow-lg p-2.5"
                                >
                                    <p className="text-[9px] font-bold uppercase tracking-wider text-zinc-400 mb-2 px-0.5">
                                        {cat} color
                                    </p>
                                    <div className="grid grid-cols-7 gap-1.5">
                                        {COLOR_PALETTE.map((c) => (
                                            <button
                                                key={c}
                                                type="button"
                                                title={c}
                                                onClick={() => {
                                                    onSetColor(cat, c);
                                                    setPickerOpen(null);
                                                }}
                                                className={`w-5 h-5 rounded-full ${c} transition-transform hover:scale-110 ${
                                                    currentColor === c
                                                        ? 'ring-2 ring-offset-1 ring-zinc-600 dark:ring-zinc-300'
                                                        : ''
                                                }`}
                                            />
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    );
                },
            )}
        </nav>
    );
}

// ── Provider tabs ─────────────────────────────────────────────────────────────

function ProviderTabs({
    view,
    onView,
    gmailCount,
    outlookCount,
    hasGmail,
    hasOutlook,
}: {
    view: 'all' | 'gmail' | 'outlook';
    onView: (v: 'all' | 'gmail' | 'outlook') => void;
    gmailCount: number;
    outlookCount: number;
    hasGmail: boolean;
    hasOutlook: boolean;
}) {
    if (!hasGmail || !hasOutlook) return null;
    return (
        <div className="flex items-center gap-1">
            {(['all', 'gmail', 'outlook'] as const).map((v) => (
                <button
                    key={v}
                    type="button"
                    onClick={() => onView(v)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors ${
                        view === v
                            ? v === 'gmail'
                                ? 'bg-red-500 text-white'
                                : v === 'outlook'
                                  ? 'bg-blue-500 text-white'
                                  : 'bg-zinc-800 dark:bg-zinc-200 text-white dark:text-zinc-900'
                            : 'text-zinc-500 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800'
                    }`}
                >
                    {v === 'gmail'
                        ? `Gmail (${gmailCount})`
                        : v === 'outlook'
                          ? `Outlook (${outlookCount})`
                          : 'All'}
                </button>
            ))}
        </div>
    );
}

// ── Main component ────────────────────────────────────────────────────────────

export default function Emails() {
    const {
        emails,
        gmailEmails,
        outlookEmails,
        nextPageToken,
        loading,
        syncing,
        isUnauthorized,
        hasGoogleSync,
        hasMicrosoftSync,
        loadEmails,
        forceRefresh,
        handleManualClassify,
    } = useEmails();

    const [providerView, setProviderView] = useState<
        'all' | 'gmail' | 'outlook'
    >('all');
    const [activeFilter, setActiveFilter] = useState<InboxFilter>(null);
    const [sortBy, setSortBy] = useState<'date' | 'priority'>('date');
    const { colors, setColor } = useCategoryColors();

    const visibleEmails = useMemo(
        () => mergeProviders(emails, gmailEmails, outlookEmails, providerView),
        [emails, gmailEmails, outlookEmails, providerView],
    );

    const {
        actions,
        loading: actionsLoading,
        extractingId,
        extractingAll,
        extractSingle,
        extractAll,
        toggleComplete,
        confirmAction,
        confirmAllForEmail,
        rejectAction,
    } = useEmailActions(visibleEmails, visibleEmails);

    // Email sets for smart filters
    const emailIdsWithTasks = useMemo(
        () =>
            new Set(
                actions
                    .filter((a) => a.type === 'action' && !a.completed)
                    .map((a) => a.email_id),
            ),
        [actions],
    );
    const emailIdsWithDeadlines = useMemo(
        () =>
            new Set(
                actions
                    .filter((a) => a.type === 'deadline' && !a.completed)
                    .map((a) => a.email_id),
            ),
        [actions],
    );
    const emailIdsWithMeetings = useMemo(
        () =>
            new Set(
                actions
                    .filter((a) => a.type === 'event' && !a.completed)
                    .map((a) => a.email_id),
            ),
        [actions],
    );

    const filteredEmails = useMemo(() => {
        let result: Email[];
        switch (activeFilter) {
            case FILTER_ATTENTION:
                result = visibleEmails.filter(
                    (e) => e.category === 'work' || e.category === 'finance',
                );
                break;
            case FILTER_NEEDS_REPLY:
                result = visibleEmails.filter(
                    (e) => e.category === 'work' || e.category === 'personal',
                );
                break;
            case FILTER_TASKS:
                result = visibleEmails.filter((e) =>
                    emailIdsWithTasks.has(e.id),
                );
                break;
            case FILTER_DEADLINES:
                result = visibleEmails.filter((e) =>
                    emailIdsWithDeadlines.has(e.id),
                );
                break;
            case FILTER_MEETINGS:
                result = visibleEmails.filter((e) =>
                    emailIdsWithMeetings.has(e.id),
                );
                break;
            case FILTER_SECURITY:
                result = visibleEmails.filter((e) => ALERT_RE.test(e.subject));
                break;
            case FILTER_DEVELOPMENT:
                result = visibleEmails.filter((e) =>
                    DEV_DOMAINS.test(e.sender),
                );
                break;
            case null:
                result = visibleEmails;
                break;
            default:
                result = visibleEmails.filter(
                    (e) => (e.category ?? 'other') === activeFilter,
                );
        }

        if (sortBy === 'priority') {
            result = [...result].sort(
                (a, b) =>
                    computePriorityScore(
                        b,
                        actions.filter((x) => x.email_id === b.id),
                    ) -
                    computePriorityScore(
                        a,
                        actions.filter((x) => x.email_id === a.id),
                    ),
            );
        }
        return result;
    }, [
        visibleEmails,
        activeFilter,
        sortBy,
        actions,
        emailIdsWithTasks,
        emailIdsWithDeadlines,
        emailIdsWithMeetings,
    ]);

    if (isUnauthorized) return <EmailUnauthorized />;

    async function handleExtractAll() {
        if (nextPageToken) {
            try {
                await loadEmails(nextPageToken);
            } catch {
                /* proceed anyway */
            }
        }
        await extractAll();
    }

    const deleteAction = (id: string) => void rejectAction(id);
    const confirmedActions = actions.filter((a) => a.synced);
    const notConnected = !hasGoogleSync && !hasMicrosoftSync;

    return (
        <div className="flex h-[calc(100vh-3.5rem)] overflow-hidden bg-white dark:bg-zinc-950">
            {/* ── Left rail: filters ──────────────────────────────────────── */}
            <aside className="w-48 shrink-0 border-r border-zinc-200 dark:border-zinc-800 overflow-y-auto no-scrollbar bg-white dark:bg-zinc-900 hidden md:block select-none">
                <FilterSidebar
                    emails={visibleEmails}
                    actions={actions}
                    active={activeFilter}
                    onSelect={setActiveFilter}
                    colors={colors}
                    onSetColor={setColor}
                />
            </aside>

            {/* ── Center: email feed ──────────────────────────────────────── */}
            <main className="flex-1 min-w-0 flex flex-col overflow-hidden">
                {/* Header bar */}
                <div className="flex items-center justify-between gap-2 px-4 py-2.5 border-b border-zinc-200 dark:border-zinc-800 shrink-0">
                    <div className="flex items-center gap-2.5">
                        {activeFilter === '__actions__' ? (
                            <button
                                type="button"
                                onClick={() => setActiveFilter(null)}
                                className="flex items-center gap-1.5 text-sm font-bold text-zinc-800 dark:text-zinc-100 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                            >
                                <ArrowLeft size={14} />
                                Inbox
                            </button>
                        ) : (
                            <h2 className="text-sm font-bold text-zinc-800 dark:text-zinc-100">
                                Inbox
                            </h2>
                        )}
                        {(syncing || loading) && (
                            <span className="text-[11px] text-zinc-400 animate-pulse">
                                {loading ? 'Loading…' : 'Syncing…'}
                            </span>
                        )}
                        <ProviderTabs
                            view={providerView}
                            onView={setProviderView}
                            gmailCount={gmailEmails.length}
                            outlookCount={outlookEmails.length}
                            hasGmail={hasGoogleSync}
                            hasOutlook={hasMicrosoftSync}
                        />
                    </div>
                    <div className="flex items-center gap-1.5">
                        {/* Refresh */}
                        <button
                            type="button"
                            onClick={() => void forceRefresh()}
                            disabled={loading}
                            title="Refresh inbox"
                            className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 disabled:opacity-40 transition-colors"
                        >
                            <RefreshCw
                                size={13}
                                className={loading ? 'animate-spin' : ''}
                            />
                        </button>
                        {/* Actions toggle */}
                        <button
                            type="button"
                            onClick={() =>
                                setActiveFilter(
                                    activeFilter === '__actions__'
                                        ? null
                                        : '__actions__',
                                )
                            }
                            className={`relative flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                                activeFilter === '__actions__'
                                    ? 'bg-amber-500 text-white'
                                    : 'border border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800'
                            }`}
                        >
                            Actions
                            {confirmedActions.filter((a) => !a.completed)
                                .length > 0 && (
                                <span className="w-4 h-4 bg-red-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center">
                                    {
                                        confirmedActions.filter(
                                            (a) => !a.completed,
                                        ).length
                                    }
                                </span>
                            )}
                        </button>
                        <select
                            value={sortBy}
                            onChange={(e) =>
                                setSortBy(e.target.value as typeof sortBy)
                            }
                            className="text-xs border border-zinc-200 dark:border-zinc-700 rounded-lg px-2 py-1.5 bg-white dark:bg-zinc-900 text-zinc-600 dark:text-zinc-400"
                        >
                            <option value="date">Newest</option>
                            <option value="priority">Priority</option>
                        </select>
                        {!notConnected && (
                            <button
                                type="button"
                                onClick={() => void handleExtractAll()}
                                disabled={extractingAll}
                                className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs border border-zinc-200 dark:border-zinc-700 text-zinc-500 dark:text-zinc-500 hover:bg-zinc-50 dark:hover:bg-zinc-800 disabled:opacity-40 transition-colors"
                            >
                                <Zap size={10} />
                                {extractingAll ? 'Extracting…' : 'Extract'}
                            </button>
                        )}
                        <AccountsDropdown />
                    </div>
                </div>

                {/* Intelligence strip (collapsed by default) */}
                {!notConnected && (
                    <IntelligenceStrip
                        emails={visibleEmails}
                        actions={actions}
                    />
                )}

                {/* Scrollable email area */}
                <div className="flex-1 overflow-y-auto no-scrollbar min-h-0">
                    {notConnected ? (
                        <div className="p-6">
                            <EmailConnectPrompt />
                        </div>
                    ) : activeFilter === '__actions__' ? (
                        <div className="p-4 space-y-4">
                            <EmailActionsPanel
                                actions={confirmedActions}
                                loading={actionsLoading}
                                onToggle={(id) => void toggleComplete(id)}
                                onDelete={deleteAction}
                            />
                            <EmailActionLog />
                        </div>
                    ) : (
                        <>
                            {providerView !== 'all' &&
                                ((providerView === 'gmail' && !hasGoogleSync) ||
                                    (providerView === 'outlook' &&
                                        !hasMicrosoftSync)) && (
                                    <div className="p-4">
                                        <EmailConnectPrompt />
                                    </div>
                                )}

                            <EmailList
                                emails={filteredEmails}
                                actions={actions}
                                extractingId={extractingId}
                                onClassify={handleManualClassify}
                                onExtract={(email) => void extractSingle(email)}
                                onConfirmAction={(id) => void confirmAction(id)}
                                onConfirmAll={(emailId) =>
                                    void confirmAllForEmail(emailId)
                                }
                                onRejectAction={(id) => void rejectAction(id)}
                            />

                            {filteredEmails.length === 0 && !loading && (
                                <div className="flex items-center justify-center h-32 text-zinc-400 dark:text-zinc-600">
                                    <p className="text-sm">
                                        {activeFilter
                                            ? 'No emails match this filter'
                                            : 'Inbox is empty'}
                                    </p>
                                </div>
                            )}

                            {nextPageToken && providerView !== 'outlook' && (
                                <button
                                    onClick={() =>
                                        void loadEmails(nextPageToken)
                                    }
                                    disabled={loading}
                                    className="w-full py-3 border-t border-dashed border-zinc-200 dark:border-zinc-800 text-xs text-zinc-400 disabled:opacity-50 hover:bg-zinc-50 dark:hover:bg-zinc-900 transition-colors"
                                >
                                    {loading
                                        ? 'Loading…'
                                        : 'Load older messages'}
                                </button>
                            )}
                        </>
                    )}
                </div>
            </main>

            {/* ── Right rail: tasks + calendar ────────────────────────────── */}
            <aside className="w-64 shrink-0 border-l border-zinc-200 dark:border-zinc-800 hidden lg:block overflow-hidden">
                <InboxRightRail />
            </aside>
        </div>
    );
}
