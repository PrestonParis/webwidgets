import { Clock3, ExternalLink, Link2 } from 'lucide-react';
import type { TimelineFeedItem } from '@/features/news/types/timelineFeed';
import { cn } from '@/lib/utils/utils';

function dayLabel(iso: string) {
    return new Intl.DateTimeFormat(undefined, {
        dateStyle: 'full',
    }).format(new Date(iso));
}

function timeLabel(iso: string) {
    return new Intl.DateTimeFormat(undefined, {
        timeStyle: 'short',
    }).format(new Date(iso));
}

function dateKey(iso: string) {
    const date = new Date(iso);
    return `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
}

function ingestionDiffers(item: TimelineFeedItem) {
    return (
        Math.abs(Date.parse(item.ingestedAt) - Date.parse(item.occurredAt)) >
        300_000
    );
}

export function TimelineFeedList({
    items,
    compact = false,
}: {
    items: TimelineFeedItem[];
    compact?: boolean;
}) {
    return (
        <div className="space-y-1">
            {items.map((item, index) => {
                const day = dateKey(item.occurredAt);
                const previous = items[index - 1];
                const showDay =
                    !compact &&
                    (!previous || dateKey(previous.occurredAt) !== day);
                return (
                    <div key={item.id}>
                        {showDay ? (
                            <h2 className="sticky top-0 z-10 bg-white/95 py-3 text-xs font-bold uppercase tracking-wide text-zinc-500 backdrop-blur dark:bg-zinc-950/95">
                                {dayLabel(item.occurredAt)}
                            </h2>
                        ) : null}
                        <TimelineItemCard compact={compact} item={item} />
                    </div>
                );
            })}
        </div>
    );
}

function TimelineItemCard({
    item,
    compact,
}: {
    item: TimelineFeedItem;
    compact: boolean;
}) {
    return (
        <article
            className={cn(
                'border-t border-zinc-200 py-4 dark:border-zinc-800',
                compact && 'py-3',
            )}
            id={`timeline-${item.id}`}
        >
            <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                    <p className="text-[10px] font-bold uppercase tracking-wide text-emerald-600 dark:text-emerald-400">
                        {item.sourceLabel} ·{' '}
                        {item.eventType.replaceAll('.', ' ')}
                    </p>
                    <h3
                        className={cn(
                            'mt-1 font-semibold text-zinc-950 dark:text-zinc-50',
                            compact ? 'line-clamp-2 text-sm' : 'text-base',
                        )}
                    >
                        {item.title}
                    </h3>
                </div>
                {item.sourceUrl ? <SourceLink item={item} /> : null}
            </div>
            {!compact && item.summary ? (
                <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-300">
                    {item.summary}
                </p>
            ) : null}
            <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-zinc-500">
                <span className="inline-flex items-center gap-1">
                    <Clock3 aria-hidden size={12} />
                    Occurred{' '}
                    <time dateTime={item.occurredAt}>
                        {timeLabel(item.occurredAt)}
                    </time>
                </span>
                {!compact && ingestionDiffers(item) ? (
                    <span>
                        Ingested{' '}
                        <time dateTime={item.ingestedAt}>
                            {timeLabel(item.ingestedAt)}
                        </time>
                    </span>
                ) : null}
                {item.revision > 1 ? (
                    <span>Revision {item.revision}</span>
                ) : null}
            </div>
            {!compact && item.relatedEvents.length ? (
                <RelatedEvents item={item} />
            ) : null}
        </article>
    );
}

function SourceLink({ item }: { item: TimelineFeedItem }) {
    return (
        <a
            aria-label={`Open source for ${item.title}`}
            className="rounded-md p-2 text-zinc-500 hover:bg-zinc-100 focus-visible:outline focus-visible:outline-2 dark:hover:bg-zinc-800"
            href={item.sourceUrl ?? undefined}
            rel="noreferrer"
            target="_blank"
        >
            <ExternalLink aria-hidden size={15} />
        </a>
    );
}

function RelatedEvents({ item }: { item: TimelineFeedItem }) {
    return (
        <details className="mt-3 text-xs text-zinc-600 dark:text-zinc-300">
            <summary className="inline-flex cursor-pointer items-center gap-1 font-semibold">
                <Link2 aria-hidden size={12} />
                {item.relatedEvents.length} related{' '}
                {item.relatedEvents.length === 1 ? 'event' : 'events'}
            </summary>
            <ul className="mt-2 space-y-1 pl-4">
                {item.relatedEvents.map((related) => (
                    <li key={related.id}>
                        <a
                            className="hover:underline"
                            href={`#timeline-${related.id}`}
                        >
                            {related.title}
                        </a>
                    </li>
                ))}
            </ul>
        </details>
    );
}
