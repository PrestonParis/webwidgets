import type { SupabaseClient } from '@supabase/supabase-js';

export type ActivityAction =
    | 'workspace_created'
    | 'workspace_updated'
    | 'member_invited'
    | 'member_joined'
    | 'member_removed'
    | 'member_role_changed'
    | 'invite_revoked'
    | 'handoff_created'
    | 'handoff_updated'
    | 'handoff_resolved'
    | 'handoff_deleted'
    | 'approval_requested'
    | 'approval_approved'
    | 'approval_rejected'
    | 'approval_withdrawn'
    | 'comment_added';

export async function logActivity(
    supabase: SupabaseClient,
    {
        workspaceId,
        actorId,
        actorEmail,
        action,
        targetType,
        targetId,
        metadata = {},
    }: {
        workspaceId: string;
        actorId: string;
        actorEmail?: string;
        action: ActivityAction;
        targetType?: string;
        targetId?: string;
        metadata?: Record<string, unknown>;
    },
): Promise<void> {
    // Fire and forget — never block the main operation on logging
    void supabase.from('workspace_activity').insert({
        workspace_id: workspaceId,
        actor_id: actorId,
        actor_email: actorEmail ?? null,
        action,
        target_type: targetType ?? null,
        target_id: targetId ?? null,
        metadata,
    });
}
