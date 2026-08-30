import { createHash, randomUUID } from 'node:crypto';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { expect, type Page } from '@playwright/test';

export interface ReleaseFixture {
    admin: SupabaseClient;
    userId: string;
    email: string;
    password: string;
    baseUrl: string;
    feedUrl: string;
    failedFeedUrl: string;
}

function required(name: string) {
    const value = process.env[name];
    if (!value) throw new Error(`Prompt 19 requires ${name}`);
    return value;
}

export async function createReleaseFixture(): Promise<ReleaseFixture> {
    const baseUrl = required('BASE_URL');
    const supabaseUrl =
        process.env.V1_E2E_SUPABASE_URL ?? required('NEXT_PUBLIC_SUPABASE_URL');
    const serviceRoleKey =
        process.env.V1_E2E_SERVICE_ROLE_KEY ??
        required('SUPABASE_SERVICE_ROLE_KEY');
    const admin = createClient(supabaseUrl, serviceRoleKey, {
        auth: { autoRefreshToken: false, persistSession: false },
    });
    const suffix = randomUUID();
    const email = `v1-release-${suffix}@example.invalid`;
    const password = `V1-${suffix}-release-proof`;
    const created = await admin.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: { controlledReleaseFixture: true },
    });
    if (created.error || !created.data.user)
        throw created.error ?? new Error('Fixture user creation failed');
    const consent = await admin.from('consent_records').insert([
        {
            user_id: created.data.user.id,
            category: 'intelligence',
            scope: 'timeline_analysis',
            state: 'granted',
            granted_at: new Date().toISOString(),
        },
        {
            user_id: created.data.user.id,
            category: 'integration',
            scope: 'email_access',
            state: 'granted',
            granted_at: new Date().toISOString(),
        },
    ]);
    if (consent.error) {
        await admin.auth.admin.deleteUser(created.data.user.id, true);
        throw consent.error;
    }
    return {
        admin,
        userId: created.data.user.id,
        email,
        password,
        baseUrl,
        feedUrl:
            process.env.V1_E2E_FEED_URL ??
            new URL('/v1-fixtures/release-feed.xml', baseUrl).toString(),
        failedFeedUrl:
            process.env.V1_E2E_FAILED_FEED_URL ??
            new URL('/v1-fixtures/missing-feed.xml', baseUrl).toString(),
    };
}

export async function destroyReleaseFixture(fixture: ReleaseFixture) {
    const result = await fixture.admin.auth.admin.deleteUser(fixture.userId);
    if (!result.error) return;
    const fallback = await fixture.admin.auth.admin.deleteUser(
        fixture.userId,
        true,
    );
    if (fallback.error) throw fallback.error;
}

export async function signIn(page: Page, fixture: ReleaseFixture) {
    await page.goto('/');
    await page.getByPlaceholder('Email address').fill(fixture.email);
    await page.getByPlaceholder('Password').fill(fixture.password);
    await page.getByRole('button', { name: 'Sign in' }).click();
    await expect(page.getByPlaceholder('Email address')).toBeHidden();
    await expect
        .poll(async () =>
            (await page.request.get('/api/news/feed?limit=1')).status(),
        )
        .toBe(200);
}

export async function seedCommitment(fixture: ReleaseFixture) {
    const observationId = randomUUID();
    const timelineId = randomUUID();
    const tomorrow = new Date(Date.now() + 86_400_000)
        .toISOString()
        .slice(0, 10);
    const observation = await fixture.admin.from('raw_observations').insert({
        id: observationId,
        user_id: fixture.userId,
        source_type: 'gmail',
        source_key: 'v1-release-fixture',
        provider_object_id: `fixture-${timelineId}`,
        provider_version: '1',
        event_type: 'email.received',
        idempotency_key: `v1-release-observation:${timelineId}`,
        payload_hash: createHash('sha256').update(timelineId).digest('hex'),
        occurred_at: new Date().toISOString(),
        normalized_at: new Date().toISOString(),
        normalization_version: 'v1-release-fixture',
        status: 'normalized',
    });
    if (observation.error) throw observation.error;
    const timeline = await fixture.admin.from('timeline_events').insert({
        id: timelineId,
        user_id: fixture.userId,
        observation_id: observationId,
        idempotency_key: `v1-release-timeline:${timelineId}`,
        event_type: 'email.received',
        source_type: 'gmail',
        title: `Please submit the V1 report by ${tomorrow}`,
        summary: 'Synthetic dated commitment for release verification.',
        content_hash: createHash('sha256')
            .update(`timeline:${timelineId}`)
            .digest('hex'),
        occurred_at: new Date().toISOString(),
        normalization_version: 'v1-release-fixture',
        metadata: { contentReference: 'fixture://v1-release' },
    });
    if (timeline.error) throw timeline.error;
    return timelineId;
}

export async function countFixtureTasks(fixture: ReleaseFixture) {
    const result = await fixture.admin
        .from('todos')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', fixture.userId)
        .not('source_action_request_id', 'is', null);
    if (result.error) throw result.error;
    return result.count ?? 0;
}
