import { match } from 'ts-pattern';
import type { EventCategory } from '@/features/news/schemas/eventEnumSchemas';
import type {
    EnrichedFeedItem,
    RankedFeedItem,
} from '@/features/news/schemas/eventTypes';
import { rankedFeedItemSchema } from '@/features/news/schemas/eventCoreSchemas';

const categoryWeights: Record<EventCategory, number> = {
    world: 0.48,
    business: 0.62,
    technology: 0.76,
    markets: 0.7,
    research: 0.72,
    personal: 0.68,
    system: 0.55,
    health: 0.64,
    productivity: 0.66,
};

function recencyScore(publishedAt: string, now = Date.now()) {
    const ageHours = Math.max(
        0,
        (now - new Date(publishedAt).getTime()) / 3_600_000,
    );
    return Math.max(0, 1 - ageHours / 36);
}

function urgencyScore(urgency: EnrichedFeedItem['urgency']) {
    return match(urgency)
        .with('breaking', () => 1)
        .with('high', () => 0.82)
        .with('normal', () => 0.5)
        .with('low', () => 0.24)
        .exhaustive();
}

function keywordRelevance(item: EnrichedFeedItem) {
    const signals = ['ai', 'agent', 'queue', 'market', 'security', 'breaking'];
    const haystack =
        `${item.title} ${item.summary ?? ''} ${item.keywords.join(' ')}`.toLowerCase();
    return signals.reduce(
        (score, signal) => score + (haystack.includes(signal) ? 0.14 : 0),
        0,
    );
}

export function rankFeedItem(
    item: EnrichedFeedItem,
    now = Date.now(),
): RankedFeedItem {
    const categoryWeight = Math.max(
        ...item.categories.map((category) => categoryWeights[category] ?? 0.4),
    );
    const factors = {
        recency: recencyScore(item.publishedAt, now),
        sourcePriority: item.sourcePriority,
        categoryWeight,
        keywordRelevance: Math.min(1, keywordRelevance(item)),
        urgency: urgencyScore(item.urgency),
        interactionAffinity: item.personalization.affinity,
    };
    const rankScore =
        factors.recency * 0.32 +
        factors.sourcePriority * 0.2 +
        factors.categoryWeight * 0.16 +
        factors.keywordRelevance * 0.12 +
        factors.urgency * 0.14 +
        factors.interactionAffinity * 0.06;

    return rankedFeedItemSchema.parse({
        ...item,
        rankScore: Number(rankScore.toFixed(4)),
        rankFactors: factors,
    });
}

export function rankFeedItems(items: EnrichedFeedItem[], now = Date.now()) {
    return items
        .filter((item) => !item.personalization.suppressed)
        .map((item) => rankFeedItem(item, now))
        .sort((a, b) => b.rankScore - a.rankScore);
}
