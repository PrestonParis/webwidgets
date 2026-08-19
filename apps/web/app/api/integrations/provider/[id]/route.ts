import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getRequestUserId } from '@/features/backend/lib/requestUser';
import { disconnectProviderConnection } from '@/features/integrations/services/providerConnectionServer';
import { createClients } from '@/lib/supabase/serverClient';

export async function DELETE(
    _request: Request,
    context: { params: Promise<{ id: string }> },
) {
    try {
        const { id } = await context.params;
        const connectionId = z.string().uuid().parse(id);
        const { supabase } = await createClients();
        await getRequestUserId(supabase);
        const disconnected = await disconnectProviderConnection(
            supabase,
            connectionId,
        );
        return disconnected
            ? new NextResponse(null, { status: 204 })
            : NextResponse.json(
                  { error: 'Connection not found' },
                  { status: 404 },
              );
    } catch {
        return NextResponse.json(
            { error: 'Unable to disconnect provider' },
            { status: 400 },
        );
    }
}
