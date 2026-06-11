import { NextResponse } from 'next/server';
import { z } from 'zod';
import { runResearchPipeline } from '@/features/research/server/researchService';
import { createClients } from '@/lib/supabase/serverClient';
import { getRequestUserId } from '@/features/backend/lib/requestUser';
import { publishActivityEventSafe } from '@/features/activity/services/activityService';

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
    const userId = await getRequestUserId(supabase);
    const parsed = requestSchema.safeParse(await req.json());
    if (!parsed.success) {
        return NextResponse.json(
            { error: 'Invalid research pipeline request' },
            { status: 400 },
        );
    }

    // Publish started event before running (pipeline can take minutes)
    await publishActivityEventSafe(supabase, {
        userId,
        source: 'research',
        eventType: 'research.started',
        category: 'ai',
        severity: 'info',
        priority: 'normal',
        title: `Research started: ${parsed.data.topic}`,
        body: `${parsed.data.mode} mode · ${parsed.data.webLimit} web sources`,
        actionUrl: '/research',
        metadata: {
            topic: parsed.data.topic,
            mode: parsed.data.mode,
            webLimit: parsed.data.webLimit,
            tags: parsed.data.tags,
        },
    });

    const result = await runResearchPipeline(parsed.data);

    // Publish completion or failure event
    if (result.ok) {
        await publishActivityEventSafe(supabase, {
            userId,
            source: 'research',
            eventType: 'research.completed',
            category: 'ai',
            severity: 'success',
            priority: 'normal',
            title: `Research completed: ${parsed.data.topic}`,
            actionUrl: '/research',
            metadata: {
                topic: parsed.data.topic,
                mode: parsed.data.mode,
            },
        });
    } else {
        await publishActivityEventSafe(supabase, {
            userId,
            source: 'research',
            eventType: 'research.failed',
            category: 'ai',
            severity: 'critical',
            priority: 'high',
            title: `Research failed: ${parsed.data.topic}`,
            metadata: { topic: parsed.data.topic, mode: parsed.data.mode },
        });
    }

    return NextResponse.json(result, { status: result.ok ? 200 : 500 });
}
