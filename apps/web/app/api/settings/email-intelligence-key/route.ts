import { NextResponse } from 'next/server';
import { z } from 'zod';
import { createCredentialClients } from '@/app/api/auth/_lib/credentialClients';

const keySchema = z.object({ apiKey: z.string().trim().min(1).max(500) });

export async function GET(): Promise<Response> {
    try {
        const { supabaseAdmin, userId } = await createCredentialClients();
        const result = await supabaseAdmin
            .from('profiles')
            .select('anthropic_api_key')
            .eq('id', userId)
            .maybeSingle();
        if (result.error) throw result.error;
        return NextResponse.json({
            hasKey: Boolean(result.data?.anthropic_api_key),
        });
    } catch {
        return NextResponse.json(
            { error: 'key_status_unavailable' },
            { status: 401 },
        );
    }
}

export async function PUT(request: Request): Promise<Response> {
    const input = keySchema.safeParse(await request.json().catch(() => null));
    if (!input.success)
        return NextResponse.json({ error: 'invalid_request' }, { status: 400 });
    try {
        const { supabaseAdmin, userId } = await createCredentialClients();
        const result = await supabaseAdmin.from('profiles').upsert({
            id: userId,
            anthropic_api_key: input.data.apiKey,
        });
        if (result.error) throw result.error;
        return NextResponse.json({ saved: true });
    } catch {
        return NextResponse.json({ error: 'key_save_failed' }, { status: 500 });
    }
}

export async function DELETE(): Promise<Response> {
    try {
        const { supabaseAdmin, userId } = await createCredentialClients();
        const result = await supabaseAdmin
            .from('profiles')
            .update({ anthropic_api_key: null })
            .eq('id', userId);
        if (result.error) throw result.error;
        return NextResponse.json({ deleted: true });
    } catch {
        return NextResponse.json(
            { error: 'key_delete_failed' },
            { status: 500 },
        );
    }
}
