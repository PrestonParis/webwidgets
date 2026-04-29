'use client';

import { useState } from 'react';
import { Email, EMAIL_CATEGORIES } from '@/types/inbox';
import { cn } from '@/lib/utils/utils';

const CATEGORY_STYLES: Record<string, string> = {
    work: 'bg-blue-100   dark:bg-blue-900/30   text-blue-700   dark:text-blue-300',
    personal:
        'bg-green-100  dark:bg-green-900/30  text-green-700  dark:text-green-300',
    finance:
        'bg-amber-100  dark:bg-amber-900/30  text-amber-700  dark:text-amber-300',
    promotions:
        'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300',
    social: 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300',
    notifications:
        'bg-gray-100   dark:bg-zinc-700/50   text-gray-600   dark:text-zinc-300',
    shopping:
        'bg-pink-100   dark:bg-pink-900/30   text-pink-700   dark:text-pink-300',
    other: 'bg-zinc-100   dark:bg-zinc-800      text-zinc-500   dark:text-zinc-400',
};

type Props = {
    mail: Email;
    onClassify: (
        id: string,
        cat: string,
        sender: string,
        subject: string,
    ) => void;
};

export function EmailCard({ mail, onClassify }: Props) {
    const [open, setOpen] = useState(false);

    const category = (mail.category ?? 'other') as string;
    const badgeStyle = CATEGORY_STYLES[category] ?? CATEGORY_STYLES.other;

    return (
        <div className="group p-5 bg-white dark:bg-zinc-900 border border-gray-100 dark:border-zinc-800 rounded-2xl hover:border-gray-200 dark:hover:border-zinc-700 transition-colors">
            <div className="flex justify-between items-start mb-2 gap-3">
                <div className="flex items-center gap-2 min-w-0">
                    <span
                        className={cn(
                            'shrink-0 text-[10px] uppercase font-bold px-2 py-0.5 rounded-lg',
                            badgeStyle,
                        )}
                    >
                        {category}
                    </span>
                    {mail.is_manual && (
                        <span className="shrink-0 text-[10px] text-gray-400 dark:text-zinc-500">
                            ✎
                        </span>
                    )}
                </div>
                <span className="shrink-0 text-[10px] text-gray-400 dark:text-zinc-500">
                    {mail.date}
                </span>
            </div>

            <h4 className="font-bold truncate text-gray-900 dark:text-zinc-100">
                {mail.subject}
            </h4>
            <div className="text-xs text-blue-600 dark:text-blue-400 truncate mt-0.5">
                {mail.sender}
            </div>
            <p className="text-sm text-gray-500 dark:text-zinc-400 line-clamp-2 mt-2 italic">
                &quot;{mail.snippet}&quot;
            </p>

            {/* Category picker */}
            <div className="mt-3 pt-3 border-t border-gray-100 dark:border-zinc-800">
                <button
                    onClick={() => setOpen((o) => !o)}
                    className="text-[10px] text-gray-400 dark:text-zinc-500 hover:text-gray-600 dark:hover:text-zinc-300 transition-colors"
                >
                    {open ? 'Cancel' : 'Change category'}
                </button>

                {open && (
                    <div className="flex flex-wrap gap-1.5 mt-2">
                        {EMAIL_CATEGORIES.map((cat) => (
                            <button
                                key={cat}
                                onClick={() => {
                                    onClassify(
                                        mail.id,
                                        cat,
                                        mail.sender,
                                        mail.subject,
                                    );
                                    setOpen(false);
                                }}
                                className={cn(
                                    'text-[10px] px-2.5 py-1 rounded-lg font-semibold border transition-all',
                                    category === cat
                                        ? cn(
                                              badgeStyle,
                                              'border-current opacity-100',
                                          )
                                        : 'bg-gray-50 dark:bg-zinc-800 text-gray-500 dark:text-zinc-400 border-transparent hover:border-gray-300 dark:hover:border-zinc-600',
                                )}
                            >
                                {cat}
                            </button>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
