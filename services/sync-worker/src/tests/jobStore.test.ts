import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { V1JobEnvelope } from '../v1/contracts.js';
import { SupabaseJobStore } from '../v1/jobStore.js';

interface FakeClaimQuery {
    update(values: Record<string, unknown>): FakeClaimQuery;
    eq(column: string, value: unknown): FakeClaimQuery;
    or(value: string): FakeClaimQuery;
    select(columns: string): FakeClaimQuery;
    maybeSingle(): Promise<{ data: { id: string }; error: null }>;
}

const job: V1JobEnvelope = {
    version: 1,
    jobId: '10000000-0000-4000-8000-000000000001',
    userId: '20000000-0000-4000-8000-000000000001',
    correlationId: 'lease-test',
    idempotencyKey: 'lease-test',
    queue: 'ingestion',
    task: { kind: 'runtime.probe' },
};

void describe('Supabase canonical job leases', () => {
    void it('allows queued claims and stale running-claim recovery', async () => {
        let claimFilter = '';
        const query: FakeClaimQuery = {
            update: () => query,
            eq: () => query,
            or: (value) => {
                claimFilter = value;
                return query;
            },
            select: () => query,
            maybeSingle: () =>
                Promise.resolve({ data: { id: job.jobId }, error: null }),
        };
        const client = {
            from: () => query,
        } as unknown as SupabaseClient;
        const store = new SupabaseJobStore(client, 150_000);
        assert.equal(await store.claim(job, 2), true);
        assert.match(claimFilter, /status\.eq\.queued/u);
        assert.match(claimFilter, /status\.eq\.running/u);
        assert.match(claimFilter, /started_at\.lt\./u);
    });
});
