import { getLogger } from '@/lib/observability/logger';
import {
    newsQueueJobSchema,
    type NewsQueueJob,
} from '@/features/news/schemas/ingestionSchemas';

export function enqueueNewsJob(job: NewsQueueJob) {
    const parsed = newsQueueJobSchema.parse(job);
    getLogger({ component: 'news-queue' }).warn(
        { jobType: parsed.type },
        'News ingestion is unavailable until the canonical Prompt 006 processor is deployed',
    );
    return Promise.resolve({
        queued: false as const,
        reason: 'v1-processor-unavailable' as const,
    });
}
