import { db } from '@/lib/db/supabase';
import type {
    ConsentCategory,
    ConsentRecord,
} from '@/features/security/types/consent';
import type { SupabaseClient } from '@supabase/supabase-js';

export async function listConsentRecords(userId: string) {
    const result = await db
        .from('consent_records')
        .select('*')
        .eq('user_id', userId);
    if (result.error) throw result.error;
    return (result.data ?? []) as ConsentRecord[];
}

export async function hasConsent(
    userId: string,
    category: ConsentCategory,
    scope: string,
) {
    const result = await db
        .from('consent_records')
        .select('state')
        .eq('user_id', userId)
        .eq('category', category)
        .eq('scope', scope)
        .maybeSingle();
    if (result.error) throw result.error;
    return result.data?.state === 'granted';
}

export async function createConsentRecord(record: Omit<ConsentRecord, 'id'>) {
    const result = await db
        .from('consent_records')
        .upsert(
            {
                user_id: record.userId,
                category: record.category,
                state: record.state,
                scope: record.scope,
                granted_at: record.grantedAt,
                revoked_at: record.revokedAt,
            },
            { onConflict: 'user_id,category,scope' },
        )
        .select()
        .single();
    if (result.error) throw result.error;
    return result.data as ConsentRecord;
}

export async function listConsentRecordsForUser(
    supabase: SupabaseClient,
    userId: string,
) {
    const result = await supabase
        .from('consent_records')
        .select('*')
        .eq('user_id', userId);
    if (result.error) throw result.error;
    return (result.data ?? []) as ConsentRecord[];
}

export async function assertConsent(
    supabase: SupabaseClient,
    userId: string,
    category: ConsentCategory,
    scope: string,
) {
    const result = await supabase
        .from('consent_records')
        .select('state')
        .eq('user_id', userId)
        .eq('category', category)
        .eq('scope', scope)
        .maybeSingle();
    if (result.error) throw result.error;
    if (result.data?.state !== 'granted')
        throw new Error(`Consent required: ${category}:${scope}`);
}
