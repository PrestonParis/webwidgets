'use client';

import EmptyInbox from '../Dashboard/EmptyInbox';
import WidgetShell from '@/components/Widgets/WidgetShell';
import { useWidgetSettings } from '@/hooks/useWidgetSettings';
import { useEmails } from '@/hooks/useEmails';
import MailIcon from '../Icons/MailIcon';

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
                            <p className="font-semibold truncate">
                                {mail.subject}
                            </p>
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
