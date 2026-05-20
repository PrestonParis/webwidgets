import { NextResponse } from 'next/server';
import { z } from 'zod';
import { createClients } from '@/lib/supabase/serverClient';
import { getRequestUserId } from '@/features/backend/services/requestUser';
import {
    saveModelKey,
    listSavedProviders,
} from '@/features/chatbot/services/chatService';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { ModelProvider } from '@/features/chatbot/types/chat';

const saveSchema = z.object({
    provider: z.enum(['anthropic', 'openai', 'google']),
    apiKey: z.string().min(1),
});

export async function GET() {
    try {
        const { supabase } = await createClients();
        const userId = await getRequestUserId(supabase);
        const providers = await listSavedProviders(
            supabase as unknown as SupabaseClient,
            userId,
        );
        return NextResponse.json({ providers });
    } catch (err) {
        const msg = err instanceof Error ? err.message : 'Unknown error';
        return NextResponse.json({ error: msg }, { status: 401 });
    }
}

export async function POST(req: Request) {
    try {
        const { supabase } = await createClients();
        const userId = await getRequestUserId(supabase);
        const body = saveSchema.safeParse(await req.json());
        if (!body.success)
            return NextResponse.json(
                { error: 'Invalid payload' },
                { status: 400 },
            );
        await saveModelKey(
            supabase as unknown as SupabaseClient,
            userId,
            body.data.provider as ModelProvider,
            body.data.apiKey,
        );
        return NextResponse.json({ ok: true });
    } catch (err) {
        const msg = err instanceof Error ? err.message : 'Unknown error';
        return NextResponse.json({ error: msg }, { status: 500 });
    }
}
