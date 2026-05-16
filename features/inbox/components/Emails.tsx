'use client';

import { useRef } from 'react';
import { useEmails } from '@/features/inbox/hooks/useEmails';
import { useCalendarConnection } from '@/features/inbox/hooks/useCalendarConnection';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { useEmailActions } from '@/features/inbox/hooks/useEmailActions';
import { EmailList } from './EmailList';
import { EmailInsights } from './EmailInsights';
import { EmailUnauthorized } from './EmailUnauthorized';
import { EmailActionsPanel } from './EmailActionsPanel';
import { EmailActionLog } from './EmailActionLog';
import { CalendarConnect } from './CalendarConnect';

export default function Emails() {
    const {
        emails,
        nextPageToken,
        loading,
        isUnauthorized,
        hasGoogleSync,
        loadEmails,
        handleManualClassify,
    } = useEmails();

    // Track all emails ever loaded (across pages) for extractAll
    const allEmailsRef = useRef(emails);
    allEmailsRef.current = emails; // useEmails accumulates pages in state already

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
    } = useEmailActions(emails, emails);

    const { connectCalendar } = useAuth();
    const { isCalendarConnected, loading: calendarLoading } =
        useCalendarConnection();

    if (!hasGoogleSync || isUnauthorized) return <EmailUnauthorized />;

    // Load all remaining pages then extract
    const handleExtractAll = async () => {
        let token = nextPageToken;
        while (token) {
            await loadEmails(token);
            token = null; // useEmails updates nextPageToken in state; we just trigger once per cycle
        }
        await extractAll();
    };

    const confirmedActions = actions.filter((a) => a.synced && !a.completed);

    return (
        <div className="max-w-2xl mx-auto p-4 space-y-6">
            <div className="flex justify-between">
                <h2 className="text-2xl font-bold">Inbox</h2>
                {loading && <span>Syncing...</span>}
            </div>

            {confirmedActions.length > 0 && (
                <EmailActionsPanel
                    actions={confirmedActions}
                    loading={actionsLoading}
                    onToggle={(id) => {
                        void toggleComplete(id);
                    }}
                />
            )}

            {!calendarLoading && !isCalendarConnected && (
                <CalendarConnect
                    onConnect={() => {
                        void connectCalendar();
                    }}
                />
            )}

            <EmailInsights
                emails={emails}
                extractingAll={extractingAll}
                onExtractAll={() => {
                    void handleExtractAll();
                }}
            />

            <EmailList
                emails={emails}
                actions={actions}
                extractingId={extractingId}
                onClassify={handleManualClassify}
                onExtract={(email) => {
                    void extractSingle(email);
                }}
                onConfirmAction={(id) => {
                    void confirmAction(id);
                }}
                onConfirmAll={(emailId) => {
                    void confirmAllForEmail(emailId);
                }}
                onRejectAction={(id) => {
                    void rejectAction(id);
                }}
            />

            <EmailActionLog />

            {nextPageToken && (
                <button
                    onClick={() => {
                        void loadEmails(nextPageToken);
                    }}
                    disabled={loading}
                    className="w-full py-4 border-dashed border rounded-2xl disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {loading ? 'Loading…' : 'Load Older Messages'}
                </button>
            )}
        </div>
    );
}
