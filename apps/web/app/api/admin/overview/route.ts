import { NextResponse } from 'next/server';
import { createClients } from '@/lib/supabase/serverClient';
import { createAdminClient } from '@/lib/supabase/adminClient';
import {
    requireAdminUser,
    forbidden,
} from '@/features/admin/lib/adminPermissions';

export async function GET() {
    const { supabase } = await createClients();
    try {
        await requireAdminUser(supabase);
    } catch {
        return forbidden();
    }

    const admin = createAdminClient();

    const [
        { count: userCount },
        { count: auditCount },
        { count: flagCount },
        { count: jobCount },
    ] = await Promise.all([
        admin.from('profiles').select('id', { count: 'exact', head: true }),
        admin
            .from('admin_audit_logs')
            .select('id', { count: 'exact', head: true }),
        admin
            .from('feature_flags')
            .select('id', { count: 'exact', head: true }),
        admin.from('jobs').select('id', { count: 'exact', head: true }),
    ]);

    const { data: recentAudit } = await admin
        .from('admin_audit_logs')
        .select('id, actor_id, action, resource_type, created_at')
        .order('created_at', { ascending: false })
        .limit(5);

    const { data: activeFlags } = await admin
        .from('feature_flags')
        .select('id, key, enabled')
        .eq('enabled', true)
        .limit(10);

    return NextResponse.json({
        stats: {
            users: userCount ?? 0,
            auditLogs: auditCount ?? 0,
            flags: flagCount ?? 0,
            jobs: jobCount ?? 0,
        },
        recentAudit: recentAudit ?? [],
        activeFlags: activeFlags ?? [],
    });
}
