import { NextResponse } from 'next/server';
import { createClients } from '@/lib/supabase/serverClient';
import { getRequestUserId } from '@/features/backend/lib/requestUser';
import { getUpload } from '@/features/uploads/services/uploadService';
import { isMissingTableError } from '@/lib/supabase/missingTable';

interface RouteContext {
    params: Promise<{ fileId: string }>;
}

export async function POST(_req: Request, ctx: RouteContext) {
    try {
        const { supabase } = await createClients();
        const userId = await getRequestUserId(supabase);
        const { fileId } = await ctx.params;

        // Ownership check
        const upload = await getUpload(supabase, userId, fileId);
        if (!upload) {
            return NextResponse.json({ error: 'Not found' }, { status: 404 });
        }

        // Try upsert into file_metadata table
        const { data: existing, error: fetchErr } = await supabase
            .from('file_metadata')
            .select('id, favorite')
            .eq('file_id', fileId)
            .eq('user_id', userId)
            .maybeSingle();

        if (fetchErr) {
            if (isMissingTableError(fetchErr)) {
                return NextResponse.json({
                    ok: false,
                    message: 'metadata table not configured',
                    favorite: false,
                });
            }
            throw fetchErr;
        }

        const newFavorite = !(existing?.favorite ?? false);

        if (existing) {
            const { error: updateErr } = await supabase
                .from('file_metadata')
                .update({
                    favorite: newFavorite,
                    updated_at: new Date().toISOString(),
                })
                .eq('file_id', fileId)
                .eq('user_id', userId);
            if (updateErr) throw updateErr;
        } else {
            const { error: insertErr } = await supabase
                .from('file_metadata')
                .insert({
                    file_id: fileId,
                    user_id: userId,
                    favorite: newFavorite,
                    archived: false,
                    tags: [],
                    notes: null,
                });
            if (insertErr) {
                if (isMissingTableError(insertErr)) {
                    return NextResponse.json({
                        ok: false,
                        message: 'metadata table not configured',
                        favorite: false,
                    });
                }
                throw insertErr;
            }
        }

        return NextResponse.json({ ok: true, favorite: newFavorite });
    } catch (err) {
        const message = err instanceof Error ? err.message : 'Unknown error';
        return NextResponse.json({ error: message }, { status: 500 });
    }
}
