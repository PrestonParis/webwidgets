import type { SupabaseClient } from '@supabase/supabase-js';
import type { WorkerEnv } from '../env.js';
import type { RuntimeLogger } from '../logger.js';
import { enqueueCanonicalJob } from '../v1/producer.js';

interface DueSource {
    id: string;
    user_id: string;
    next_sync_at: string | null;
}

export interface RssScheduler {
    close(): Promise<void>;
}

export function startRssScheduler(
    env: WorkerEnv,
    client: SupabaseClient,
    logger: RuntimeLogger,
): RssScheduler {
    let stopped = false;
    let running = false;
    const scan = async () => {
        if (stopped || running) return;
        running = true;
        try {
            const now = new Date().toISOString();
            const result = await client
                .from('integration_connections')
                .select('id,user_id,next_sync_at')
                .eq('provider_id', 'rss')
                .is('disabled_at', null)
                .is('disconnected_at', null)
                .in('sync_status', ['scheduled', 'healthy', 'degraded'])
                .lte('next_sync_at', now)
                .order('next_sync_at', { ascending: true })
                .limit(env.RSS_SCHEDULE_BATCH_SIZE);
            if (result.error) throw result.error;
            for (const source of (result.data ?? []) as DueSource[]) {
                const dueAt = source.next_sync_at ?? now;
                await enqueueCanonicalJob(client, env, {
                    userId: source.user_id,
                    idempotencyKey: `rss-fetch:${source.id}:${dueAt}`,
                    queue: 'ingestion',
                    task: { kind: 'rss.fetch', connectionId: source.id },
                    maxAttempts: 3,
                });
            }
        } catch {
            logger.error('rss schedule scan failed');
        } finally {
            running = false;
        }
    };
    const timer = setInterval(() => void scan(), env.RSS_SCHEDULE_INTERVAL_MS);
    timer.unref();
    void scan();
    return {
        close: async () => {
            stopped = true;
            clearInterval(timer);
            while (running)
                await new Promise((resolve) => setTimeout(resolve, 10));
        },
    };
}
