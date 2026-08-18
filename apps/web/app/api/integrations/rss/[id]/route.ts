import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getRequestUserId } from '@/features/backend/lib/requestUser';
import { disableRssSource } from '@/features/integrations/services/rssSourceServer';
import { createClients } from '@/lib/supabase/serverClient';

export async function DELETE(
    _request: Request,
    context: { params: Promise<{ id: string }> },
) {
    try {
        const { id } = await context.params;
        const sourceId = z.string().uuid().parse(id);
        const { supabase } = await createClients();
        const userId = await getRequestUserId(supabase);
        const found = await disableRssSource(supabase, userId, sourceId);
        return found
            ? new NextResponse(null, { status: 204 })
            : NextResponse.json({ error: 'Source not found' }, { status: 404 });
    } catch {
        return NextResponse.json(
            { error: 'Unable to disable RSS source' },
            { status: 400 },
        );
    }
}
