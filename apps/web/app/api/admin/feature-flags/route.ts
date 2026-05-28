import { NextResponse } from 'next/server';
import { z } from 'zod';
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

interface FeatureFlag {
    id: string;
    key: string;
    description: string;
    enabled: boolean;
    rollout_pct: number;
    created_at: string;
    updated_at: string;
    created_by?: string;
    updated_by?: string;
}

type QueryResult<T> = { data: T | null; error: { message: string } | null };

const createSchema = z.object({
    key: z
        .string()
        .min(1)
        .max(80)
        .regex(/^[a-z0-9_]+$/),
    description: z.string().max(200).default(''),
    enabled: z.boolean().default(false),
    rollout_pct: z.number().int().min(0).max(100).default(0),
});

const updateSchema = z.object({
    id: z.string().uuid(),
    enabled: z.boolean().optional(),
    rollout_pct: z.number().int().min(0).max(100).optional(),
    description: z.string().max(200).optional(),
});

export async function GET() {
    const { supabase } = await createClients();
    try {
        await requireAdminUser(supabase);
    } catch {
        return forbidden();
    }

    const admin = createAdminClient();
    const { data, error } = await admin
        .from('feature_flags')
        .select(
            'id, key, description, enabled, rollout_pct, created_at, updated_at',
        )
        .order('key');

    if (error)
        return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ flags: data ?? [] });
}

export async function POST(req: Request) {
    const { supabase } = await createClients();
    let actor;
    try {
        actor = await requireAdminUser(supabase);
    } catch {
        return forbidden();
    }

    const parsed = createSchema.safeParse(await req.json());
    if (!parsed.success)
        return NextResponse.json(
            { error: parsed.error.flatten() },
            { status: 400 },
        );

    const admin = createAdminClient();
    const { data, error } = (await admin
        .from('feature_flags')
        .insert({ ...parsed.data, created_by: actor.id, updated_by: actor.id })
        .select()
        .single()) as QueryResult<FeatureFlag>;

    if (error)
        return NextResponse.json({ error: error.message }, { status: 500 });

    const ip1 = getClientIp(req);
    await auditAdminAction({
        actorId: actor.id,
        action: 'create_feature_flag',
        resourceType: 'feature_flag',
        resourceId: data!.id,
        after: parsed.data as Record<string, unknown>,
        ...(ip1 !== undefined ? { ip: ip1 } : {}),
    });

    return NextResponse.json({ flag: data }, { status: 201 });
}

export async function PATCH(req: Request) {
    const { supabase } = await createClients();
    let actor;
    try {
        actor = await requireAdminUser(supabase);
    } catch {
        return forbidden();
    }

    const parsed = updateSchema.safeParse(await req.json());
    if (!parsed.success)
        return NextResponse.json(
            { error: parsed.error.flatten() },
            { status: 400 },
        );

    const { id, ...updates } = parsed.data;
    const admin = createAdminClient();

    const { data: before } = (await admin
        .from('feature_flags')
        .select('enabled, rollout_pct')
        .eq('id', id)
        .single()) as QueryResult<Pick<FeatureFlag, 'enabled' | 'rollout_pct'>>;
    const { data, error } = (await admin
        .from('feature_flags')
        .update({
            ...updates,
            updated_by: actor.id,
            updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .select()
        .single()) as QueryResult<FeatureFlag>;

    if (error)
        return NextResponse.json({ error: error.message }, { status: 500 });

    const ip2 = getClientIp(req);
    await auditAdminAction({
        actorId: actor.id,
        action: 'update_feature_flag',
        resourceType: 'feature_flag',
        resourceId: id,
        ...(before != null
            ? { before: before as Record<string, unknown> }
            : {}),
        after: updates as Record<string, unknown>,
        ...(ip2 !== undefined ? { ip: ip2 } : {}),
    });

    return NextResponse.json({ flag: data });
}
