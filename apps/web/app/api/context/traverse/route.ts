import { NextResponse } from 'next/server';
import { z } from 'zod';
import { createClients } from '@/lib/supabase/serverClient';
import { omitUndefined } from '@/features/backend/lib/exactOptional';
import { getRequestUserId } from '@/features/backend/lib/requestUser';
import { traverseContextGraph } from '@/features/context/services/contextTraversalService';

const bodySchema = z.object({
    startEntityId: z.string().min(1),
    maxDepth: z.number().int().min(1).max(4).optional(),
    direction: z.enum(['inbound', 'outbound', 'both']).optional(),
    nodeTypes: z.array(z.string()).optional(),
    edgeKinds: z.array(z.string()).optional(),
});

export async function POST(req: Request) {
    try {
        const { supabase } = await createClients();
        const userId = await getRequestUserId(supabase);
        const parsed = bodySchema.safeParse(await req.json());
        if (!parsed.success)
            return NextResponse.json(
                { error: 'Invalid payload' },
                { status: 400 },
            );
        const graph = await traverseContextGraph(
            supabase,
            userId,
            parsed.data.startEntityId,
            omitUndefined({
                maxDepth: parsed.data.maxDepth,
                direction: parsed.data.direction,
                nodeTypes: parsed.data.nodeTypes,
                edgeKinds: parsed.data.edgeKinds,
            }),
        );
        return NextResponse.json(graph);
    } catch (err) {
        const msg = err instanceof Error ? err.message : 'Unknown error';
        return NextResponse.json({ error: msg }, { status: 500 });
    }
}
