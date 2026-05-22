import { NextResponse } from 'next/server';
import { createClients } from '@/lib/supabase/serverClient';
import { getRequestUserId } from '@/features/backend/services/requestUser';
import { db } from '@/lib/db/supabase';
import { deleteModelKey } from '@/features/chatbot/services/chatService';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { ModelProvider } from '@/features/chatbot/types/chat';

export async function DELETE(
    _req: Request,
    { params }: { params: Promise<{ provider: string }> },
) {
    try {
        const { provider } = await params;
        const { supabase } = await createClients();
        const userId = await getRequestUserId(supabase);
        await deleteModelKey(
            db as unknown as SupabaseClient,
            userId,
            provider as ModelProvider,
        );
        return NextResponse.json({ ok: true });
    } catch (err) {
        const msg = err instanceof Error ? err.message : 'Unknown error';
        return NextResponse.json({ error: msg }, { status: 500 });
    }
}
