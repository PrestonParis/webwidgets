import { NextResponse, after } from 'next/server';
import { z } from 'zod';
import { trackEventServer } from '@/features/analytics/hooks/trackEvent';
import type { EventName } from '@/features/analytics/lib/eventNames';
import { getGoWorkerClient } from '@/lib/goWorker/client';
import type { GoWorkerEvent } from '@/lib/goWorker/types';

// Module-level singleton — avoids re-instantiation on every warm request
const goWorker = getGoWorkerClient();

const schema = z.object({
    type: z.string().min(1).max(100),
    userId: z.string().optional(),
    source: z.string().optional(),
    metadata: z.record(z.string(), z.unknown()).optional(),
});

const batchSchema = z.object({
    events: z.array(schema).max(50),
});

export async function POST(req: Request) {
    const payload: unknown = await req.json();
    const parsedBatch = batchSchema.safeParse(payload);
    const events = parsedBatch.success
        ? parsedBatch.data.events
        : schema.safeParse(payload).success
          ? [schema.parse(payload)]
          : null;

    if (!events) {
        return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
    }

    // Respond immediately, do all writes after the response is sent
    after(async () => {
        if (goWorker.isEnabled()) {
            try {
                const goEvents: GoWorkerEvent[] = events.map((e) => {
                    const event: GoWorkerEvent = { type: e.type };
                    if (e.userId !== undefined) event.user_id = e.userId;
                    if (e.source !== undefined) event.source = e.source;
                    if (e.metadata !== undefined) event.metadata = e.metadata;
                    return event;
                });
                await goWorker.ingestEvents({ events: goEvents });
            } catch (error) {
                console.error('[analytics] Go worker ingest failed:', error);
            }
        }

        await Promise.all(
            events.map(({ type, userId, source, metadata }) =>
                trackEventServer({
                    type: type as EventName,
                    ...(userId !== undefined ? { userId } : {}),
                    ...(source !== undefined ? { source } : {}),
                    ...(metadata !== undefined ? { metadata } : {}),
                }),
            ),
        );
    });

    return NextResponse.json({ ok: true });
}
