import { describe, expect, it } from 'vitest';
import {
    parseTimelineQuery,
    timelineFeedResponseSchema,
} from '@/features/news/schemas/timelineFeedSchemas';
import {
    deriveSourceHealth,
    mapTimelineRows,
    safeSourceUrl,
    safeTimelineText,
    type ConnectionHealthRow,
    type TimelineRow,
} from '@/features/news/services/timelineFeed';

const now = new Date('2026-08-19T12:00:00.000Z');

function connection(
    overrides: Partial<ConnectionHealthRow> = {},
): ConnectionHealthRow {
    return {
        id: '11111111-1111-4111-8111-111111111111',
        provider_id: 'rss',
        state: 'connected',
        sync_status: 'idle',
        consecutive_failures: 0,
        last_checked_at: null,
        last_sync_succeeded_at: null,
        next_sync_at: null,
        disabled_at: null,
        disconnected_at: null,
        sync_error_code: null,
        fetch_interval_minutes: 30,
        external_account_id: null,
        source_url: 'https://example.com/feed',
        metadata: {},
        created_at: '2026-08-19T11:30:00.000Z',
        ...overrides,
    };
}

function event(id: string, metadata: Record<string, unknown>): TimelineRow {
    return {
        id,
        event_type: 'rss.item.published',
        source_type: 'rss',
        title: '<b>Safe headline</b>',
        summary: '<script>ignore()</script> Useful summary',
        occurred_at: '2026-08-19T11:00:00.000Z',
        ingested_at: '2026-08-19T11:10:00.000Z',
        updated_at: '2026-08-19T11:10:00.000Z',
        state: 'active',
        revision: 1,
        source_record_table: 'integration_connections',
        source_record_id: 'source-1',
        metadata,
    };
}

describe('timeline feed contract', () => {
    it('accepts database timestamps with UTC offsets', () => {
        expect(
            timelineFeedResponseSchema.safeParse({
                items: [
                    {
                        ...mapTimelineRows([
                            event('11111111-1111-4111-8111-111111111111', {}),
                        ])[0],
                        occurredAt: '2026-08-19T11:00:00+00:00',
                        ingestedAt: '2026-08-19T11:10:00+00:00',
                        updatedAt: '2026-08-19T11:10:00+00:00',
                    },
                ],
                sources: [],
                availableSourceTypes: ['rss'],
                availableEventTypes: ['rss.item.published'],
                generatedAt: '2026-08-19T12:00:00+00:00',
                nextCursor: null,
                hasMore: false,
                sourceHealthUnavailable: false,
            }).success,
        ).toBe(true);
    });

    it('parses bounded filters and rejects invalid values', () => {
        const parsed = parseTimelineQuery(
            new URL(
                'https://example.test/api/news/feed?limit=20&sources=rss,internal&events=task.completed',
            ),
        );
        expect(parsed.limit).toBe(20);
        expect(parsed.sourceTypes).toEqual(['rss', 'internal']);
        expect(() =>
            parseTimelineQuery(
                new URL(
                    'https://example.test/api/news/feed?limit=200&sources=rss%29.or.user_id.neq.x',
                ),
            ),
        ).toThrow();
    });

    it('renders external content as bounded text and allows only web links', () => {
        expect(safeTimelineText('<b>Hello</b>\u0000 world', 100)).toBe(
            'Hello world',
        );
        expect(safeSourceUrl('javascript:alert(1)')).toBeNull();
        const mapped = mapTimelineRows([
            event('11111111-1111-4111-8111-111111111111', {
                publisher: 'Example',
                contentReference: 'https://example.com/story',
            }),
        ]);
        expect(mapped[0]?.title).toBe('Safe headline');
        expect(mapped[0]?.summary).toBe('ignore() Useful summary');
        expect(mapped[0]?.sourceUrl).toBe('https://example.com/story');
    });

    it('exposes related-story relationships without merging events', () => {
        const mapped = mapTimelineRows([
            event('11111111-1111-4111-8111-111111111111', {
                relatedStoryKey: 'cluster-a',
            }),
            event('22222222-2222-4222-8222-222222222222', {
                relatedStoryKey: 'cluster-a',
            }),
        ]);
        expect(mapped).toHaveLength(2);
        expect(mapped[0]?.relatedEvents).toEqual([
            {
                id: '22222222-2222-4222-8222-222222222222',
                title: 'Safe headline',
            },
        ]);
    });

    it('derives every actionable connection-health state', () => {
        expect(deriveSourceHealth(connection(), now)).toBe('connected');
        expect(
            deriveSourceHealth(connection({ sync_status: 'syncing' }), now),
        ).toBe('syncing');
        expect(
            deriveSourceHealth(
                connection({
                    last_sync_succeeded_at: '2026-08-19T11:30:00.000Z',
                }),
                now,
            ),
        ).toBe('healthy');
        expect(
            deriveSourceHealth(
                connection({
                    last_sync_succeeded_at: '2026-08-19T08:00:00.000Z',
                }),
                now,
            ),
        ).toBe('stale');
        expect(
            deriveSourceHealth(connection({ consecutive_failures: 2 }), now),
        ).toBe('failing');
        expect(
            deriveSourceHealth(
                connection({ sync_error_code: 'oauth_token_expired' }),
                now,
            ),
        ).toBe('reconnect_required');
        expect(
            deriveSourceHealth(
                connection({ disabled_at: '2026-08-19T10:00:00.000Z' }),
                now,
            ),
        ).toBe('disabled');
    });
});
