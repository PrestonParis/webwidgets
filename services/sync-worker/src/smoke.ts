import { loadWorkerEnv } from './env.js';
import { createWorkerSupabase } from './lib/supabase.js';
import { logger } from './logger.js';
import { enqueueCanonicalJob } from './v1/producer.js';

const env = loadWorkerEnv();
if (!env.SMOKE_USER_ID || !env.SMOKE_IDEMPOTENCY_KEY) {
    throw new Error('SMOKE_USER_ID and SMOKE_IDEMPOTENCY_KEY are required');
}

const client = createWorkerSupabase(env);
const jobId = await enqueueCanonicalJob(client, env, {
    userId: env.SMOKE_USER_ID,
    idempotencyKey: env.SMOKE_IDEMPOTENCY_KEY,
    queue: 'schedule',
    task: { kind: 'runtime.probe' },
});
logger.info('runtime probe enqueued', {
    jobId,
    userId: env.SMOKE_USER_ID,
});

const deadline = Date.now() + 30_000;
let status = 'queued';
while (Date.now() < deadline) {
    const result = await client
        .from('jobs')
        .select('status')
        .eq('id', jobId)
        .eq('user_id', env.SMOKE_USER_ID)
        .single();
    if (result.error) throw new Error('Runtime probe status lookup failed');
    status = String(result.data.status);
    if (status === 'completed') break;
    if (status === 'dead_lettered' || status === 'failed') break;
    await new Promise((resolve) => setTimeout(resolve, 500));
}
if (status !== 'completed') {
    throw new Error(`Runtime probe did not complete: ${status}`);
}
logger.info('runtime probe completed', { jobId, userId: env.SMOKE_USER_ID });
