import type { WorkerEnv } from './env.js';
import { createBriefingProcessor } from './briefings/briefingProcessor.js';
import {
    startBriefingScheduler,
    type BriefingScheduler,
} from './briefings/briefingScheduler.js';
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
import { createActionDispatcher } from './taskActions/actionDispatcher.js';
import { createJobRunner } from './v1/jobRunner.js';
import { SupabaseJobStore } from './v1/jobStore.js';
import { createProcessorRegistry } from './v1/processors.js';
import { enqueueCanonicalJob } from './v1/producer.js';
import { startV1Workers, type V1WorkerSet } from './v1/queues.js';
import {
    startAutomationScheduler,
    type AutomationScheduler,
} from './automation/automationScheduler.js';

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
        'briefing.generate': createBriefingProcessor(env),
        'action.execute': createActionDispatcher(client, env, logger),
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
    let briefingScheduler: BriefingScheduler | undefined;
    let automationScheduler: AutomationScheduler | undefined;
    try {
        if (env.V1_QUEUES_ENABLED) {
            v1Workers = await startV1Workers(env, runner, logger);
            rssScheduler = startRssScheduler(env, client, logger);
            briefingScheduler = startBriefingScheduler(env, client, logger);
            automationScheduler = startAutomationScheduler(env, client, logger);
            if (env.PROVIDER_SYNC_ENABLED) {
                providerScheduler = startProviderScheduler(env, client, logger);
            }
        }
        if (env.EMAIL_SYNC_ENABLED) {
            emailWorkers = await startEmailWorkers(env, client, logger);
        }
        const scheduleConfigured = await configureEmailSchedule(env);
        health = await startHealthServer(
            env,
            store,
            logger,
            (input) =>
                enqueueCanonicalJob(client, env, {
                    userId: input.userId,
                    idempotencyKey: input.idempotencyKey,
                    queue: 'analysis',
                    task: {
                        kind: 'briefing.generate',
                        trigger: input.trigger,
                        coveredFrom: input.coveredFrom,
                        coveredTo: input.coveredTo,
                    },
                    maxAttempts: 3,
                }),
            (input) =>
                enqueueCanonicalJob(client, env, {
                    userId: input.userId,
                    idempotencyKey: input.idempotencyKey,
                    correlationId: input.actionRequestId,
                    queue: 'action',
                    task: {
                        kind: 'action.execute',
                        actionRequestId: input.actionRequestId,
                    },
                    maxAttempts: 3,
                }),
        );
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
                    briefingScheduler?.close(),
                    automationScheduler?.close(),
                    providerScheduler?.close(),
                    v1Workers?.close(),
                    emailWorkers?.close(),
                ]);
            },
        };
    } catch (error) {
        await health?.close().catch(() => undefined);
        await rssScheduler?.close().catch(() => undefined);
        await briefingScheduler?.close().catch(() => undefined);
        await automationScheduler?.close().catch(() => undefined);
        await providerScheduler?.close().catch(() => undefined);
        await v1Workers?.close().catch(() => undefined);
        await emailWorkers?.close().catch(() => undefined);
        throw error;
    }
}
