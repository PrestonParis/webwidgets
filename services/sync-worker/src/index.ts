import { loadWorkerEnv } from './env.js';
import { logger } from './logger.js';
import { startWorkerRuntime } from './runtime.js';

const env = loadWorkerEnv();
if (!env.WORKER_INSTANCE_ID) {
    env.WORKER_INSTANCE_ID =
        process.env.RENDER_INSTANCE_ID ??
        process.env.HOSTNAME ??
        `worker-${process.pid}`;
}

const runtime = await startWorkerRuntime(env, logger);
let shutdownStarted = false;

async function shutdown(signal: string) {
    if (shutdownStarted) return;
    shutdownStarted = true;
    logger.info('worker shutdown started', { signal });
    const timeout = setTimeout(() => {
        logger.error('worker shutdown timed out', { signal });
        process.exit(1);
    }, env.SHUTDOWN_TIMEOUT_MS);
    timeout.unref();
    try {
        await runtime.close();
        clearTimeout(timeout);
        logger.info('worker shutdown completed', { signal });
        process.exit(0);
    } catch {
        clearTimeout(timeout);
        logger.error('worker shutdown failed', { signal });
        process.exit(1);
    }
}

process.once('SIGINT', () => void shutdown('SIGINT'));
process.once('SIGTERM', () => void shutdown('SIGTERM'));
