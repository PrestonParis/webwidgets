import {
    rawSourceEventSchema,
    type RawSourceEvent,
} from '@/features/news/schemas/eventSchemas';

export function createInternalNewsEvent(
    payload: Record<string, unknown>,
): RawSourceEvent {
    const fetchedAt = new Date().toISOString();
    return rawSourceEventSchema.parse({
        source: 'internal',
        providerId: 'webwidgets-internal',
        sourceEventId: String(payload.id ?? crypto.randomUUID()),
        fetchedAt,
        payload,
        reliability: {
            score: 1,
            lastSuccessfulIngestAt: fetchedAt,
            failureCount: 0,
        },
    });
}
