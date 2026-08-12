import type { SupabaseClient } from '@supabase/supabase-js';
import { getUserOrThrow } from '@/lib/supabase/getUser';
import { createAdminClient } from '@/lib/supabase/adminClient';
import {
    resolveAdminRole,
    roleAtLeast,
} from '@/features/admin/lib/adminPermissions';
import { ENTERTAINMENT_FLAG_KEY } from '@/features/entertainment/constants';

/**
 * Entertainment widgets/pages are in beta: available to admins unconditionally,
 * and to everyone else only once the `entertainment_beta` feature flag is
 * enabled (toggleable from /admin/feature-flags without a redeploy).
 */
export async function isEntertainmentBetaEnabled(
    supabase: SupabaseClient,
): Promise<boolean> {
    const user = await getUserOrThrow(supabase);
    const role = await resolveAdminRole(user.id, user.email ?? '');
    if (role && roleAtLeast(role, 'admin')) return true;

    const admin = createAdminClient();
    const { data } = (await admin
        .from('feature_flags')
        .select('enabled')
        .eq('key', ENTERTAINMENT_FLAG_KEY)
        .maybeSingle()) as { data: { enabled: boolean } | null };

    return data?.enabled ?? false;
}
