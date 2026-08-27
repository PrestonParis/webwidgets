import type { SupabaseClient } from '@supabase/supabase-js';
import { z } from 'zod';
import type { Database } from '@/types/supabase';

export const EXTERNAL_INFERENCE_CONSENT_SCOPES = [
    'external_llm',
    'external_sensitive_inference',
    'timeline_analysis',
];
const consentRowsSchema = z.array(
    z.object({ scope: z.string(), state: z.string() }),
);
const subscriptionSchema = z
    .object({ plan_id: z.string(), status: z.string() })
    .nullable();

export async function loadExternalInferenceAuthorization(
    db: SupabaseClient<Database>,
    userId: string,
) {
    const [consents, subscription] = await Promise.all([
        db
            .from('consent_records')
            .select('scope,state')
            .eq('user_id', userId)
            .in('scope', EXTERNAL_INFERENCE_CONSENT_SCOPES),
        db
            .from('billing_subscriptions')
            .select('plan_id,status')
            .eq('user_id', userId)
            .in('status', ['active', 'trialing'])
            .order('created_at', { ascending: false })
            .limit(1)
            .maybeSingle(),
    ]);
    const consentRows = consentRowsSchema.safeParse(consents.data ?? []);
    const subscriptionRow = subscriptionSchema.safeParse(subscription.data);
    const grantedConsentScopes = (consentRows.success ? consentRows.data : [])
        .filter((record) => record.state === 'granted')
        .map((record) => record.scope);
    return {
        allowExternal: true,
        paidTier: Boolean(
            subscriptionRow.success &&
            subscriptionRow.data &&
            subscriptionRow.data.plan_id !== 'free',
        ),
        grantedConsentScopes,
    };
}
