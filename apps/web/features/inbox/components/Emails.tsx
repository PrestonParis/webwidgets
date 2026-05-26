'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useEmails } from '@/features/inbox/hooks/useEmails';
import { useCalendarConnection } from '@/features/inbox/hooks/useCalendarConnection';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { useEmailActions } from '@/features/inbox/hooks/useEmailActions';
import { EmailList } from './EmailList';
import { EmailInsights } from './EmailInsights';
import { EmailUnauthorized } from './EmailUnauthorized';
import { EmailConnectPrompt } from './EmailConnectPrompt';
import { EmailActionsPanel } from './EmailActionsPanel';
import { EmailActionLog } from './EmailActionLog';
import { CalendarConnect } from './CalendarConnect';
import type { Email } from '@/features/inbox/types/inbox';

type InboxView = 'weave' | 'gmail' | 'outlook';

const VIEW_LABELS: Record<InboxView, string> = {
    weave: 'Woven inbox',
    gmail: 'Gmail',
    outlook: 'Outlook',
};

function filterEmails(
    view: InboxView,
    emails: Email[],
    gmailEmails: Email[],
    outlookEmails: Email[],
) {
    if (view === 'gmail') return gmailEmails;
    if (view === 'outlook') return outlookEmails;
    return emails;
}

export default function Emails() {
    const {
        emails,
        gmailEmails,
        outlookEmails,
        nextPageToken,
        loading,
        isUnauthorized,
        hasGoogleSync,
        hasMicrosoftSync,
        loadEmails,
        handleManualClassify,
    } = useEmails();
    const [inboxView, setInboxView] = useState<InboxView>('weave');
    const visibleEmails = useMemo(
        () => filterEmails(inboxView, emails, gmailEmails, outlookEmails),
        [emails, gmailEmails, inboxView, outlookEmails],
    );

    // Track all emails ever loaded (across pages) for extractAll
    const allEmailsRef = useRef(emails);
    useEffect(() => {
        allEmailsRef.current = visibleEmails;
    }, [visibleEmails]);

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

    const { connectCalendar } = useAuth();
    const { isCalendarConnected, loading: calendarLoading } =
        useCalendarConnection();

    if (isUnauthorized) return <EmailUnauthorized />;

    async function handleExtractAll() {
        let token = nextPageToken;
        while (token) {
            await loadEmails(token);
            token = null;
        }
        await extractAll();
    }

    const confirmedActions = actions.filter((a) => a.synced && !a.completed);
    const canWeave = hasGoogleSync && hasMicrosoftSync;

    return (
        <div className="max-w-2xl mx-auto p-4 space-y-6">
            <div className="flex items-center justify-between gap-3">
                <h2 className="text-2xl font-bold">Inbox</h2>
                <div className="flex items-center gap-3">
                    <EmailConnectPrompt inline />
                    {loading && (
                        <span className="text-sm text-zinc-400">Syncing…</span>
                    )}
                </div>
            </div>
            <div className="flex flex-wrap items-center gap-2 rounded-2xl border border-gray-100 bg-white p-2 dark:border-zinc-800 dark:bg-zinc-900">
                {(['gmail', 'outlook'] as InboxView[]).map((view) => {
                    const connected =
                        view === 'gmail' ? hasGoogleSync : hasMicrosoftSync;
                    const count =
                        view === 'gmail'
                            ? gmailEmails.length
                            : outlookEmails.length;
                    return (
                        <button
                            key={view}
                            type="button"
                            disabled={!connected}
                            onClick={() => setInboxView(view)}
                            className={`rounded-xl px-3 py-1.5 text-xs font-semibold transition-colors ${
                                inboxView === view
                                    ? 'bg-gray-900 text-white dark:bg-zinc-100 dark:text-zinc-950'
                                    : 'text-gray-500 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40 dark:text-zinc-400 dark:hover:bg-zinc-800'
                            }`}
                        >
                            {VIEW_LABELS[view]} {connected ? `(${count})` : ''}
                        </button>
                    );
                })}
                <button
                    type="button"
                    disabled={!canWeave}
                    onClick={() => setInboxView('weave')}
                    className={`ml-auto rounded-xl px-3 py-1.5 text-xs font-semibold transition-colors ${
                        inboxView === 'weave'
                            ? 'bg-blue-600 text-white'
                            : 'border border-blue-100 text-blue-600 hover:bg-blue-50 disabled:cursor-not-allowed disabled:opacity-40 dark:border-blue-900/60 dark:text-blue-300 dark:hover:bg-blue-950/30'
                    }`}
                >
                    Weave inboxes {canWeave ? `(${emails.length})` : ''}
                </button>
            </div>
            {!canWeave && (
                <p className="text-xs text-gray-400 dark:text-zinc-500">
                    Connect both Gmail and Outlook to weave them into one
                    chronological inbox.
                </p>
            )}
            {confirmedActions.length > 0 && (
                <EmailActionsPanel
                    actions={confirmedActions}
                    loading={actionsLoading}
                    onToggle={(id) => void toggleComplete(id)}
                />
            )}
            {!calendarLoading && !isCalendarConnected && (
                <CalendarConnect onConnect={() => void connectCalendar()} />
            )}
            <EmailInsights
                emails={visibleEmails}
                extractingAll={extractingAll}
                onExtractAll={() => void handleExtractAll()}
            />
            <EmailList
                emails={visibleEmails}
                actions={actions}
                extractingId={extractingId}
                onClassify={handleManualClassify}
                onExtract={(email) => void extractSingle(email)}
                onConfirmAction={(id) => void confirmAction(id)}
                onConfirmAll={(emailId) => void confirmAllForEmail(emailId)}
                onRejectAction={(id) => void rejectAction(id)}
            />
            <EmailActionLog />
            {nextPageToken && inboxView !== 'outlook' && (
                <button
                    onClick={() => void loadEmails(nextPageToken)}
                    disabled={loading}
                    className="w-full py-4 border-dashed border rounded-2xl disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {loading ? 'Loading…' : 'Load Older Gmail Messages'}
                </button>
            )}
        </div>
    );
}
