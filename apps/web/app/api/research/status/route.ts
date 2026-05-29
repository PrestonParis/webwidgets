import { NextResponse } from 'next/server';
import { getResearchStatus } from '@/features/research/server/researchService';
import { createClients } from '@/lib/supabase/serverClient';
import { getRequestUserId } from '@/features/backend/lib/requestUser';

export const runtime = 'nodejs';

export async function GET(req: Request) {
    const { supabase } = await createClients();
    await getRequestUserId(supabase);
    const url = new URL(req.url);
    const rootPath = url.searchParams.get('rootPath') ?? undefined;
    const sourceKind = url.searchParams.get('sourceKind') ?? undefined;
    return NextResponse.json(
        await getResearchStatus(
            rootPath,
            sourceKind === 'obsidian-vault' ? 'obsidian-vault' : undefined,
        ),
    );
}
