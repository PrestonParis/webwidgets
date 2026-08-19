import type { WorkerEnv } from './env.js';
import {
    configureEmailSchedule,
    startEmailWorkers,
    type EmailWorkerSet,
} from './emailRuntime.js';
import { startHealthServer, type RuntimeHealth } from './health.js';
import { createWorkerSupabase } from './lib/supabase.js';
import type { RuntimeLogger } from './logger.js';
import { createProviderProcessor } from './provider/providerProcessor.js';
import {
    startProviderScheduler,
    type ProviderScheduler,
} from './provider/providerScheduler.js';
import { createRssProcessor } from './rss/rssProcessor.js';
import { startRssScheduler, type RssScheduler } from './rss/rssScheduler.js';
import { createJobRunner } from './v1/jobRunner.js';
import { SupabaseJobStore } from './v1/jobStore.js';
import { createProcessorRegistry } from './v1/processors.js';
import { startV1Workers, type V1WorkerSet } from './v1/queues.js';

export interface RunningWorkerRuntime {
    workerNames: string[];
    health: RuntimeHealth;
    close(): Promise<void>;
}

export async function startWorkerRuntime(
    env: WorkerEnv,
    logger: RuntimeLogger,
): Promise<RunningWorkerRuntime> {
    const client = createWorkerSupabase(env);
    const store = new SupabaseJobStore(client, env.JOB_TIMEOUT_MS + 30_000);
    const processors = createProcessorRegistry({
        'rss.fetch': createRssProcessor(client, logger),
        'provider.sync': createProviderProcessor(client, env, logger),
    });
    const runner = createJobRunner({
        store,
        processors,
        logger,
        dryRun: env.WORKER_DRY_RUN,
        timeoutMs: env.JOB_TIMEOUT_MS,
    });
    let v1Workers: V1WorkerSet | undefined;
    let emailWorkers: EmailWorkerSet | undefined;
    let health: RuntimeHealth | undefined;
    let rssScheduler: RssScheduler | undefined;
    let providerScheduler: ProviderScheduler | undefined;
    try {
        if (env.V1_QUEUES_ENABLED) {
            v1Workers = await startV1Workers(env, runner, logger);
            rssScheduler = startRssScheduler(env, client, logger);
            if (env.PROVIDER_SYNC_ENABLED) {
                providerScheduler = startProviderScheduler(env, client, logger);
            }
        }
        if (env.EMAIL_SYNC_ENABLED) {
            emailWorkers = await startEmailWorkers(env, client, logger);
        }
        const scheduleConfigured = await configureEmailSchedule(env);
        health = await startHealthServer(env, store, logger);
        const readiness = await health.checkReadiness();
        if (!readiness.ready) throw new Error('Runtime dependencies not ready');
        const workerNames = [
            ...(v1Workers?.names ?? []),
            ...(emailWorkers?.names ?? []),
        ];
        logger.info('v1 worker runtime started', {
            workerCount: workerNames.length,
            dryRun: env.WORKER_DRY_RUN,
            emailSyncEnabled: env.EMAIL_SYNC_ENABLED,
            providerSyncEnabled: env.PROVIDER_SYNC_ENABLED,
            scheduleOwner: env.SCHEDULE_OWNER,
            scheduleConfigured,
        });
        return {
            workerNames,
            health,
            close: async () => {
                await health?.close();
                await Promise.all([
                    rssScheduler?.close(),
                    providerScheduler?.close(),
                    v1Workers?.close(),
                    emailWorkers?.close(),
                ]);
            },
        };
    } catch (error) {
        await health?.close().catch(() => undefined);
        await rssScheduler?.close().catch(() => undefined);
        await providerScheduler?.close().catch(() => undefined);
        await v1Workers?.close().catch(() => undefined);
        await emailWorkers?.close().catch(() => undefined);
        throw error;
    }
}
