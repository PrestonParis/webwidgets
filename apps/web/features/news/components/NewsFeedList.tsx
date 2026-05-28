'use client';

import { Bookmark, Clock3, ExternalLink, Sparkles } from 'lucide-react';
import type { RankedFeedItem } from '@/features/news/types/events';
import { cn } from '@/lib/utils/utils';

function timeAgo(iso: string) {
    const minutes = Math.max(
        1,
        Math.round((Date.now() - new Date(iso).getTime()) / 60_000),
    );
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.round(minutes / 60);
    return `${hours}h`;
}

export function NewsFeedList({
    items,
    compact = false,
}: {
    items: RankedFeedItem[];
    compact?: boolean;
}) {
    return (
        <div
            className={cn(
                'divide-y divide-zinc-200 dark:divide-zinc-800',
                compact
                    ? '-mt-1'
                    : 'border-y border-zinc-200 dark:border-zinc-800',
            )}
        >
            {items.map((item) => (
                <article
                    key={item.id}
                    className={cn(
                        'grid gap-2 py-3',
                        compact
                            ? 'grid-cols-[1fr_auto]'
                            : 'grid-cols-[minmax(0,1fr)_130px]',
                    )}
                >
                    <div className="min-w-0">
                        <div className="flex items-center gap-2 text-[10px] uppercase text-zinc-500 dark:text-zinc-400">
                            <span className="font-bold">{item.providerId}</span>
                            <span>{item.categories[0]}</span>
                            <span
                                className={cn(
                                    'h-1.5 w-1.5 rounded-full',
                                    item.urgency === 'high' ||
                                        item.urgency === 'breaking'
                                        ? 'bg-red-500'
                                        : 'bg-emerald-500',
                                )}
                            />
                        </div>
                        <h3
                            className={cn(
                                'mt-1 font-semibold leading-snug text-zinc-950 dark:text-zinc-50',
                                compact ? 'text-sm' : 'text-base',
                            )}
                        >
                            {item.title}
                        </h3>
                        {!compact && item.summary && (
                            <p className="mt-1 line-clamp-2 text-sm text-zinc-600 dark:text-zinc-300">
                                {item.summary}
                            </p>
                        )}
                        <div className="mt-2 flex flex-wrap items-center gap-2 text-[11px] text-zinc-500">
                            <span className="inline-flex items-center gap-1">
                                <Clock3 size={12} />
                                {timeAgo(item.publishedAt)}
                            </span>
                            <span>
                                rank {(item.rankScore * 100).toFixed(0)}
                            </span>
                            <span className="inline-flex items-center gap-1">
                                <Sparkles size={12} />
                                {item.ai.summaryStatus}
                            </span>
                        </div>
                    </div>
                    <div className="flex items-start justify-end gap-1">
                        <button
                            title="Bookmark"
                            className="grid h-8 w-8 place-items-center rounded-md text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900 dark:hover:bg-zinc-800 dark:hover:text-zinc-100"
                        >
                            <Bookmark size={15} />
                        </button>
                        {item.url && (
                            <a
                                title="Open source"
                                href={item.url}
                                className="grid h-8 w-8 place-items-center rounded-md text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900 dark:hover:bg-zinc-800 dark:hover:text-zinc-100"
                            >
                                <ExternalLink size={15} />
                            </a>
                        )}
                    </div>
                </article>
            ))}
        </div>
    );
}
