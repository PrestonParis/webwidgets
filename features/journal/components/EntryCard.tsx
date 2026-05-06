'use client';

import { useState } from 'react';
import Image from 'next/image';
import { EntryCardProps } from '@/features/journal/types/journal';
import { EntryCardActions } from './EntryCardActions';

export default function EntryCard({
    entry,
    onDelete,
    onEdit,
    onRestore,
    isTrash,
}: EntryCardProps) {
    const [expanded, setExpanded] = useState(false);
    const [isConfirming, setIsConfirming] = useState(false);

    const plainText = entry.content.replace(/<[^>]+>/g, '');
    const wordCount = plainText.trim()
        ? plainText.trim().split(/\s+/).length
        : 0;

    return (
        <article className="group bg-white dark:bg-zinc-900 rounded-2xl border border-stone-100 dark:border-zinc-800 hover:border-stone-300 dark:hover:border-zinc-600 transition-all duration-200 overflow-hidden">
            {entry.image_url && (
                <div className="relative h-36 overflow-hidden">
                    <Image
                        src={entry.image_url}
                        alt=""
                        fill
                        unoptimized
                        sizes="(max-width: 768px) 100vw, 50vw"
                        className="object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                </div>
            )}

            <div className="p-6">
                <div className="flex items-start justify-between gap-4 mb-3">
                    <div
                        className={`flex-1 min-w-0 ${!isTrash ? 'cursor-pointer' : ''}`}
                        onClick={() => !isTrash && onEdit?.(entry)}
                    >
                        <time className="text-[11px] uppercase tracking-widest text-stone-400 dark:text-zinc-500 font-medium">
                            {new Date(entry.created_at).toLocaleDateString(
                                'en-US',
                                {
                                    weekday: 'long',
                                    year: 'numeric',
                                    month: 'long',
                                    day: 'numeric',
                                },
                            )}
                        </time>
                        <h3 className="font-serif text-xl font-semibold text-stone-900 dark:text-zinc-100 mt-0.5 leading-snug group-hover:text-amber-700 dark:group-hover:text-amber-400 transition-colors">
                            {entry.title}
                        </h3>
                    </div>

                    <div className="flex items-center gap-2 shrink-0 mt-1">
                        <EntryCardActions
                            entry={entry}
                            isTrash={isTrash}
                            isConfirming={isConfirming}
                            onEdit={onEdit}
                            onDelete={onDelete}
                            onRestore={onRestore}
                            onConfirmStart={() => setIsConfirming(true)}
                            onConfirmCancel={() => setIsConfirming(false)}
                        />
                    </div>
                </div>

                <div
                    className={`text-stone-600 dark:text-zinc-400 text-sm leading-relaxed prose prose-sm dark:prose-invert max-w-none ${!expanded ? 'line-clamp-3' : ''}`}
                    dangerouslySetInnerHTML={{ __html: entry.content }}
                />

                <div className="flex items-center justify-between mt-4 pt-3 border-t border-stone-100 dark:border-zinc-800">
                    <span className="text-[11px] text-stone-400 dark:text-zinc-600">
                        {wordCount} {wordCount === 1 ? 'word' : 'words'}
                    </span>
                    <button
                        onClick={() => setExpanded((v) => !v)}
                        className="text-[11px] font-medium text-amber-700 dark:text-amber-500 hover:underline"
                    >
                        {expanded ? 'Show less' : 'Read more →'}
                    </button>
                </div>
            </div>
        </article>
    );
}
