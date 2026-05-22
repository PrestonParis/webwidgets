import { NextResponse } from 'next/server';
import { listResearchArtifacts } from '@/features/research/server/researchService';
import { createClients } from '@/lib/supabase/serverClient';
import { getRequestUserId } from '@/features/backend/services/requestUser';

export const runtime = 'nodejs';

export async function GET(req: Request) {
    const { supabase } = await createClients();
    await getRequestUserId(supabase);
    const url = new URL(req.url);
    const query = url.searchParams.get('q') ?? '';
    const rootPath = url.searchParams.get('rootPath') ?? undefined;
    const sourceKind = url.searchParams.get('sourceKind') ?? undefined;
    return NextResponse.json({
        artifacts: await listResearchArtifacts(
            rootPath,
            sourceKind === 'obsidian-vault' ? 'obsidian-vault' : undefined,
            query,
        ),
    });
}
