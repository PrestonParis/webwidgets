import { NextResponse } from 'next/server';
import { z } from 'zod';
import { trackEventServer } from '@/features/analytics/trackEvent';
import type { EventName } from '@/features/analytics/eventNames';

const schema = z.object({
    type: z.string().min(1).max(100),
    userId: z.string().optional(),
    source: z.string().optional(),
    metadata: z.record(z.string(), z.unknown()).optional(),
});

export async function POST(req: Request) {
    const parsed = schema.safeParse(await req.json());
    if (!parsed.success) {
        return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
    }

    const { type, userId, source, metadata } = parsed.data;

    await trackEventServer({
        type: type as EventName,
        ...(userId !== undefined ? { userId } : {}),
        ...(source !== undefined ? { source } : {}),
        ...(metadata !== undefined ? { metadata } : {}),
    });

    return NextResponse.json({ ok: true });
}
