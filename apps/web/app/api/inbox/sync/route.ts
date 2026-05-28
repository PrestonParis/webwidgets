import { NextResponse } from 'next/server';
import { createClients } from '@/lib/supabase/serverClient';
import { getUserOrThrow } from '@/lib/supabase/getUser';
import { triggerUserSync } from '@/lib/syncQueue';

export async function POST(_req: Request) {
    const { supabase } = await createClients();

    let userId: string;
    try {
        const user = await getUserOrThrow(supabase);
        userId = user.id;
    } catch {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const triggered = await triggerUserSync(userId);
    return NextResponse.json({ syncing: triggered });
}
