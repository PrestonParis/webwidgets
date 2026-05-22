import { db } from '@/lib/db/supabase';
import type { Json } from '@/types/supabase';
import type { OnboardingProfile } from '@/features/onboarding/types/profile';
import type { WidgetConfig } from '@/features/dashboard/types/dashboard';

const TABLE = 'onboarding_profiles';

export async function fetchOnboardingProfile(userId: string) {
    const { data, error } = await db
        .from(TABLE)
        .select('profile')
        .eq('user_id', userId)
        .maybeSingle();

    if (error) throw error;
    return (data?.profile as OnboardingProfile | null) ?? null;
}

export async function saveOnboardingProfile(
    userId: string,
    profile: OnboardingProfile,
) {
    const { error } = await db.from(TABLE).upsert(
        {
            user_id: userId,
            status: profile.status,
            current_step: profile.currentStep,
            profile: profile as unknown as Json,
            updated_at: new Date().toISOString(),
        },
        { onConflict: 'user_id' },
    );

    if (error) throw error;
}

export async function saveGeneratedDashboardLayout(
    userId: string,
    layout: WidgetConfig[],
) {
    const result = await db.from('dashboard_layouts').upsert(
        {
            user_id: userId,
            layout: layout as unknown as Json,
            updated_at: new Date().toISOString(),
        },
        { onConflict: 'user_id' },
    );
    if (result.error) throw result.error;
}

export async function saveOnboardingWidgetInstances(
    userId: string,
    layout: WidgetConfig[],
) {
    const rows = layout.map((widget) => ({
        user_id: userId,
        widget_id: widget.id,
        feature_id: widget.type,
        config: widget as unknown as Json,
        active: widget.containerId === 'main',
        updated_at: new Date().toISOString(),
    }));
    if (rows.length === 0) return;
    const result = await db
        .from('widget_instances')
        .upsert(rows, { onConflict: 'user_id,widget_id' });
    if (result.error) throw result.error;
}
