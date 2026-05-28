import { NextResponse } from 'next/server';
import { createClients } from '@/lib/supabase/serverClient';
import { createAdminClient } from '@/lib/supabase/adminClient';
import {
    requireAdminUser,
    forbidden,
} from '@/features/admin/lib/adminPermissions';
import {
    auditAdminAction,
    getClientIp,
} from '@/features/admin/lib/auditAdminAction';

interface Profile {
    id: string;
    full_name: string | null;
    role: string | null;
    created_at: string;
}

export async function GET() {
    const { supabase } = await createClients();
    try {
        await requireAdminUser(supabase);
    } catch {
        return forbidden();
    }

    const admin = createAdminClient();

    const { data: profiles, error } = (await admin
        .from('profiles')
        .select('id, full_name, role, created_at')
        .order('created_at', { ascending: false })
        .limit(200)) as {
        data: Profile[] | null;
        error: { message: string } | null;
    };

    if (error)
        return NextResponse.json({ error: error.message }, { status: 500 });

    const { data: authUsers } = await admin.auth.admin.listUsers({
        perPage: 200,
    });

    const emailMap = new Map<string, string>();
    for (const u of authUsers?.users ?? []) {
        if (u.email) emailMap.set(u.id, u.email);
    }

    const users = (profiles ?? []).map((p) => ({
        id: p.id,
        email: emailMap.get(p.id) ?? '',
        full_name: p.full_name ?? '',
        role: p.role ?? 'user',
        created_at: p.created_at,
    }));

    return NextResponse.json({ users });
}

export async function PATCH(req: Request) {
    const { supabase } = await createClients();
    let actor;
    try {
        actor = await requireAdminUser(supabase);
    } catch {
        return forbidden();
    }

    const body = (await req.json()) as { id: string; role: string };
    const { id, role } = body;
    if (!id || !role)
        return NextResponse.json(
            { error: 'Missing id or role' },
            { status: 400 },
        );

    const admin = createAdminClient();

    const { data: before } = (await admin
        .from('profiles')
        .select('role')
        .eq('id', id)
        .single()) as { data: Pick<Profile, 'role'> | null; error: unknown };
    const { error } = await admin
        .from('profiles')
        .update({ role })
        .eq('id', id);
    if (error)
        return NextResponse.json({ error: error.message }, { status: 500 });

    const ip = getClientIp(req);
    await auditAdminAction({
        actorId: actor.id,
        action: 'update_user_role',
        resourceType: 'user',
        resourceId: id,
        before: { role: before?.role as string | undefined },
        after: { role },
        ...(ip !== undefined ? { ip } : {}),
    });

    return NextResponse.json({ ok: true });
}
