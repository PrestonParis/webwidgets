// Foundation for publishing activity events from news ingestion.
// Call these from news queue workers or ingest routes when jobs complete.
// All functions are fire-and-forget and never throw.

import type { SupabaseClient } from '@supabase/supabase-js';
import { publishActivityEventSafe } from '@/features/activity/services/activityService';
import { omitUndefined } from '@/features/backend/lib/exactOptional';

export async function publishNewsIngestedEvent(
    supabase: SupabaseClient,
    userId: string,
    opts: {
        feedUrl: string;
        feedName?: string;
        articleCount?: number;
        jobId?: string;
    },
): Promise<void> {
    const label = opts.feedName ?? opts.feedUrl;
    const countNote =
        opts.articleCount != null ? ` · ${opts.articleCount} articles` : '';

    await publishActivityEventSafe(
        supabase,
        omitUndefined({
            userId,
            source: 'news',
            eventType: 'news.imported',
            sourceId: opts.jobId,
            category: 'data',
            severity: 'info',
            priority: 'low',
            title: `News feed imported: ${label}`,
            body: `RSS ingestion completed${countNote}`,
            metadata: {
                feedUrl: opts.feedUrl,
                feedName: opts.feedName,
                articleCount: opts.articleCount,
                jobId: opts.jobId,
            },
        }),
    );
}

export async function publishArticleSavedEvent(
    supabase: SupabaseClient,
    userId: string,
    opts: {
        articleId: string;
        title: string;
        source?: string;
    },
): Promise<void> {
    await publishActivityEventSafe(
        supabase,
        omitUndefined({
            userId,
            source: 'news',
            eventType: 'news.article_saved',
            sourceId: opts.articleId,
            sourceTable: 'news_articles',
            category: 'content',
            severity: 'info',
            priority: 'low',
            title: `Article saved: ${opts.title}`,
            body: opts.source,
            relatedEntities: [
                { type: 'news_article', id: opts.articleId, label: opts.title },
            ],
            metadata: { articleId: opts.articleId, source: opts.source },
        }),
    );
}

export async function publishArticleSummarizedEvent(
    supabase: SupabaseClient,
    userId: string,
    opts: {
        articleId: string;
        title: string;
        artifactId?: string;
    },
): Promise<void> {
    await publishActivityEventSafe(
        supabase,
        omitUndefined({
            userId,
            source: 'news',
            eventType: 'news.article_summarized',
            sourceId: opts.articleId,
            sourceTable: 'news_articles',
            category: 'ai',
            severity: 'success',
            priority: 'low',
            title: `Article summarized: ${opts.title}`,
            relatedEntities: [
                { type: 'news_article', id: opts.articleId, label: opts.title },
                ...(opts.artifactId
                    ? [{ type: 'artifact', id: opts.artifactId }]
                    : []),
            ],
            metadata: {
                articleId: opts.articleId,
                artifactId: opts.artifactId,
            },
        }),
    );
}
