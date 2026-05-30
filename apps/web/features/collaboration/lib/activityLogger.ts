import type { SupabaseClient } from '@supabase/supabase-js';
import { publishActivityEventSafe } from '@/features/activity/services/activityService';
import type { ActivityEventType } from '@/features/activity/types/activity';

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

// Map internal collaboration actions to platform activity event types.
// Only actions that represent meaningful user-facing milestones are bridged.
const PLATFORM_EVENT_MAP: Partial<Record<ActivityAction, ActivityEventType>> = {
    comment_added: 'collaboration.comment_added',
    handoff_created: 'collaboration.handoff_created',
    handoff_resolved: 'collaboration.handoff_completed',
    approval_requested: 'collaboration.approval_requested',
    approval_approved: 'collaboration.approval_approved',
    approval_rejected: 'collaboration.approval_rejected',
};

// Actions that should NOT produce platform activity events (too noisy or internal)
const SKIP_PLATFORM: Set<ActivityAction> = new Set([
    'member_role_changed',
    'invite_revoked',
    'handoff_updated',
    'approval_withdrawn',
]);

function buildPlatformTitle(
    action: ActivityAction,
    metadata: Record<string, unknown>,
): string {
    const name = (metadata.workspaceName as string | undefined) ?? 'workspace';
    const target = metadata.targetTitle as string | undefined;
    switch (action) {
        case 'comment_added':
            return target ? `Comment added on: ${target}` : 'Comment added';
        case 'handoff_created':
            return target ? `Handoff created: ${target}` : 'Handoff created';
        case 'handoff_resolved':
            return target
                ? `Handoff completed: ${target}`
                : 'Handoff completed';
        case 'approval_requested':
            return target
                ? `Approval requested: ${target}`
                : 'Approval requested';
        case 'approval_approved':
            return target
                ? `Approval approved: ${target}`
                : 'Approval approved';
        case 'approval_rejected':
            return target
                ? `Approval rejected: ${target}`
                : 'Approval rejected';
        default:
            return `Collaboration: ${action.replace(/_/g, ' ')} in ${name}`;
    }
}

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
    // Internal workspace activity log (preserved)
    void supabase.from('workspace_activity').insert({
        workspace_id: workspaceId,
        actor_id: actorId,
        actor_email: actorEmail ?? null,
        action,
        target_type: targetType ?? null,
        target_id: targetId ?? null,
        metadata,
    });

    // Bridge to platform Activity — only for meaningful milestones
    if (SKIP_PLATFORM.has(action)) return;
    const eventType = PLATFORM_EVENT_MAP[action];
    if (!eventType) return;

    await publishActivityEventSafe(supabase, {
        userId: actorId,
        source: 'collaboration',
        eventType,
        sourceId: targetId ?? workspaceId,
        sourceTable: targetType ?? 'collaboration_workspaces',
        category: 'content',
        severity: 'info',
        priority: 'normal',
        title: buildPlatformTitle(action, metadata),
        actionUrl: `/collaboration/${workspaceId}`,
        relatedEntities: [
            { type: 'workspace', id: workspaceId },
            ...(targetId && targetType
                ? [{ type: targetType, id: targetId }]
                : []),
        ],
        metadata: {
            workspaceId,
            action,
            targetType,
            targetId,
            ...metadata,
        },
    });
}
