import { NextResponse } from 'next/server';
import { z } from 'zod';
import { createClients } from '@/lib/supabase/serverClient';
import { getRequestUserId } from '@/features/backend/lib/requestUser';
import { buildContextBundle } from '@/features/context/services/contextBundleService';
import type { ContextBundleOptions } from '@/features/context/services/contextBundleService';
import type { SupabaseClient } from '@supabase/supabase-js';

const bodySchema = z.object({
    query: z.string().optional(),
    consumer: z
        .enum(['chat', 'widget', 'automation', 'file', 'generic'])
        .optional(),
    maxNodes: z.number().int().min(1).max(100).optional(),
    maxPromptChars: z.number().int().min(500).max(20000).optional(),
    nodeTypes: z.array(z.string()).optional(),
    edgeKinds: z.array(z.string()).optional(),
});

function cleanBundleOptions(
    data: z.infer<typeof bodySchema>,
): ContextBundleOptions {
    return {
        ...(data.query !== undefined ? { query: data.query } : {}),
        ...(data.consumer !== undefined ? { consumer: data.consumer } : {}),
        ...(data.maxNodes !== undefined ? { maxNodes: data.maxNodes } : {}),
        ...(data.maxPromptChars !== undefined
            ? { maxPromptChars: data.maxPromptChars }
            : {}),
        ...(data.nodeTypes !== undefined ? { nodeTypes: data.nodeTypes } : {}),
        ...(data.edgeKinds !== undefined ? { edgeKinds: data.edgeKinds } : {}),
    };
}

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
        const bundle = await buildContextBundle(
            supabase as unknown as SupabaseClient,
            userId,
            cleanBundleOptions(parsed.data),
        );
        return NextResponse.json({ bundle });
    } catch (err) {
        const msg = err instanceof Error ? err.message : 'Unknown error';
        return NextResponse.json({ error: msg }, { status: 500 });
    }
}
