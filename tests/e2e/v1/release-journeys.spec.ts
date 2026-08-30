import { expect, test, type APIResponse } from '@playwright/test';
import {
    countFixtureTasks,
    createReleaseFixture,
    destroyReleaseFixture,
    seedCommitment,
    signIn,
    type ReleaseFixture,
} from './releaseFixture';

interface Candidate {
    id: string;
    payload: Record<string, unknown>;
    payloadHash: string;
    payloadVersion: number;
    state: string;
    execution: null | {
        status: string;
        taskId: string | null;
        verificationStatus: string | null;
    };
}

interface AutomationCenter {
    instances: Array<{
        id: string;
        definition: { id: string };
        status: string;
    }>;
    runs: Array<{
        id: string;
        status: string;
        triggeredBy: string;
    }>;
}

async function json<T>(response: APIResponse): Promise<T> {
    if (!response.ok())
        throw new Error(
            `Request failed with ${response.status()}: ${await response.text()}`,
        );
    return response.json() as Promise<T>;
}

test.describe.serial('WebWidgets V1 release journeys', () => {
    let fixture: ReleaseFixture;

    test.beforeAll(async () => {
        fixture = await createReleaseFixture();
    });

    test.afterAll(async () => {
        await destroyReleaseFixture(fixture);
    });

    test.beforeEach(async ({ page }) => {
        await signIn(page, fixture);
    });

    test('timeline and briefing preserve healthy data during a source failure', async ({
        page,
    }) => {
        test.setTimeout(300_000);
        await json(
            await page.request.post('/api/integrations/rss', {
                data: { url: fixture.feedUrl, fetchIntervalMinutes: 15 },
            }),
        );
        await json(
            await page.request.post('/api/integrations/rss', {
                data: { url: fixture.failedFeedUrl, fetchIntervalMinutes: 15 },
            }),
        );
        const task = await fixture.admin.from('todos').insert({
            user_id: fixture.userId,
            text: 'Synthetic personal timeline fixture',
        });
        if (task.error) throw task.error;

        await expect
            .poll(
                async () => {
                    const response = await page.request.get(
                        '/api/news/feed?limit=25',
                    );
                    if (!response.ok()) return null;
                    const feed = (await response.json()) as {
                        items: Array<{ sourceType: string }>;
                        sources: Array<{ health: string }>;
                    };
                    return {
                        hasPersonal: feed.items.some(
                            (item) => item.sourceType === 'internal_task',
                        ),
                        hasRss: feed.items.some(
                            (item) => item.sourceType === 'rss',
                        ),
                        healthy: feed.sources.some(
                            (source) => source.health === 'healthy',
                        ),
                        failed: feed.sources.some((source) =>
                            ['failing', 'stale'].includes(source.health),
                        ),
                    };
                },
                { timeout: 240_000 },
            )
            .toEqual({
                hasPersonal: true,
                hasRss: true,
                healthy: true,
                failed: true,
            });

        await json(
            await page.request.post('/api/briefings', {
                data: { windowHours: 168 },
            }),
        );
        await expect
            .poll(
                async () => {
                    const response = await page.request.get('/api/briefings');
                    if (!response.ok()) return null;
                    const result = (await response.json()) as {
                        briefing: null | {
                            status: string;
                            warnings: string[];
                            items: Array<{ evidence: unknown[] }>;
                        };
                    };
                    const briefing = result.briefing;
                    return briefing &&
                        ['ready', 'partial'].includes(briefing.status)
                        ? {
                              cited: briefing.items.every(
                                  (item) => item.evidence.length > 0,
                              ),
                              warned: briefing.warnings.length > 0,
                          }
                        : null;
                },
                { timeout: 240_000 },
            )
            .toEqual({ cited: true, warned: true });
        await page.goto('/news');
        await expect(page.getByText('Timeline Intelligence')).toBeVisible();
        await expect(page.getByText(/source needs attention/)).toBeVisible();
        await expect(page.getByText(/Evidence:/).first()).toBeVisible();
    });

    test('dated commitment creates and completes exactly one task', async ({
        page,
    }) => {
        test.setTimeout(240_000);
        await seedCommitment(fixture);
        await json(
            await page.request.post('/api/commitment-candidates', {
                data: { lookbackDays: 2 },
            }),
        );
        const readCandidates = async () => {
            const result = await json<{ candidates: Candidate[] }>(
                await page.request.get('/api/commitment-candidates'),
            );
            return result.candidates;
        };
        const candidate = (await readCandidates())[0];
        expect(candidate).toBeDefined();
        const editedPayload = {
            ...candidate!.payload,
            title: 'Submit the verified V1 release report',
        };
        await json(
            await page.request.patch(
                `/api/commitment-candidates/${candidate!.id}`,
                {
                    data: {
                        decision: 'edit',
                        expectedVersion: candidate!.payloadVersion,
                        kind: 'task',
                        payload: editedPayload,
                    },
                },
            ),
        );
        const edited = (await readCandidates()).find(
            (item) => item.id === candidate!.id,
        )!;
        await json(
            await page.request.patch(
                `/api/commitment-candidates/${edited.id}`,
                {
                    data: {
                        decision: 'approve',
                        expectedVersion: edited.payloadVersion,
                        expectedHash: edited.payloadHash,
                    },
                },
            ),
        );
        await expect
            .poll(async () => {
                const current = (await readCandidates()).find(
                    (item) => item.id === edited.id,
                );
                return current?.execution;
            })
            .toMatchObject({
                status: 'completed',
                verificationStatus: 'verified',
            });
        const completedCandidate = (await readCandidates()).find(
            (item) => item.id === edited.id,
        )!;
        const taskId = completedCandidate.execution!.taskId!;
        await json(
            await page.request.patch(`/api/todos/${taskId}`, {
                data: { completed: true },
            }),
        );
        await page.request.post('/api/commitment-candidates', {
            data: { lookbackDays: 2 },
        });
        await page.request.patch(`/api/commitment-candidates/${edited.id}`, {
            data: {
                decision: 'approve',
                expectedVersion: edited.payloadVersion,
                expectedHash: edited.payloadHash,
            },
        });
        expect(await countFixtureTasks(fixture)).toBe(1);
        await page.goto('/news');
        await expect(page.getByText(/Task verified/)).toBeVisible();
        await expect(
            page.getByText('Task completed', { exact: false }),
        ).toBeVisible();
    });

    test('bounded automation records runs and pause blocks execution', async ({
        page,
    }) => {
        const command = (data: Record<string, unknown>) =>
            page.request.post('/api/automation-center', { data });
        await json(
            await command({
                command: 'create_template',
                definitionId: 'v1.stale-task-review',
                localTime: '09:00',
                timezone: 'UTC',
                dryRun: true,
            }),
        );
        const center = await json<AutomationCenter>(
            await page.request.get('/api/automation-center'),
        );
        const instance = center.instances.find(
            (item) => item.definition.id === 'v1.stale-task-review',
        )!;
        await json(
            await command({
                command: 'trigger',
                id: instance.id,
                dryRun: true,
            }),
        );
        await json(
            await command({
                command: 'configure',
                id: instance.id,
                localTime: '09:00',
                timezone: 'UTC',
                dryRun: false,
            }),
        );
        await json(
            await command({
                command: 'set_state',
                id: instance.id,
                enabled: true,
            }),
        );
        await json(await command({ command: 'trigger', id: instance.id }));
        await json(await command({ command: 'pause_all', enabled: false }));
        await json(await command({ command: 'trigger', id: instance.id }));
        const final = await json<AutomationCenter>(
            await page.request.get('/api/automation-center'),
        );
        expect(final.runs.map((run) => run.status)).toEqual(
            expect.arrayContaining(['completed', 'skipped']),
        );
        await page.goto('/automation');
        await page.getByRole('button', { name: 'Run history' }).click();
        await expect(page.getByText('Completed').first()).toBeVisible();
        await expect(page.getByText('Skipped').first()).toBeVisible();
        await expect(page.getByText('Automations paused')).toBeVisible();
    });
});
