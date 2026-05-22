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
