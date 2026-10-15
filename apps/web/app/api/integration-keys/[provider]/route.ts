import { NextResponse } from 'next/server';
import { z } from 'zod';
import { createCredentialClients } from '@/app/api/auth/_lib/credentialClients';

const providerSchema = z
    .string()
    .min(1)
    .max(80)
    .regex(/^[a-z0-9_-]+$/u);

export async function DELETE(
    _request: Request,
    context: { params: Promise<{ provider: string }> },
): Promise<Response> {
    const parsed = providerSchema.safeParse((await context.params).provider);
    if (!parsed.success)
        return NextResponse.json(
            { error: 'invalid_provider' },
            { status: 400 },
        );
    try {
        const { supabaseAdmin, userId } = await createCredentialClients();
        const result = await supabaseAdmin
            .from('user_integration_keys')
            .delete()
            .eq('user_id', userId)
            .eq('provider', parsed.data);
        if (result.error) throw result.error;
        return NextResponse.json({ deleted: true });
    } catch {
        return NextResponse.json(
            { error: 'integration_key_delete_failed' },
            { status: 500 },
        );
    }
}
