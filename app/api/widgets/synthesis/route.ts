import { NextResponse } from 'next/server';
import superjson from 'superjson';
import { z } from 'zod';
import { synthesizeWidgetFromQuery } from '@/features/widgets/synthesis/widgetSearchSynthesis';
import { planWidgetSynthesis } from '@/features/widgets/synthesis/engine/synthesisPlanner';

const requestSchema = z.object({
    query: z.string().min(1).max(500),
});

export async function POST(request: Request) {
    const parsed = requestSchema.safeParse(await request.json());
    if (!parsed.success)
        return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
    return NextResponse.json(
        superjson.serialize({
            plan: planWidgetSynthesis(parsed.data.query),
            candidates: synthesizeWidgetFromQuery(parsed.data.query),
        }),
    );
}
