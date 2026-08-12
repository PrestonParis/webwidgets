import { NextResponse } from 'next/server';
import { createClients } from '@/lib/supabase/serverClient';
import { getUserOrThrow } from '@/lib/supabase/getUser';
import { syncGoogleDriveContext } from '@/features/context/services/googleDriveContextSync';

export async function POST() {
    try {
        const { supabase, supabaseAdmin } = await createClients();
        const user = await getUserOrThrow(supabase);

        const { data: tokenRow } = await supabaseAdmin
            .from('user_tokens')
            .select('has_drive')
            .eq('user_id', user.id)
            .maybeSingle();

        if (!tokenRow?.has_drive) {
            return NextResponse.json(
                { error: 'Google Drive is not connected' },
                { status: 400 },
            );
        }

        const synced = await syncGoogleDriveContext(supabaseAdmin, user.id);
        return NextResponse.json({ synced });
    } catch (err) {
        const status = (err as { status?: number }).status;
        if (status === 403 || status === 401) {
            return NextResponse.json(
                {
                    error: 'Google Drive access expired. Reconnect and try again.',
                },
                { status: 401 },
            );
        }
        const message = err instanceof Error ? err.message : 'Unknown error';
        return NextResponse.json({ error: message }, { status: 500 });
    }
}
