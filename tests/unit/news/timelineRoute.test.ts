import type { SupabaseClient } from '@supabase/supabase-js';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const createClients = vi.fn();
vi.mock('@/lib/supabase/serverClient', () => ({ createClients }));

interface Operation {
    table: string;
    method: string;
    args: unknown[];
}

function timelineRow(id: string, occurredAt: string) {
    return {
        id,
        event_type: 'task.completed',
        source_type: 'internal',
        title: 'Completed task',
        summary: null,
        occurred_at: occurredAt,
        ingested_at: occurredAt,
        updated_at: occurredAt,
        state: 'active',
        revision: 1,
        source_record_table: 'todos',
        source_record_id: 'todo-1',
        metadata: {},
    };
}

function fakeClient(options?: {
    unauthorized?: boolean;
    sourceError?: boolean;
}) {
    const operations: Operation[] = [];
    const timeline = [
        timelineRow(
            '33333333-3333-4333-8333-333333333333',
            '2026-08-19T12:00:00.000Z',
        ),
        timelineRow(
            '22222222-2222-4222-8222-222222222222',
            '2026-08-19T11:00:00.000Z',
        ),
        timelineRow(
            '11111111-1111-4111-8111-111111111111',
            '2026-08-19T10:00:00.000Z',
        ),
    ];
    function builder(table: string) {
        let selection = '';
        const chain: Record<string, unknown> = {
            select(value: string) {
                selection = value;
                operations.push({ table, method: 'select', args: [value] });
                return chain;
            },
            then(resolve: (value: unknown) => void) {
                const isFacet = selection === 'source_type,event_type';
                const value =
                    table === 'integration_connections'
                        ? {
                              data: [],
                              error: options?.sourceError
                                  ? { message: 'health unavailable' }
                                  : null,
                          }
                        : {
                              data: isFacet
                                  ? timeline.map((row) => ({
                                        source_type: row.source_type,
                                        event_type: row.event_type,
                                    }))
                                  : timeline,
                              error: null,
                          };
                return Promise.resolve(value).then(resolve);
            },
        };
        for (const method of [
            'eq',
            'is',
            'in',
            'gt',
            'gte',
            'lte',
            'order',
            'limit',
            'or',
        ]) {
            chain[method] = (...args: unknown[]) => {
                operations.push({ table, method, args });
                return chain;
            };
        }
        return chain;
    }
    const client = {
        auth: {
            getUser: vi.fn().mockResolvedValue({
                data: {
                    user: options?.unauthorized ? null : { id: 'user-a' },
                },
            }),
        },
        from: (table: string) => builder(table),
    } as unknown as SupabaseClient;
    return { client, operations };
}

describe('GET /api/news/feed', () => {
    beforeEach(() => createClients.mockReset());

    it('requires authentication and validates bounded query input', async () => {
        const unauthorized = fakeClient({ unauthorized: true });
        createClients.mockResolvedValue({ supabase: unauthorized.client });
        const { GET } = await import('@/app/api/news/feed/route');
        const response = await GET(
            new Request('https://example.test/api/news/feed'),
        );
        expect(response.status).toBe(401);

        const invalid = await GET(
            new Request('https://example.test/api/news/feed?limit=500'),
        );
        expect(invalid.status).toBe(400);
    });

    it('scopes every query and returns an opaque stable cursor', async () => {
        const fake = fakeClient();
        createClients.mockResolvedValue({ supabase: fake.client });
        const { GET } = await import('@/app/api/news/feed/route');
        const response = await GET(
            new Request('https://example.test/api/news/feed?limit=2'),
        );
        const body = (await response.json()) as {
            items: unknown[];
            nextCursor: string;
        };
        expect(response.status).toBe(200);
        expect(body.items).toHaveLength(2);
        expect(body.nextCursor).not.toContain('user-a');
        expect(
            fake.operations.filter(
                ({ method, args }) =>
                    method === 'eq' &&
                    args[0] === 'user_id' &&
                    args[1] === 'user-a',
            ),
        ).toHaveLength(3);
        expect(
            fake.operations.filter(({ method }) => method === 'order'),
        ).toEqual(
            expect.arrayContaining([
                expect.objectContaining({
                    args: ['occurred_at', { ascending: false }],
                }),
                expect.objectContaining({ args: ['id', { ascending: false }] }),
            ]),
        );

        const next = await GET(
            new Request(
                `https://example.test/api/news/feed?limit=2&cursor=${encodeURIComponent(body.nextCursor)}`,
            ),
        );
        expect(next.status).toBe(200);
        expect(fake.operations.some(({ method }) => method === 'or')).toBe(
            true,
        );
    });

    it('keeps events available when source-health loading fails', async () => {
        const fake = fakeClient({ sourceError: true });
        createClients.mockResolvedValue({ supabase: fake.client });
        const { GET } = await import('@/app/api/news/feed/route');
        const response = await GET(
            new Request('https://example.test/api/news/feed'),
        );
        const body = (await response.json()) as {
            items: unknown[];
            sourceHealthUnavailable: boolean;
        };
        expect(body.items).toHaveLength(3);
        expect(body.sourceHealthUnavailable).toBe(true);
    });
});
