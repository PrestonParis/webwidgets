import type { SupabaseClient } from '@supabase/supabase-js';
import type { Json } from '@/types/supabase';

export interface SmartContextPacket {
    userId: string;
    goals: string[];
    activeWidgets: string[];
    connectedServices: string[];
    grantedConsents: string[];
    recentActivity: Json[];
}

export async function buildSmartContext(
    supabase: SupabaseClient,
    userId: string,
): Promise<SmartContextPacket> {
    const [onboarding, widgets, integrations, consents, activity] =
        await Promise.all([
            supabase
                .from('onboarding_profiles')
                .select('profile')
                .eq('user_id', userId)
                .maybeSingle(),
            supabase
                .from('widget_instances')
                .select('widget_id')
                .eq('user_id', userId)
                .eq('active', true),
            supabase
                .from('integration_connections')
                .select('provider_id,state')
                .eq('user_id', userId),
            supabase
                .from('consent_records')
                .select('category,scope,state')
                .eq('user_id', userId)
                .eq('state', 'granted'),
            supabase
                .from('activity_events')
                .select('source,severity,title,created_at')
                .eq('user_id', userId)
                .order('created_at', { ascending: false })
                .limit(20),
        ]);

    const profile = onboarding.data?.profile as { goals?: string[] } | null;
    return {
        userId,
        goals: profile?.goals ?? [],
        activeWidgets: (widgets.data ?? []).map((row) => String(row.widget_id)),
        connectedServices: (integrations.data ?? [])
            .filter((row) => row.state === 'connected')
            .map((row) => String(row.provider_id)),
        grantedConsents: (consents.data ?? []).map(
            (row) => `${row.category}:${row.scope}`,
        ),
        recentActivity: (activity.data ?? []) as Json[],
    };
}
