import type { SupabaseClient } from '@supabase/supabase-js';
import type { ActivityEventInput } from '@/features/activity/types/activity';

export function bridgeUrgentActivityToNotification(
    supabase: SupabaseClient,
    input: ActivityEventInput,
) {
    if (input.severity !== 'critical' && input.priority !== 'urgent') return;

    void supabase
        .from('notifications')
        .insert({
            user_id: input.userId,
            type: input.eventType ?? input.source,
            title: input.title,
            body: input.body ?? null,
            entity_type: input.sourceTable ?? null,
            ...(input.sourceId && /^[0-9a-f-]{36}$/i.test(input.sourceId)
                ? { entity_id: input.sourceId }
                : {}),
            href: input.actionUrl ?? null,
            read: false,
        })
        .then(({ error }) => {
            if (error) {
                console.error(
                    '[activityService] notification bridge failed',
                    error.message,
                );
            }
        });
}
