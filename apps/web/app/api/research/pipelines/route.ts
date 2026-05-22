import { NextResponse } from 'next/server';
import { z } from 'zod';
import { runResearchPipeline } from '@/features/research/server/researchService';
import { createClients } from '@/lib/supabase/serverClient';
import { getRequestUserId } from '@/features/backend/services/requestUser';

export const runtime = 'nodejs';

const requestSchema = z.object({
    sourceRootPath: z.string().optional(),
    sourceKind: z.enum(['observatory-local', 'obsidian-vault']).optional(),
    topic: z.string().min(2).max(200),
    mode: z.enum(['explore', 'academic']),
    destination: z.enum(['vault', 'zip']),
    webLimit: z.number().int().min(0).max(20),
    youtubeLimit: z.number().int().min(0).max(20),
    wikiLinks: z.number().int().min(0).max(50),
    tags: z.array(z.string().min(1).max(40)).max(12),
});

export async function POST(req: Request) {
    const { supabase } = await createClients();
    await getRequestUserId(supabase);
    const parsed = requestSchema.safeParse(await req.json());
    if (!parsed.success) {
        return NextResponse.json(
            { error: 'Invalid research pipeline request' },
            { status: 400 },
        );
    }

    const result = await runResearchPipeline(parsed.data);
    return NextResponse.json(result, { status: result.ok ? 200 : 500 });
}
