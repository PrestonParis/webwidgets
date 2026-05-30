'use client';

import { useMemo, useState } from 'react';
import WidgetShell from '@/features/widgets/components/WidgetShell';
import { useWidgetSettings } from '@/features/widgets/hooks/useWidgetSettings';
import { useEmails } from '@/features/inbox/hooks/useEmails';
import { EmailConnectPrompt } from './EmailConnectPrompt';
import MailIcon from '@/icons/MailIcon';
import type { Email } from '@/features/inbox/types/inbox';

type InboxWidgetView = 'weave' | 'gmail' | 'outlook';

function pickEmails(
    view: InboxWidgetView,
    emails: Email[],
    gmailEmails: Email[],
    outlookEmails: Email[],
) {
    if (view === 'gmail') return gmailEmails;
    if (view === 'outlook') return outlookEmails;
    return emails;
}

function providerLabel(mail: Email): string {
    const p = mail.providers ?? (mail.provider ? [mail.provider] : ['gmail']);
    if (p.length >= 2) return 'Gmail + Outlook';
    return p[0] === 'outlook' ? 'Outlook' : 'Gmail';
}

function providerBadgeClass(mail: Email): string {
    const p = mail.providers ?? (mail.provider ? [mail.provider] : ['gmail']);
    if (p.length >= 2) return 'text-purple-500 dark:text-purple-300';
    return p[0] === 'outlook' ? 'text-blue-400' : 'text-red-400';
}

export default function EmailWidget() {
    const { settings, updateSettings } = useWidgetSettings('email', 'email');
    const [view, setView] = useState<InboxWidgetView>('weave');

    const {
        emails,
        gmailEmails,
        outlookEmails,
        loading,
        isUnauthorized,
        hasGoogleSync,
        hasMicrosoftSync,
    } = useEmails();

    const visibleEmails = useMemo(
        () => pickEmails(view, emails, gmailEmails, outlookEmails),
        [emails, gmailEmails, outlookEmails, view],
    );

    const viewNeedsConnect =
        (view === 'gmail' && !hasGoogleSync) ||
        (view === 'outlook' && !hasMicrosoftSync);

    const viewProvider: 'gmail' | 'outlook' | undefined =
        view === 'gmail' ? 'gmail' : view === 'outlook' ? 'outlook' : undefined;

    const TABS: { id: InboxWidgetView; label: string; active: boolean }[] = [
        { id: 'gmail', label: 'Gmail', active: hasGoogleSync },
        { id: 'outlook', label: 'Outlook', active: hasMicrosoftSync },
        {
            id: 'weave',
            label: 'Weave',
            active: hasGoogleSync || hasMicrosoftSync,
        },
    ];

    return (
        <WidgetShell
            icon={<MailIcon />}
            title="Inbox"
            settings={settings}
            onSettingsChange={updateSettings}
            footerHref="/inbox"
            footerLabel="Open Full Inbox →"
            widgetId="inbox"
            widgetType="inbox"
        >
            {isUnauthorized ? (
                <EmailConnectPrompt compact />
            ) : loading ? (
                <div className="space-y-2">
                    {Array.from({ length: 3 }).map((_, i) => (
                        <div
                            key={i}
                            className="h-10 bg-gray-100 dark:bg-zinc-800 rounded animate-pulse"
                        />
                    ))}
                </div>
            ) : (
                <div className="space-y-3">
                    <div className="flex items-center gap-1 rounded-lg bg-gray-50 p-1 dark:bg-zinc-800/70">
                        {TABS.map(({ id, label }) => (
                            <button
                                key={id}
                                type="button"
                                onClick={() => setView(id)}
                                className={`flex-1 rounded-md px-2 py-1 text-[10px] font-semibold capitalize transition-colors ${
                                    view === id
                                        ? id === 'weave'
                                            ? 'bg-blue-600 text-white shadow-sm'
                                            : 'bg-white text-gray-900 shadow-sm dark:bg-zinc-700 dark:text-zinc-100'
                                        : 'text-gray-400 dark:text-zinc-500 hover:text-gray-600 dark:hover:text-zinc-300'
                                }`}
                            >
                                {label}
                            </button>
                        ))}
                    </div>

                    {viewNeedsConnect ? (
                        <EmailConnectPrompt
                            compact
                            {...(viewProvider !== undefined
                                ? { provider: viewProvider }
                                : {})}
                        />
                    ) : visibleEmails.length > 0 ? (
                        visibleEmails.slice(0, 3).map((mail) => (
                            <div
                                key={mail.id}
                                className="text-xs border-b border-gray-50 dark:border-zinc-900 pb-2 last:border-0"
                            >
                                <div className="flex items-center gap-2 mb-0.5">
                                    <p className="font-semibold truncate flex-1">
                                        {mail.subject}
                                    </p>
                                    {mail.category &&
                                        mail.category !== 'other' && (
                                            <span className="shrink-0 text-[9px] uppercase font-bold px-1.5 py-0.5 rounded-md bg-gray-100 dark:bg-zinc-800 text-gray-500 dark:text-zinc-400">
                                                {mail.category}
                                            </span>
                                        )}
                                </div>
                                {view === 'weave' && (
                                    <p
                                        className={`mb-0.5 text-[9px] font-semibold uppercase tracking-wide ${providerBadgeClass(mail)}`}
                                    >
                                        {providerLabel(mail)}
                                    </p>
                                )}
                                <p className="text-gray-400 truncate">
                                    {mail.snippet}
                                </p>
                            </div>
                        ))
                    ) : (
                        <div className="flex flex-col items-center justify-center py-6 space-y-2">
                            <div className="w-10 h-10 rounded-full bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center">
                                <MailIcon />
                            </div>
                            <p className="text-xs text-gray-400 text-center">
                                Inbox is clear!
                            </p>
                        </div>
                    )}
                    <EmailConnectPrompt
                        inline
                        {...(viewProvider !== undefined
                            ? { provider: viewProvider }
                            : {})}
                    />
                </div>
            )}
        </WidgetShell>
    );
}
