import { NextResponse } from 'next/server';
import { createClients } from '@/lib/supabase/serverClient';
import {
    forbidden,
    requireAdminUser,
} from '@/features/admin/lib/adminPermissions';
import { getDeveloperWorkspaceSnapshot } from '@/features/developer/server/infrastructureService';

export const runtime = 'nodejs';

export async function GET() {
    const { supabase } = await createClients();
    let actor;
    try {
        actor = await requireAdminUser(supabase);
    } catch {
        return forbidden();
    }

    const snapshot = await getDeveloperWorkspaceSnapshot(actor.id);
    return NextResponse.json(snapshot);
}
