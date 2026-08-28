import { createClients } from '@/lib/supabase/serverClient';
import { createAdminClient } from '@/lib/supabase/adminClient';
import { getUserOrThrow } from '@/lib/supabase/getUser';

export async function createCredentialClients(expectedUserId?: string) {
    const { supabase } = await createClients();
    const user = await getUserOrThrow(supabase);
    if (expectedUserId && expectedUserId !== user.id)
        throw new Error('Unauthorized');
    return { supabase, supabaseAdmin: createAdminClient(), userId: user.id };
}
