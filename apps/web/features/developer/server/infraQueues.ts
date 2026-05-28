import fs from 'node:fs/promises';
import path from 'node:path';
import { Queue } from 'bullmq';
import IORedis from 'ioredis';
import Docker from 'dockerode';
import type {
    ContainerSnapshot,
    CronJobDefinition,
    QueueSnapshot,
} from '@/features/developer/schemas/infrastructureSchemas';
import { checkedAt, pathExists } from './infraUtils';

const root = process.cwd();

async function getQueueCounts(name: string): Promise<QueueSnapshot> {
    const now = checkedAt();
    if (!process.env.REDIS_URL) {
        return {
            name,
            status: 'unavailable',
            adapter: 'BullMQ',
            detail: 'REDIS_URL is not configured.',
            checkedAt: now,
            unavailableReason: 'not_configured',
        };
    }
    const connection = new IORedis(process.env.REDIS_URL, {
        maxRetriesPerRequest: null,
        lazyConnect: true,
        enableOfflineQueue: false,
        retryStrategy: (times) =>
            times > 3 ? null : Math.min(times * 200, 2000),
    });
    connection.on('error', () => {});
    const queue = new Queue(name, { connection });
    try {
        await connection.connect();
        const counts = await queue.getJobCounts(
            'waiting',
            'active',
            'completed',
            'failed',
            'delayed',
            'paused',
        );
        return {
            name,
            status: (counts.failed ?? 0) > 0 ? 'degraded' : 'healthy',
            adapter: 'BullMQ',
            counts: {
                waiting: counts.waiting ?? 0,
                active: counts.active ?? 0,
                completed: counts.completed ?? 0,
                failed: counts.failed ?? 0,
                delayed: counts.delayed ?? 0,
                paused: counts.paused ?? 0,
            },
            checkedAt: now,
        };
    } catch (error) {
        return {
            name,
            status: 'unhealthy',
            adapter: 'BullMQ',
            detail:
                error instanceof Error
                    ? error.message
                    : 'Unable to connect to Redis.',
            checkedAt: now,
            unavailableReason: 'runtime_unreachable',
        };
    } finally {
        await queue.close().catch(() => undefined);
        await connection.quit().catch(() => undefined);
    }
}

export async function getQueues(): Promise<QueueSnapshot[]> {
    return Promise.all([
        getQueueCounts('unified-action-engine'),
        getQueueCounts('news-event-ingestion'),
    ]);
}

export async function getCronJobs(): Promise<CronJobDefinition[]> {
    const vercelPath = path.join(root, 'vercel.json');
    if (!(await pathExists(vercelPath))) {
        return [
            {
                id: 'vercel-cron',
                source: 'vercel.json',
                status: 'unavailable',
                detail: 'No vercel.json file found.',
            },
        ];
    }
    const parsed = JSON.parse(await fs.readFile(vercelPath, 'utf8')) as {
        crons?: Array<{ path: string; schedule: string }>;
    };
    if (!parsed.crons?.length) {
        return [
            {
                id: 'vercel-cron',
                source: 'vercel.json',
                status: 'unavailable',
                detail: 'No Vercel cron entries are registered.',
            },
        ];
    }
    return parsed.crons.map((cron) => ({
        id: cron.path,
        source: 'vercel.json',
        status: 'healthy',
        schedule: cron.schedule,
        endpoint: cron.path,
    }));
}

export async function getContainers(): Promise<ContainerSnapshot[]> {
    const now = checkedAt();
    try {
        const docker = new Docker();
        const containers = await docker.listContainers({ all: true });
        return containers.map((container) => ({
            id: container.Id,
            name:
                container.Names[0]?.replace(/^\//, '') ??
                container.Id.slice(0, 12),
            image: container.Image,
            status: container.State === 'running' ? 'healthy' : 'degraded',
            state: container.State,
            ports: container.Ports.map((port) =>
                port.PublicPort
                    ? `${port.PrivatePort}->${port.PublicPort}/${port.Type}`
                    : `${port.PrivatePort}/${port.Type}`,
            ),
            checkedAt: now,
        }));
    } catch {
        return [];
    }
}
