import { rawSourceEventSchema } from '@/features/news/schemas/eventCoreSchemas';
import type { RawSourceEvent } from '@/features/news/types/events';

export function createInternalNewsEvent(
    payload: Record<string, unknown>,
): RawSourceEvent {
    const fetchedAt = new Date().toISOString();
    const payloadId = payload.id;
    return rawSourceEventSchema.parse({
        source: 'internal',
        providerId: 'webwidgets-internal',
        sourceEventId:
            typeof payloadId === 'string' || typeof payloadId === 'number'
                ? String(payloadId)
                : crypto.randomUUID(),
        fetchedAt,
        payload,
        reliability: {
            score: 1,
            lastSuccessfulIngestAt: fetchedAt,
            failureCount: 0,
        },
    });
}
