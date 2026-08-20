import type { SupabaseClient } from '@supabase/supabase-js';
import { buildSmartContext } from '@/features/intelligence/services/smartContextService';
import { runInference } from '@/features/intelligence/services/inferenceService';
import { recommendWidgetsForContext } from '@/features/platform/lib/assembly';

export async function recommendForUser(
    supabase: SupabaseClient,
    userId: string,
) {
    const context = await buildSmartContext(supabase, userId);
    const widgets = recommendWidgetsForContext({
        goals: context.goals.filter(isGoal),
        selectedWidgetIds: context.activeWidgets,
        enabledFeatureIds: [],
        connectedIntegrationIds: context.connectedServices,
        grantedPermissions: [],
        accountState: 'authenticated',
        density: 'comfortable',
        showBeta: false,
    });

    const inference = await runInference({
        userId,
        task: 'widget_recommendation',
        input: { goals: context.goals, activeWidgets: context.activeWidgets },
        context: { connectedServices: context.connectedServices },
    }).catch(() => null);

    return {
        context,
        widgets: widgets.slice(0, 8),
        inference,
    };
}

function isGoal(
    value: string,
): value is import('@/features/onboarding/types/goals').OnboardingGoalId {
    return [
        'productivity',
        'health-tracking',
        'recovery',
        'finance',
        'development',
        'writing-knowledge',
        'research',
        'automation',
        'learning',
        'personal-dashboard',
    ].includes(value);
}
