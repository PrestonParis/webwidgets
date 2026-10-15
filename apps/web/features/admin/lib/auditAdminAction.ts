import { createAdminClient } from '@/lib/supabase/adminClient';
import type { Json } from '@/types/supabase';

export type AdminResourceType =
    | 'user'
    | 'widget'
    | 'feature_flag'
    | 'action'
    | 'job'
    | 'email'
    | 'note'
    | 'setting';

export interface AuditPayload {
    actorId: string;
    action: string;
    resourceType: AdminResourceType;
    resourceId?: string;
    before?: Record<string, unknown>;
    after?: Record<string, unknown>;
    ip?: string;
    userAgent?: string;
}

/**
 * Writes a row to admin_audit_logs via the service-role client.
 * Call this after every admin mutation — never before, so partial writes don't get logged.
 */
export async function auditAdminAction(payload: AuditPayload): Promise<void> {
    const admin = createAdminClient();

    const { error } = await admin.from('admin_audit_logs').insert({
        actor_id: payload.actorId,
        action: payload.action,
        resource_type: payload.resourceType,
        resource_id: payload.resourceId ?? null,
        before: (payload.before ?? null) as Json,
        after: (payload.after ?? null) as Json,
        ip: payload.ip ?? null,
        user_agent: payload.userAgent ?? null,
    });

    if (error) {
        console.error('[audit] failed to write audit log:', error.message);
    }
}

/** Extract client IP from request headers (works behind Vercel/Cloudflare). */
export function getClientIp(req: Request): string | undefined {
    return (
        req.headers.get('x-real-ip') ??
        req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ??
        undefined
    );
}
