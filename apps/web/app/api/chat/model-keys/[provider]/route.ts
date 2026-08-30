import { NextResponse } from 'next/server';
import { createCredentialClients } from '@/app/api/auth/_lib/credentialClients';
import { deleteModelKey } from '@/features/chatbot/services/chatService';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { ModelProvider } from '@/features/chatbot/types/chat';

export async function DELETE(
    _req: Request,
    { params }: { params: Promise<{ provider: string }> },
) {
    try {
        const { provider } = await params;
        const { supabaseAdmin, userId } = await createCredentialClients();
        await deleteModelKey(
            supabaseAdmin as unknown as SupabaseClient,
            userId,
            provider as ModelProvider,
        );
        return NextResponse.json({ ok: true });
    } catch (err) {
        const msg = err instanceof Error ? err.message : 'Unknown error';
        return NextResponse.json({ error: msg }, { status: 500 });
    }
}
