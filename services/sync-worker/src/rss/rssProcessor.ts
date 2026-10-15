import type { SupabaseClient } from '@supabase/supabase-js';
import type { RuntimeLogger } from '../logger.js';
import { WorkerTaskError, type TaskProcessor } from '../v1/processors.js';
import { fetchFeed } from './feedFetch.js';
import { normalizeFeed } from './feedNormalize.js';
import { RssStore } from './rssStore.js';

export function createRssProcessor(
    client: SupabaseClient,
    logger: RuntimeLogger,
): TaskProcessor {
    const store = new RssStore(client);
    return async ({ envelope, dryRun }) => {
        if (envelope.task.kind !== 'rss.fetch') {
            throw new WorkerTaskError(
                'rss_invalid_task',
                'RSS processor received an invalid task.',
                false,
            );
        }
        const connection = await store.getConnection(
            envelope.userId,
            envelope.task.connectionId,
        );
        if (!connection || connection.disabled) {
            return { skipped: true, reason: 'source_inactive' };
        }
        await store.markSyncing(connection);
        try {
            const response = await fetchFeed(connection.sourceUrl, {
                etag: connection.etag,
                lastModified: connection.lastModified,
            });
            const fetchedAt = new Date().toISOString();
            const items = response.body
                ? await normalizeFeed(
                      response.body,
                      response.finalUrl,
                      fetchedAt,
                  )
                : [];
            if (!dryRun) {
                for (const item of items)
                    await store.persistItem(connection, item);
            }
            await store.markSuccess(connection, response);
            logger.info('rss source fetched', {
                userId: envelope.userId,
                sourceId: connection.id,
                itemCount: items.length,
                notModified: response.notModified,
            });
            return {
                sourceId: connection.id,
                itemCount: items.length,
                notModified: response.notModified,
                dryRun,
            };
        } catch (error) {
            const taskError =
                error instanceof WorkerTaskError
                    ? error
                    : new WorkerTaskError(
                          'rss_processing_failed',
                          'RSS processing failed.',
                          true,
                      );
            await store.markFailure(
                connection,
                taskError.code,
                taskError.safeDetail,
            );
            throw taskError;
        }
    };
}
