'use client';

import { AlertTriangle, ExternalLink } from 'lucide-react';
import { AdminPageHeader } from '../AdminPageHeader';

const SENTRY_ORG = process.env.NEXT_PUBLIC_SENTRY_ORG ?? '';
const SENTRY_PROJ = process.env.NEXT_PUBLIC_SENTRY_PROJECT ?? '';

function SentryLink() {
    if (!SENTRY_ORG || !SENTRY_PROJ) return null;
    const href = `https://sentry.io/organizations/${SENTRY_ORG}/issues/?project=${SENTRY_PROJ}`;
    return (
        <a
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-lg bg-orange-500 text-white hover:bg-orange-600 transition-colors"
        >
            <ExternalLink size={14} />
            Open Sentry
        </a>
    );
}

export function AdminErrorsPage() {
    return (
        <div className="space-y-6">
            <AdminPageHeader
                title="Errors"
                description="Runtime errors and exception tracking via Sentry"
                actions={<SentryLink />}
            />

            <div className="bg-white dark:bg-zinc-900 rounded-xl border border-gray-200 dark:border-zinc-800 p-6">
                <div className="flex flex-col items-center gap-3 py-8 text-center">
                    <AlertTriangle size={32} className="text-orange-400" />
                    <p className="text-sm font-medium text-gray-700 dark:text-zinc-300">
                        Sentry is integrated via @sentry/nextjs
                    </p>
                    <p className="text-sm text-gray-500 dark:text-zinc-500 max-w-md">
                        Errors are automatically captured and sent to Sentry.
                        Set{' '}
                        <code className="font-mono text-xs bg-gray-100 dark:bg-zinc-800 px-1 py-0.5 rounded">
                            NEXT_PUBLIC_SENTRY_ORG
                        </code>{' '}
                        and{' '}
                        <code className="font-mono text-xs bg-gray-100 dark:bg-zinc-800 px-1 py-0.5 rounded">
                            NEXT_PUBLIC_SENTRY_PROJECT
                        </code>{' '}
                        to get a direct link above.
                    </p>
                    <p className="text-xs text-gray-400 dark:text-zinc-600 mt-2">
                        The global error boundary is wired in{' '}
                        <code className="font-mono">app/global-error.tsx</code>.
                    </p>
                </div>
            </div>
        </div>
    );
}
