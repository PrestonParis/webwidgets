import { NextResponse } from 'next/server';
import { z } from 'zod';
import { createClients } from '@/lib/supabase/serverClient';
import { getRequestUserId } from '@/features/backend/lib/requestUser';
import { getUpload } from '@/features/uploads/services/uploadService';

const bodySchema = z.object({
    name: z.string().min(1).max(255),
});

interface RouteContext {
    params: Promise<{ fileId: string }>;
}

export async function PATCH(req: Request, ctx: RouteContext) {
    try {
        const { supabase } = await createClients();
        const userId = await getRequestUserId(supabase);
        const { fileId } = await ctx.params;

        const parsed = bodySchema.safeParse(await req.json());
        if (!parsed.success) {
            return NextResponse.json(
                { error: 'Invalid request' },
                { status: 400 },
            );
        }

        // Ownership check
        const upload = await getUpload(supabase, userId, fileId);
        if (!upload) {
            return NextResponse.json({ error: 'Not found' }, { status: 404 });
        }

        const { data, error } = await supabase
            .from('file_uploads')
            .update({
                original_name: parsed.data.name,
                updated_at: new Date().toISOString(),
            })
            .eq('id', fileId)
            .eq('user_id', userId)
            .select(
                'id,user_id,original_name,mime_type,size_bytes,s3_key,status,created_at,updated_at',
            )
            .single();

        if (error) throw error;

        return NextResponse.json({ ok: true, file: data });
    } catch (err) {
        const message = err instanceof Error ? err.message : 'Unknown error';
        return NextResponse.json({ error: message }, { status: 500 });
    }
}
