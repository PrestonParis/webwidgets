import { NextResponse } from 'next/server';
import { createClients } from '@/lib/supabase/serverClient';
import { getRequestUserId } from '@/features/backend/lib/requestUser';
import {
    listContextSavedViews,
    saveContextView,
} from '@/features/context/services/contextSavedViewsService';
import { contextSavedViewInputSchema } from '@/features/context/types/schemas';

export async function GET() {
    try {
        const { supabase } = await createClients();
        const userId = await getRequestUserId(supabase);
        const views = await listContextSavedViews(supabase, userId);
        return NextResponse.json({ views });
    } catch (err) {
        const msg = err instanceof Error ? err.message : 'Unknown error';
        return NextResponse.json({ error: msg }, { status: 500 });
    }
}

export async function POST(req: Request) {
    try {
        const { supabase } = await createClients();
        const userId = await getRequestUserId(supabase);
        const raw: unknown = await req.json();
        const parsed = contextSavedViewInputSchema.safeParse(raw);
        if (!parsed.success)
            return NextResponse.json(
                { error: 'Invalid payload' },
                { status: 400 },
            );
        const id =
            typeof raw === 'object' &&
            raw !== null &&
            'id' in raw &&
            typeof raw.id === 'string'
                ? raw.id
                : undefined;
        const view = await saveContextView(supabase, userId, {
            ...parsed.data,
            ...(id ? { id } : {}),
        });
        return NextResponse.json({ view });
    } catch (err) {
        const msg = err instanceof Error ? err.message : 'Unknown error';
        return NextResponse.json({ error: msg }, { status: 500 });
    }
}
