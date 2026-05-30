import type { SupabaseClient } from '@supabase/supabase-js';
import { recordAuditEvent } from '@/features/import-export/lib/auditService';

export type EventType =
    | 'file_uploaded'
    | 'file_converted'
    | 'file_text_extracted'
    | 'document_created'
    | 'document_updated'
    | 'artifact_created'
    | 'artifact_updated'
    | 'artifact_exported'
    | 'job_created'
    | 'job_started'
    | 'job_completed'
    | 'job_failed';

interface LogEventOptions {
    entityType: string;
    entityId: string;
    title: string;
    description?: string;
    metadata?: Record<string, unknown>;
}

export async function logEvent(
    supabase: SupabaseClient,
    userId: string,
    type: EventType,
    opts: LogEventOptions,
): Promise<void> {
    const isError = type === 'job_failed';
    try {
        await recordAuditEvent(supabase, {
            userId,
            type,
            source: 'platform',
            severity: isError ? 'error' : 'info',
            title: opts.title,
            ...(opts.description !== undefined
                ? { description: opts.description }
                : {}),
            metadata: {
                entityType: opts.entityType,
                entityId: opts.entityId,
                ...(opts.metadata ?? {}),
            },
            relatedEntityIds: [opts.entityId],
        });
    } catch {
        // Event logging should never break the primary operation
        console.error('[eventLogger] Failed to log event', {
            type,
            userId,
            entityId: opts.entityId,
        });
    }
}
