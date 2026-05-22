import { db } from '@/lib/db/supabase';
import type { Json } from '@/types/supabase';

export interface WidgetInstanceInput {
    userId: string;
    widgetId: string;
    featureId: string;
    config: Json;
    active: boolean;
}

export async function saveWidgetInstance(input: WidgetInstanceInput) {
    const { error } = await db.from('widget_instances').upsert({
        user_id: input.userId,
        widget_id: input.widgetId,
        feature_id: input.featureId,
        config: input.config,
        active: input.active,
        updated_at: new Date().toISOString(),
    });
    if (error) throw error;
}

export async function saveFeatureSettings(
    userId: string,
    featureId: string,
    settings: Json,
) {
    const { error } = await db.from('feature_settings').upsert(
        {
            user_id: userId,
            feature_id: featureId,
            settings,
            updated_at: new Date().toISOString(),
        },
        { onConflict: 'user_id,feature_id' },
    );
    if (error) throw error;
}
