import { NextResponse } from 'next/server';
import { createClients } from '@/lib/supabase/serverClient';
import { createAdminClient } from '@/lib/supabase/adminClient';
import {
    requireAdminUser,
    forbidden,
} from '@/features/admin/lib/adminPermissions';

export async function GET(req: Request) {
    const { supabase } = await createClients();
    try {
        await requireAdminUser(supabase);
    } catch {
        return forbidden();
    }

    const { searchParams } = new URL(req.url);
    const limit = Math.min(Number(searchParams.get('limit') ?? 100), 500);
    const offset = Number(searchParams.get('offset') ?? 0);
    const resourceType = searchParams.get('resource_type');
    const actorId = searchParams.get('actor_id');

    const admin = createAdminClient();

    let query = admin
        .from('admin_audit_logs')
        .select(
            'id, actor_id, action, resource_type, resource_id, before, after, ip, created_at',
        )
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

    if (resourceType) query = query.eq('resource_type', resourceType);
    if (actorId) query = query.eq('actor_id', actorId);

    const { data, error } = await query;
    if (error)
        return NextResponse.json({ error: error.message }, { status: 500 });

    return NextResponse.json({ logs: data ?? [] });
}
