import { NextResponse } from 'next/server';
import { z } from 'zod';
import { createClients } from '@/lib/supabase/serverClient';
import { getRequestUserId } from '@/features/backend/lib/requestUser';
import {
    createKnowledgeItemForUser,
    listKnowledgeItemsForUser,
} from '@/features/knowledge/services/knowledgeService';

const itemSchema = z.object({
    kind: z.enum([
        'note',
        'journal',
        'draft',
        'transcript',
        'audio-dump',
        'archive',
        'research-task',
    ]),
    title: z.string(),
    body: z.string().default(''),
    tags: z.array(z.string()).default([]),
    collectionIds: z.array(z.string()).default([]),
    sources: z
        .array(
            z.object({
                id: z.string(),
                label: z.string(),
                url: z.string().optional(),
                provider: z
                    .enum(['manual', 'obsidian', 'youtube', 'google-docs'])
                    .optional(),
            }),
        )
        .default([]),
});

export async function GET() {
    const { supabase } = await createClients();
    const userId = await getRequestUserId(supabase);
    return NextResponse.json({
        items: await listKnowledgeItemsForUser(supabase, userId),
    });
}

export async function POST(req: Request) {
    const { supabase } = await createClients();
    const userId = await getRequestUserId(supabase);
    const parsed = itemSchema.safeParse(await req.json());
    if (!parsed.success)
        return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
    const sources = parsed.data.sources.map((source) => ({
        id: source.id,
        label: source.label,
        ...(source.url ? { url: source.url } : {}),
        ...(source.provider ? { provider: source.provider } : {}),
    }));
    return NextResponse.json(
        await createKnowledgeItemForUser(supabase, {
            ...parsed.data,
            sources,
            userId,
        }),
    );
}
