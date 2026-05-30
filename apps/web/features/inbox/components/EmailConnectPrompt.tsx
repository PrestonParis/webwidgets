'use client';

import { Mail } from 'lucide-react';
import { useEmailConnection } from '@/features/inbox/hooks/useEmailConnection';
import { cn } from '@/lib/utils/utils';
import type { EmailConnectPromptProps } from '@/features/inbox/types/inbox';

export function EmailConnectPrompt({
    compact = false,
    inline = false,
    provider,
}: EmailConnectPromptProps) {
    const {
        googleAccounts,
        microsoftAccounts,
        hasGmail,
        hasMicrosoft,
        connectGmail,
        connectOutlook,
    } = useEmailConnection();

    const showGmail = !provider || provider === 'gmail';
    const showOutlook = !provider || provider === 'outlook';

    // Inline strip: show connected account pills + "Add another" buttons
    if (inline) {
        return (
            <div className="flex items-center gap-2 flex-wrap">
                {showGmail &&
                    googleAccounts.map((a) => (
                        <span
                            key={a.id}
                            className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium bg-red-50 dark:bg-red-950/30 text-red-600 dark:text-red-300 border border-red-100 dark:border-red-900/40"
                        >
                            <GmailLogo size={10} />
                            {a.email}
                        </span>
                    ))}
                {showOutlook &&
                    microsoftAccounts.map((a) => (
                        <span
                            key={a.id}
                            className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium bg-blue-50 dark:bg-blue-950/30 text-blue-600 dark:text-blue-300 border border-blue-100 dark:border-blue-900/40"
                        >
                            <OutlookLogo size={10} />
                            {a.email}
                        </span>
                    ))}
                {showGmail && (
                    <button
                        onClick={connectGmail}
                        className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium border border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors"
                    >
                        <GmailLogo size={12} />
                        {hasGmail ? '+ Gmail' : 'Connect Gmail'}
                    </button>
                )}
                {showOutlook && (
                    <button
                        onClick={connectOutlook}
                        className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium border border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors"
                    >
                        <OutlookLogo size={12} />
                        {hasMicrosoft ? '+ Outlook' : 'Connect Outlook'}
                    </button>
                )}
            </div>
        );
    }

    // Compact — for widget body
    if (compact) {
        const providerName =
            provider === 'gmail'
                ? 'Gmail'
                : provider === 'outlook'
                  ? 'Outlook'
                  : 'an email';
        return (
            <div className="flex flex-col items-center justify-center py-6 px-3 space-y-3 text-center">
                <div className="w-10 h-10 rounded-full bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center">
                    <Mail size={18} className="text-blue-500" />
                </div>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-4">
                    Connect {providerName} to see your inbox here.
                </p>
                <div className="flex gap-2 w-full">
                    {showGmail && (
                        <button
                            onClick={connectGmail}
                            className="flex-1 py-1.5 text-xs font-medium rounded-lg bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 hover:bg-zinc-700 dark:hover:bg-zinc-300 transition-colors"
                        >
                            Connect Gmail
                        </button>
                    )}
                    {showOutlook && (
                        <button
                            onClick={connectOutlook}
                            className="flex-1 py-1.5 text-xs font-medium rounded-lg border border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors"
                        >
                            Connect Outlook
                        </button>
                    )}
                </div>
            </div>
        );
    }

    // Full empty-state (shown when a provider tab is selected but not connected)
    return (
        <div className="max-w-md mx-auto mt-12 px-4">
            <div className="p-8 rounded-3xl border border-dashed border-zinc-200 dark:border-zinc-800 text-center space-y-6">
                <div className="w-16 h-16 mx-auto rounded-full bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center">
                    <Mail size={28} className="text-blue-500" />
                </div>

                <div className="space-y-1.5">
                    <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
                        Connect your email
                    </h2>
                    <p className="text-sm text-zinc-500 dark:text-zinc-400">
                        Add Gmail or Outlook to see your inbox, triage messages,
                        and extract action items.
                    </p>
                </div>

                <div className="flex flex-col gap-2.5">
                    <button
                        onClick={connectGmail}
                        className={cn(
                            'w-full flex items-center justify-center gap-2.5 py-2.5 px-4 rounded-xl',
                            'bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900',
                            'text-sm font-medium hover:bg-zinc-700 dark:hover:bg-zinc-300 transition-colors',
                        )}
                    >
                        <GmailLogo />
                        {hasGmail ? 'Add another Gmail' : 'Connect Gmail'}
                    </button>
                    <button
                        onClick={connectOutlook}
                        className={cn(
                            'w-full flex items-center justify-center gap-2.5 py-2.5 px-4 rounded-xl',
                            'border border-zinc-200 dark:border-zinc-700',
                            'text-sm font-medium text-zinc-700 dark:text-zinc-300',
                            'hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors',
                        )}
                    >
                        <OutlookLogo />
                        {hasMicrosoft
                            ? 'Add another Outlook'
                            : 'Connect Outlook'}
                    </button>
                </div>

                {(googleAccounts.length > 0 ||
                    microsoftAccounts.length > 0) && (
                    <div className="text-left space-y-1">
                        <p className="text-[11px] font-semibold text-zinc-400 dark:text-zinc-600 uppercase tracking-wide">
                            Connected accounts
                        </p>
                        {googleAccounts.map((a) => (
                            <p
                                key={a.id}
                                className="text-xs text-zinc-500 dark:text-zinc-400 flex items-center gap-1.5"
                            >
                                <GmailLogo size={12} /> {a.email}
                            </p>
                        ))}
                        {microsoftAccounts.map((a) => (
                            <p
                                key={a.id}
                                className="text-xs text-zinc-500 dark:text-zinc-400 flex items-center gap-1.5"
                            >
                                <OutlookLogo size={12} /> {a.email}
                            </p>
                        ))}
                    </div>
                )}

                <p className="text-[11px] text-zinc-400 dark:text-zinc-600">
                    More providers coming soon: Yahoo Mail, iCloud, and others.
                </p>
            </div>
        </div>
    );
}

function GmailLogo({ size = 16 }: { size?: number }) {
    return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
            <path d="M6 18V6.825L12 11.4l6-4.575V18H6z" fill="#EA4335" />
            <path d="M3 19.5h3V12L3 9v10a.5.5 0 0 0 .5.5H3z" fill="#34A853" />
            <path d="M18 19.5h3a.5.5 0 0 0 .5-.5V9l-3 3v7.5z" fill="#4285F4" />
            <path d="M3 9l9 6.75L21 9l-9-6.75L3 9z" fill="#FBBC04" />
            <path d="M3 9l9 6.75V4.5L3 9z" fill="#EA4335" />
            <path d="M21 9L12 4.5v11.25L21 9z" fill="#1967D2" />
        </svg>
    );
}

function OutlookLogo({ size = 16 }: { size?: number }) {
    return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
            <rect x="2" y="4" width="13" height="16" rx="1.5" fill="#0078D4" />
            <path d="M8.5 8a3.5 3.5 0 1 0 0 7 3.5 3.5 0 0 0 0-7z" fill="#fff" />
            <path d="M15 8.5h7v7h-7z" fill="#0078D4" />
            <path
                d="M15 8.5l3.5 3.5L22 8.5M15 15.5l3.5-3.5 3.5 3.5"
                stroke="#fff"
                strokeWidth="1.2"
                fill="none"
            />
        </svg>
    );
}
