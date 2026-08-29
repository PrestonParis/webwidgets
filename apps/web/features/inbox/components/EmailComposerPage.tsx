'use client';
import Link from 'next/link';
import { useEmailComposer } from '../hooks/useEmailComposer';
import { EmailReview } from './EmailReview';
import { EmailActionHistory } from './EmailActionHistory';
import { EmailComposerForm } from './EmailComposerForm';
import { EmailCapabilityUpgrade } from './EmailCapabilityUpgrade';

export default function EmailComposerPage() {
    const composer = useEmailComposer();
    const { workspace, busy, review } = composer;
    return (
        <main className="mx-auto max-w-3xl space-y-6 px-4 py-8">
            <Link
                href="/inbox"
                className="text-sm text-blue-600 dark:text-blue-400"
            >
                ← Inbox
            </Link>
            <div>
                <h1 className="text-2xl font-semibold">Compose email</h1>
                <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                    Create a draft or explicitly approve a send. No autonomous
                    sending. Gmail and Outlook are supported. Attachments and
                    reply composition are not enabled in this first screen.
                </p>
            </div>
            {!workspace?.enabled && (
                <p role="status" className="rounded-xl border p-4">
                    Email actions are awaiting deployment verification.
                    Connected inbox reading is unchanged.
                </p>
            )}
            {workspace?.enabled && <EmailCapabilityUpgrade />}
            <EmailComposerForm composer={composer} />
            {composer.notice && (
                <p role="status" className="rounded-lg border p-3 text-sm">
                    {composer.notice}
                </p>
            )}
            {review && (
                <EmailReview
                    action={review}
                    busy={busy}
                    approve={composer.approve}
                    abandon={composer.abandon}
                />
            )}
            <div className="flex gap-4">
                <button
                    type="button"
                    disabled={busy}
                    className="text-sm underline"
                    onClick={() => void composer.refresh()}
                >
                    Refresh status
                </button>
                <button
                    type="button"
                    disabled={busy}
                    className="text-sm underline"
                    onClick={composer.newMessage}
                >
                    New message
                </button>
            </div>
            {workspace && (
                <EmailActionHistory
                    workspace={workspace}
                    busy={busy}
                    reconcile={composer.reconcile}
                />
            )}
        </main>
    );
}
