'use client';

import type { RankedFeedItem } from '@/features/news/types/events';
import { StoryCard } from '@/features/news/components/StoryCard';
import { cn } from '@/lib/utils/utils';

export function NewsFeedList({
    items,
    compact = false,
}: {
    items: RankedFeedItem[];
    compact?: boolean;
}) {
    if (items.length === 0) {
        return (
            <p className="py-6 text-sm text-zinc-500 dark:text-zinc-400">
                No stories match your filters.
            </p>
        );
    }

    return (
        <div
            className={cn(
                compact && 'divide-y divide-zinc-200 dark:divide-zinc-800',
            )}
        >
            {items.map((item) => (
                <StoryCard key={item.id} item={item} compact={compact} />
            ))}
        </div>
    );
}
