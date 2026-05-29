import type { LucideIcon } from 'lucide-react';

export type CollaborationRole = 'owner' | 'editor' | 'viewer' | 'automation';
export type CollaborationStatus = 'live' | 'idle' | 'blocked' | 'offline';
export type WorkspaceScope =
    | 'Dashboard'
    | 'Widgets'
    | 'Files'
    | 'Automations'
    | 'Knowledge'
    | 'Finance';

export interface CollaborationMetric {
    id: string;
    label: string;
    value: string;
    detail: string;
    icon: LucideIcon;
    tone: 'blue' | 'emerald' | 'amber' | 'rose';
}

export interface Collaborator {
    id: string;
    name: string;
    email: string;
    role: CollaborationRole;
    status: CollaborationStatus;
    scope: WorkspaceScope;
    focus: string;
    lastSeen: string;
}

export interface SharedWorkspace {
    id: string;
    name: string;
    scope: WorkspaceScope;
    status: CollaborationStatus;
    members: number;
    openThreads: number;
    syncHealth: number;
    lastChange: string;
    description: string;
}

export interface HandoffItem {
    id: string;
    title: string;
    owner: string;
    scope: WorkspaceScope;
    priority: 'low' | 'medium' | 'high' | 'critical';
    due: string;
    complete: boolean;
}

export interface WorkspaceEvent {
    id: string;
    actor: string;
    action: string;
    target: string;
    timestamp: string;
    scope: WorkspaceScope;
}

export interface PermissionTemplate {
    id: string;
    name: string;
    description: string;
    role: CollaborationRole;
    approvalsRequired: number;
    enabled: boolean;
}

export interface CollaborationFilters {
    query: string;
    scope: WorkspaceScope | 'all';
    status: CollaborationStatus | 'all';
}

// DB-backed record types
export interface MemberRecord {
    id: string;
    workspace_id: string;
    user_id: string | null;
    email: string | null;
    role: CollaborationRole;
    status: 'active' | 'invited' | 'removed';
    joined_at: string | null;
    created_at: string;
}

export interface InviteRecord {
    id: string;
    workspace_id: string;
    inviter_id: string;
    email: string;
    role: CollaborationRole;
    token: string;
    status: 'pending' | 'accepted' | 'revoked' | 'expired';
    expires_at: string;
    created_at: string;
}

export interface ActivityRecord {
    id: string;
    workspace_id: string;
    actor_id: string | null;
    actor_email: string | null;
    action: string;
    target_type: string | null;
    target_id: string | null;
    metadata: Record<string, unknown>;
    created_at: string;
}

export interface ApprovalRecord {
    id: string;
    workspace_id: string;
    handoff_id: string | null;
    requester_id: string;
    title: string;
    description: string | null;
    status: 'pending' | 'approved' | 'rejected' | 'withdrawn';
    approvals_required: number;
    approvals_received: number;
    resolved_at: string | null;
    created_at: string;
    updated_at: string;
}

export interface CommentRecord {
    id: string;
    workspace_id: string;
    handoff_id: string | null;
    author_id: string;
    body: string;
    parent_id: string | null;
    edited: boolean;
    created_at: string;
    updated_at: string;
}
