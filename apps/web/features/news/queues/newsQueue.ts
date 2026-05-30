import { Queue, Worker, type JobsOptions } from 'bullmq';
import IORedis from 'ioredis';
import { getLogger } from '@/lib/observability/logger';
import { ingestRssFeed } from '@/features/news/ingestion/rssAdapter';
import { normalizeNewsEvent } from '@/features/news/normalization/normalizeNewsEvent';
import {
    newsQueueJobSchema,
    type NewsQueueJob,
} from '@/features/news/schemas/ingestionSchemas';
import { createAdminClient } from '@/lib/supabase/adminClient';
import { publishNewsIngestedEvent } from '@/features/activity/integrations/newsActivityPublisher';

const queueName = 'news-event-ingestion';
const defaultJobOptions: JobsOptions = {
    attempts: 3,
    backoff: { type: 'exponential', delay: 2_000 },
    removeOnComplete: 100,
    removeOnFail: 500,
};

let connection: IORedis | null = null;
let queue: Queue<NewsQueueJob> | null = null;

function getRedisConnection() {
    if (!process.env.REDIS_URL) return null;
    if (!connection) {
        connection = new IORedis(process.env.REDIS_URL, {
            maxRetriesPerRequest: null,
            enableOfflineQueue: false,
            retryStrategy: (times) =>
                times > 3 ? null : Math.min(times * 200, 2000),
        });
        connection.on('error', () => {});
    }
    if (connection.status === 'end') return null;
    return connection;
}

export function getNewsQueue() {
    const redis = getRedisConnection();
    if (!redis) return null;
    queue ??= new Queue<NewsQueueJob>(queueName, {
        connection: redis,
        defaultJobOptions,
    });
    return queue;
}

export async function enqueueNewsJob(job: NewsQueueJob) {
    const parsed = newsQueueJobSchema.parse(job);
    const newsQueue = getNewsQueue();
    if (!newsQueue) {
        getLogger({ component: 'news-queue' }).warn(
            { jobType: parsed.type },
            'REDIS_URL missing; queue job not enqueued',
        );
        return { queued: false as const, reason: 'missing-redis-url' };
    }
    try {
        await newsQueue.add(parsed.type, parsed);
        return { queued: true as const };
    } catch (error) {
        getLogger({ component: 'news-queue' }).warn(
            { err: error, jobType: parsed.type },
            'News queue unavailable; job not enqueued',
        );
        return { queued: false as const, reason: 'redis_unavailable' };
    }
}

export function createNewsWorker() {
    const redis = getRedisConnection();
    if (!redis) return null;
    const log = getLogger({ component: 'news-worker' });

    const worker = new Worker<NewsQueueJob>(
        queueName,
        async (job) => {
            const data = newsQueueJobSchema.parse(job.data);
            const jobLog = log.child({ jobId: job.id, jobType: data.type });

            if (data.type === 'ingestRssFeed') {
                const rawEvents = await ingestRssFeed(
                    data.providerId,
                    data.url,
                );
                jobLog.info(
                    { rawEventCount: rawEvents.length },
                    'rss ingest complete',
                );

                // Publish platform activity event if we have a user context.
                // Uses the service-role admin client — safe for worker context.
                if (data.requestedBy) {
                    const adminSupabase = createAdminClient();
                    await publishNewsIngestedEvent(
                        adminSupabase,
                        data.requestedBy,
                        {
                            feedUrl: data.url,
                            feedName: data.providerId,
                            articleCount: rawEvents.length,
                            jobId: job.id,
                        },
                    );
                }

                return rawEvents;
            }

            if (data.type === 'normalizeEvent') {
                const result = normalizeNewsEvent(data.rawEvent);
                if (result.isErr()) throw new Error(result.error.message);
                jobLog.info({ eventId: result.value.id }, 'event normalized');
                return result.value;
            }

            if (data.type === 'enrichEvent') {
                jobLog.info(
                    { eventId: data.eventId },
                    'ai enrichment job accepted',
                );
                return { eventId: data.eventId, status: 'queued' };
            }

            jobLog.info({ scope: data.scope }, 'ranking refresh job accepted');
            return { scope: data.scope, status: 'queued' };
        },
        { connection: redis },
    );

    worker.on('failed', (job, error) => {
        log.error(
            { err: error, jobId: job?.id, jobType: job?.name },
            'news queue job failed',
        );
    });

    return worker;
}
