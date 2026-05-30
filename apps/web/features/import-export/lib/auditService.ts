import type { SupabaseClient } from '@supabase/supabase-js';
import type { AuditEventInput } from '@/features/import-export/types/audit';

export async function recordAuditEvent(
    supabase: SupabaseClient,
    event: AuditEventInput,
) {
    const result = await supabase.from('audit_events').insert({
        user_id: event.userId,
        type: event.type,
        source: event.source,
        severity: event.severity,
        title: event.title,
        description: event.description,
        metadata: event.metadata ?? {},
        related_entity_ids: event.relatedEntityIds ?? [],
    });
    if (result.error) throw result.error;
}
