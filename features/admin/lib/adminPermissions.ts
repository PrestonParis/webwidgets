import type { SupabaseClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';
import { getUserOrThrow } from '@/lib/supabase/getUser';
import { createAdminClient } from '@/lib/supabase/adminClient';

// TODO: replace OWNER_EMAIL with a DB-driven 'owner' role once profiles.role supports it
const OWNER_EMAIL = 'prestonparis2005@gmail.com';

export type AdminRole = 'owner' | 'admin' | 'moderator' | 'support' | 'viewer';

const ROLE_RANK: Record<AdminRole, number> = {
    owner: 5,
    admin: 4,
    moderator: 3,
    support: 2,
    viewer: 1,
};

export function roleAtLeast(role: AdminRole, minimum: AdminRole): boolean {
    return ROLE_RANK[role] >= ROLE_RANK[minimum];
}

export interface AdminUser {
    id: string;
    email: string;
    role: AdminRole;
}

/** Resolves the effective admin role for a user, combining DB role + owner email fallback. */
async function resolveAdminRole(
    userId: string,
    email: string,
): Promise<AdminRole | null> {
    const admin = createAdminClient();

    const { data: profile } = await admin
        .from('profiles')
        .select('role')
        .eq('id', userId)
        .single();

    const dbRole = profile?.role as AdminRole | null | undefined;

    if (dbRole && ROLE_RANK[dbRole] !== undefined) return dbRole;
    if (email === OWNER_EMAIL) return 'owner';
    return null;
}

/**
 * Server-side admin check. Throws if not authenticated or not an admin.
 * Returns the resolved AdminUser on success.
 */
export async function requireAdminUser(
    supabase: SupabaseClient,
): Promise<AdminUser> {
    const user = await getUserOrThrow(supabase);
    const email = user.email ?? '';
    const role = await resolveAdminRole(user.id, email);

    if (!role) {
        throw new Error('Forbidden: admin role required');
    }

    return { id: user.id, email, role };
}

/** Returns a 403 NextResponse — convenience for route handlers. */
export function forbidden(): NextResponse {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
}

/** Checks if the given page requires a minimum role. */
export function canViewAdminPage(role: AdminRole, page: string): boolean {
    const minimums: Record<string, AdminRole> = {
        overview: 'viewer',
        users: 'admin',
        widgets: 'support',
        actions: 'moderator',
        audit: 'admin',
        'feature-flags': 'admin',
        metrics: 'viewer',
        ml: 'viewer',
        jobs: 'admin',
        errors: 'moderator',
        settings: 'owner',
    };
    const min = minimums[page] ?? 'admin';
    return roleAtLeast(role, min);
}
