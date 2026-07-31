'use client';

import {
    AlertCircle,
    Bookmark,
    CheckCircle2,
    Clock3,
    ExternalLink,
    HelpCircle,
} from 'lucide-react';
import type { RankedFeedItem } from '@/features/news/types/events';
import { cn } from '@/lib/utils/utils';

function timeAgo(iso: string) {
    const minutes = Math.max(
        1,
        Math.round((Date.now() - new Date(iso).getTime()) / 60_000),
    );
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.round(minutes / 60);
    if (hours < 24) return `${hours}h`;
    return `${Math.round(hours / 24)}d`;
}

type ConfidenceLevel = 'breaking' | 'developing' | 'confirmed';

function deriveConfidence(item: RankedFeedItem): ConfidenceLevel {
    if (item.urgency === 'breaking') return 'breaking';
    if (item.urgency === 'high') return 'developing';
    return 'confirmed';
}

const confidenceConfig = {
    breaking: { label: 'Breaking', Icon: AlertCircle, color: 'text-red-500' },
    developing: {
        label: 'Developing',
        Icon: HelpCircle,
        color: 'text-amber-500',
    },
    confirmed: {
        label: 'Confirmed',
        Icon: CheckCircle2,
        color: 'text-emerald-500',
    },
};

function CompactStoryCard({ item }: { item: RankedFeedItem }) {
    return (
        <article className="grid grid-cols-[1fr_auto] gap-2 py-2.5">
            <div className="min-w-0">
                <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
                    <span className="font-bold text-zinc-700 dark:text-zinc-300">
                        {item.providerId}
                    </span>
                    <span>·</span>
                    <span>{item.categories[0]}</span>
                    {item.urgency === 'breaking' && (
                        <span className="rounded bg-red-500 px-1 text-white">
                            LIVE
                        </span>
                    )}
                </div>
                <h3 className="mt-0.5 line-clamp-2 text-sm font-semibold leading-snug text-zinc-950 dark:text-zinc-50">
                    {item.title}
                </h3>
                <p className="mt-0.5 flex items-center gap-1 text-[11px] text-zinc-500">
                    <Clock3 size={11} />
                    {timeAgo(item.publishedAt)}
                </p>
            </div>
            <div className="flex items-start gap-0.5 pt-0.5">
                <button
                    title="Save"
                    className="grid h-7 w-7 place-items-center rounded text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700 dark:hover:bg-zinc-800 dark:hover:text-zinc-200"
                >
                    <Bookmark size={13} />
                </button>
                {item.url && (
                    <a
                        href={item.url}
                        title="Read article"
                        className="grid h-7 w-7 place-items-center rounded text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700 dark:hover:bg-zinc-800 dark:hover:text-zinc-200"
                    >
                        <ExternalLink size={13} />
                    </a>
                )}
            </div>
        </article>
    );
}

function FullStoryCard({ item }: { item: RankedFeedItem }) {
    const confidence = deriveConfidence(item);
    const { label, Icon, color } = confidenceConfig[confidence];
    const topics = item.ai.topics.slice(0, 4);
    const hints = item.ai.modelHints as Record<string, string>;
    const whyItMatters = hints?.whyItMatters;
    const whatChanged = hints?.whatChanged;

    return (
        <article className="border-b border-zinc-200 py-5 last:border-0 dark:border-zinc-800">
            <div className="flex flex-wrap items-center gap-2 text-[11px] text-zinc-500">
                <span className="font-bold uppercase tracking-wide text-zinc-800 dark:text-zinc-200">
                    {item.providerId}
                </span>
                <span>·</span>
                <span className="capitalize">{item.categories[0]}</span>
                <span>·</span>
                <span className="inline-flex items-center gap-1">
                    <Clock3 size={11} />
                    {timeAgo(item.publishedAt)}
                </span>
                {item.urgency === 'breaking' && (
                    <span className="rounded bg-red-500 px-1.5 py-0.5 text-[10px] font-bold uppercase text-white">
                        Breaking
                    </span>
                )}
            </div>

            <h3 className="mt-2 text-lg font-bold leading-snug text-zinc-950 dark:text-zinc-50">
                {item.title}
            </h3>

            {item.summary && (
                <p className="mt-1.5 line-clamp-3 text-sm leading-relaxed text-zinc-600 dark:text-zinc-300">
                    {item.summary}
                </p>
            )}

            {(whyItMatters ?? whatChanged) && (
                <div className="mt-3 space-y-1.5 rounded-lg bg-zinc-50 p-3 text-sm dark:bg-zinc-900">
                    {whyItMatters && (
                        <p>
                            <span className="font-semibold text-zinc-700 dark:text-zinc-300">
                                Why it matters:{' '}
                            </span>
                            <span className="text-zinc-600 dark:text-zinc-400">
                                {whyItMatters}
                            </span>
                        </p>
                    )}
                    {whatChanged && (
                        <p>
                            <span className="font-semibold text-zinc-700 dark:text-zinc-300">
                                What changed:{' '}
                            </span>
                            <span className="text-zinc-600 dark:text-zinc-400">
                                {whatChanged}
                            </span>
                        </p>
                    )}
                </div>
            )}

            <div className="mt-3 flex flex-wrap items-center gap-2">
                <span
                    className={cn(
                        'inline-flex items-center gap-1 text-[11px] font-semibold',
                        color,
                    )}
                >
                    <Icon size={12} />
                    {label}
                </span>
                {topics.map((topic) => (
                    <span
                        key={topic}
                        className="rounded-full bg-zinc-100 px-2 py-0.5 text-[11px] text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400"
                    >
                        {topic}
                    </span>
                ))}
            </div>

            <div className="mt-3 flex items-center gap-0.5">
                <button className="inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-[12px] font-semibold text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800">
                    <Bookmark size={13} />
                    Save
                </button>
                {item.url && (
                    <a
                        href={item.url}
                        className="inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-[12px] font-semibold text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800"
                    >
                        <ExternalLink size={13} />
                        Read
                    </a>
                )}
            </div>
        </article>
    );
}

export function StoryCard({
    item,
    compact = false,
}: {
    item: RankedFeedItem;
    compact?: boolean;
}) {
    return compact ? (
        <CompactStoryCard item={item} />
    ) : (
        <FullStoryCard item={item} />
    );
}
