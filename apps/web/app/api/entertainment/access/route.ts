import { NextResponse } from 'next/server';
import { createClients } from '@/lib/supabase/serverClient';
import { isEntertainmentBetaEnabled } from '@/features/entertainment/lib/entertainmentAccess.server';

export async function GET() {
    const { supabase } = await createClients();
    try {
        const hasAccess = await isEntertainmentBetaEnabled(supabase);
        return NextResponse.json({ hasAccess });
    } catch {
        return NextResponse.json({ hasAccess: false });
    }
}
