'use client';

import { useEmails } from '@/features/inbox/hooks/useEmails';
import { EmailList } from './EmailList';
import { EmailInsights } from './EmailInsights';
import { EmailUnauthorized } from './EmailUnauthorized';

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

    if (!hasGoogleSync || isUnauthorized) return <EmailUnauthorized />;

    return (
        <div className="max-w-2xl mx-auto p-4 space-y-6">
            <div className="flex justify-between">
                <h2 className="text-2xl font-bold">Inbox</h2>
                {loading && <span>Syncing...</span>}
            </div>

            <EmailInsights emails={emails} />

            <EmailList emails={emails} onClassify={handleManualClassify} />

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
