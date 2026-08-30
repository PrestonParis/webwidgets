import { NextResponse } from 'next/server';
import { z } from 'zod';
import { createCredentialClients } from '@/app/api/auth/_lib/credentialClients';

const saveSchema = z.object({
    provider: z
        .string()
        .trim()
        .min(1)
        .max(80)
        .regex(/^[a-z0-9_-]+$/u),
    apiKey: z.string().trim().min(1).max(500),
});

const providerRowsSchema = z.array(z.object({ provider: z.string() }));

export async function GET(): Promise<Response> {
    try {
        const { supabaseAdmin, userId } = await createCredentialClients();
        const result = await supabaseAdmin
            .from('user_integration_keys')
            .select('provider')
            .eq('user_id', userId);
        if (result.error) throw result.error;
        const providers = providerRowsSchema
            .parse(result.data ?? [])
            .map((row) => row.provider);
        return NextResponse.json({
            providers,
        });
    } catch {
        return NextResponse.json(
            { error: 'integration_keys_unavailable' },
            { status: 401 },
        );
    }
}

export async function POST(request: Request): Promise<Response> {
    const input = saveSchema.safeParse(await request.json().catch(() => null));
    if (!input.success)
        return NextResponse.json({ error: 'invalid_request' }, { status: 400 });
    try {
        const { supabaseAdmin, userId } = await createCredentialClients();
        const result = await supabaseAdmin.from('user_integration_keys').upsert(
            {
                user_id: userId,
                provider: input.data.provider,
                api_key: input.data.apiKey,
                updated_at: new Date().toISOString(),
            },
            { onConflict: 'user_id,provider' },
        );
        if (result.error) throw result.error;
        return NextResponse.json({ saved: true });
    } catch {
        return NextResponse.json(
            { error: 'integration_key_save_failed' },
            { status: 500 },
        );
    }
}
