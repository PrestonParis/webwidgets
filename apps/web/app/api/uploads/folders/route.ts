import { NextResponse } from 'next/server';
import { z } from 'zod';
import { createClients } from '@/lib/supabase/serverClient';
import { getRequestUserId } from '@/features/backend/lib/requestUser';
import { isMissingTableError } from '@/lib/supabase/missingTable';

const createBodySchema = z.object({
    name: z.string().min(1).max(255),
    parentId: z.string().nullable().optional(),
});

export async function GET() {
    try {
        const { supabase } = await createClients();
        const userId = await getRequestUserId(supabase);

        const { data, error } = await supabase
            .from('file_folders')
            .select('id,user_id,name,parent_id,created_at,updated_at')
            .eq('user_id', userId)
            .order('name', { ascending: true });

        if (error) {
            if (isMissingTableError(error)) {
                return NextResponse.json({ folders: [] });
            }
            throw error;
        }

        const folders = (data ?? []).map((row) => ({
            id: row.id as string,
            userId: row.user_id as string,
            name: row.name as string,
            parentId: (row.parent_id as string | null) ?? null,
            createdAt: row.created_at as string,
            updatedAt: row.updated_at as string,
        }));

        return NextResponse.json({ folders });
    } catch (err) {
        const message = err instanceof Error ? err.message : 'Unknown error';
        return NextResponse.json({ error: message }, { status: 500 });
    }
}

export async function POST(req: Request) {
    try {
        const { supabase } = await createClients();
        const userId = await getRequestUserId(supabase);

        const parsed = createBodySchema.safeParse(await req.json());
        if (!parsed.success) {
            return NextResponse.json(
                { error: 'Invalid request' },
                { status: 400 },
            );
        }

        const { name, parentId } = parsed.data;

        const { data, error } = await supabase
            .from('file_folders')
            .insert({
                user_id: userId,
                name,
                ...(parentId != null ? { parent_id: parentId } : {}),
            })
            .select('id,user_id,name,parent_id,created_at,updated_at')
            .single();

        if (error) {
            if (isMissingTableError(error)) {
                return NextResponse.json({
                    ok: false,
                    message: 'folders not configured',
                });
            }
            throw error;
        }

        return NextResponse.json({
            ok: true,
            folder: {
                id: data.id,
                userId: data.user_id,
                name: data.name,
                parentId: data.parent_id ?? null,
                createdAt: data.created_at,
                updatedAt: data.updated_at,
            },
        });
    } catch (err) {
        const message = err instanceof Error ? err.message : 'Unknown error';
        return NextResponse.json({ error: message }, { status: 500 });
    }
}
