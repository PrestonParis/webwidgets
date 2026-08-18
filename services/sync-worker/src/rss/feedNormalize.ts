import { createHash } from 'node:crypto';
import Parser from 'rss-parser';
import { WorkerTaskError } from '../v1/processors.js';

const parser = new Parser();
const trackingParameters = /^(utm_|fbclid$|gclid$)/iu;

export interface NormalizedFeedItem {
    sourceEventId: string;
    canonicalUrl: string | null;
    author: string | null;
    publisher: string;
    title: string;
    summary: string | null;
    occurredAt: string;
    updatedAt: string | null;
    contentHash: string;
    relatedStoryKey: string;
}

export function sha256(value: string) {
    return createHash('sha256').update(value).digest('hex');
}

function cleanText(value: unknown, limit: number) {
    if (typeof value !== 'string') return null;
    const text = value
        .replace(/<[^>]*>/gu, ' ')
        .replace(/\s+/gu, ' ')
        .trim();
    return text ? text.slice(0, limit) : null;
}

export function canonicalizeArticleUrl(value: string | undefined) {
    if (!value) return null;
    try {
        const url = new URL(value);
        if (!['http:', 'https:'].includes(url.protocol)) return null;
        url.hash = '';
        for (const key of [...url.searchParams.keys()]) {
            if (trackingParameters.test(key)) url.searchParams.delete(key);
        }
        return url.toString();
    } catch {
        return null;
    }
}

function validDate(value: string | undefined, fallback: string) {
    const parsed = value ? new Date(value) : new Date(Number.NaN);
    return Number.isNaN(parsed.valueOf()) ? fallback : parsed.toISOString();
}

export async function normalizeFeed(
    xml: string,
    feedUrl: string,
    fetchedAt: string,
): Promise<NormalizedFeedItem[]> {
    let feed;
    try {
        feed = await parser.parseString(xml);
    } catch {
        throw new WorkerTaskError(
            'rss_malformed_feed',
            'The source did not return valid RSS or Atom.',
            false,
        );
    }
    const publisher = cleanText(feed.title, 300) ?? new URL(feedUrl).hostname;
    return feed.items.flatMap((item) => {
        const rawItem = item as typeof item & { id?: string };
        const title = cleanText(item.title, 500);
        if (!title) return [];
        const canonicalUrl = canonicalizeArticleUrl(item.link);
        const occurredAt = validDate(item.isoDate ?? item.pubDate, fetchedAt);
        const updatedAt = validDate(
            typeof item.updated === 'string' ? item.updated : undefined,
            occurredAt,
        );
        const summary = cleanText(
            item.contentSnippet ?? item.summary ?? item.content,
            4_000,
        );
        const sourceEventId = String(
            item.guid ??
                rawItem.id ??
                canonicalUrl ??
                sha256(`${title}:${occurredAt}`),
        ).slice(0, 500);
        const storyTitle = title
            .toLowerCase()
            .replace(/[^a-z0-9]+/gu, ' ')
            .trim();
        return [
            {
                sourceEventId,
                canonicalUrl,
                author: cleanText(item.creator, 300),
                publisher,
                title,
                summary,
                occurredAt,
                updatedAt,
                contentHash: sha256(
                    JSON.stringify({
                        title,
                        summary,
                        canonicalUrl,
                        occurredAt,
                    }),
                ),
                relatedStoryKey: sha256(
                    `${storyTitle}:${occurredAt.slice(0, 10)}`,
                ),
            },
        ];
    });
}
