'use client';

import EmptyInbox from '@/features/dashboard/components/EmptyInbox';
import WidgetShell from '@/features/widgets/components/WidgetShell';
import { useWidgetSettings } from '@/features/widgets/hooks/useWidgetSettings';
import { useEmails } from '@/features/inbox/hooks/useEmails';
import MailIcon from '@/icons/MailIcon';

export default function EmailWidget() {
    const { settings, updateSettings } = useWidgetSettings('email', 'email');

    const { emails, loading, isUnauthorized } = useEmails();

    if (isUnauthorized) return <EmptyInbox />;

    return (
        <WidgetShell
            icon={<MailIcon />}
            title="Notifications"
            badge="Gmail"
            settings={settings}
            onSettingsChange={updateSettings}
            footerHref="/inbox"
            footerLabel="Open Full Inbox →"
            widgetId="inbox"
            widgetType="inbox"
        >
            {loading ? (
                <div className="space-y-2">
                    {[...Array(3)].map((_, i) => (
                        <div
                            key={i}
                            className="h-10 bg-gray-100 dark:bg-zinc-800 rounded animate-pulse"
                        />
                    ))}
                </div>
            ) : emails.length > 0 ? (
                <div className="space-y-3">
                    {emails.slice(0, 3).map((mail) => (
                        <div
                            key={mail.id}
                            className="text-xs border-b border-gray-50 dark:border-zinc-900 pb-2 last:border-0"
                        >
                            <div className="flex items-center gap-2 mb-0.5">
                                <p className="font-semibold truncate flex-1">
                                    {mail.subject}
                                </p>
                                {mail.category && mail.category !== 'other' && (
                                    <span className="shrink-0 text-[9px] uppercase font-bold px-1.5 py-0.5 rounded-md bg-gray-100 dark:bg-zinc-800 text-gray-500 dark:text-zinc-400">
                                        {mail.category}
                                    </span>
                                )}
                            </div>
                            <p className="text-gray-400 truncate">
                                {mail.snippet}
                            </p>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="flex flex-col items-center justify-center py-8 space-y-3">
                    <div className="w-12 h-12 rounded-full bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center">
                        <MailIcon />
                    </div>
                    <p className="text-xs text-gray-400 text-center">
                        Inbox is clear!
                    </p>
                </div>
            )}
        </WidgetShell>
    );
}
