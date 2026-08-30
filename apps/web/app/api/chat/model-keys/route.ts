import { NextResponse } from 'next/server';
import { z } from 'zod';
import { createCredentialClients } from '@/app/api/auth/_lib/credentialClients';
import {
    saveModelKey,
    listSavedProviders,
} from '@/features/chatbot/services/chatService';
import type { SupabaseClient } from '@supabase/supabase-js';
import type {
    ModelProvider,
    ModelProviderAvailability,
} from '@/features/chatbot/types/chat';

const saveSchema = z.object({
    provider: z.enum(['anthropic', 'openai', 'google']),
    apiKey: z.string().trim().min(1).max(500),
});

export async function GET() {
    try {
        const { supabaseAdmin, userId } = await createCredentialClients();
        const providers = await listSavedProviders(
            supabaseAdmin as unknown as SupabaseClient,
            userId,
        );
        const availability: ModelProviderAvailability[] = (
            ['anthropic', 'openai', 'google'] as ModelProvider[]
        ).map((provider) => {
            const hasUserKey = providers.includes(provider);
            const hasServerKey =
                provider === 'anthropic'
                    ? Boolean(process.env.ANTHROPIC_API_KEY)
                    : provider === 'openai'
                      ? Boolean(process.env.OPENAI_API_KEY)
                      : Boolean(
                            process.env.GEMINI_API_KEY ??
                            process.env.GOOGLE_API_KEY,
                        );
            return {
                provider,
                hasUserKey,
                hasServerKey,
                available: hasUserKey || hasServerKey,
            };
        });
        return NextResponse.json({ providers, availability });
    } catch (err) {
        const msg = err instanceof Error ? err.message : 'Unknown error';
        return NextResponse.json({ error: msg }, { status: 401 });
    }
}

export async function POST(req: Request) {
    try {
        const { supabaseAdmin, userId } = await createCredentialClients();
        const body = saveSchema.safeParse(await req.json());
        if (!body.success)
            return NextResponse.json(
                { error: 'Invalid payload' },
                { status: 400 },
            );
        await saveModelKey(
            supabaseAdmin as unknown as SupabaseClient,
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
