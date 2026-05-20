import type { SupabaseClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';
import { getUserOrThrow } from './getUser';

export class AdminRequiredError extends Error {
    constructor() {
        super('Forbidden: admin role required');
        this.name = 'AdminRequiredError';
    }
}

/**
 * Verifies the request is authenticated AND the user holds the 'admin' role.
 * Uses the admin client to read role directly from DB — not from the JWT —
 * so role changes take effect immediately without waiting for token refresh.
 *
 * Throws AdminRequiredError on failure; callers can catch and return 403.
 */
export async function requireAdmin(
    supabase: SupabaseClient,
    supabaseAdmin: SupabaseClient,
) {
    const user = await getUserOrThrow(supabase);

    const { data: profile } = await supabaseAdmin
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();

    if (profile?.role !== 'admin') throw new AdminRequiredError();

    return user;
}

/** Convenience: returns a 403 NextResponse ready to return from a route handler. */
export function forbidden() {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
}
