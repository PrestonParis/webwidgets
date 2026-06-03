import type { ReactNode } from 'react';
import type { DiagramViewport } from './diagram';
import type {
    CanonicalContextEdge,
    ContextPermissionSettings,
} from './schemas';

export type ContextEntryType =
    | 'profile'
    | 'goal'
    | 'project'
    | 'widget'
    | 'widget_activity'
    | 'file'
    | 'document'
    | 'artifact'
    | 'chat'
    | 'chat_gist'
    | 'email'
    | 'calendar_event'
    | 'todo'
    | 'automation'
    | 'automation_run'
    | 'integration'
    | 'journal_entry'
    | 'mood_entry'
    | 'habit_entry'
    | 'recovery_entry'
    | 'recommendation'
    | 'query_gist'
    | 'insight'
    | 'memory'
    | 'agent_action'
    | 'import_export_object';

export interface ContextEntry {
    id: string;
    userId: string;
    entryType: ContextEntryType;
    entityId: string;
    label: string;
    data: Record<string, unknown>;
    summary?: string | null | undefined;
    tags?: string[] | undefined;
    sourceType?: string | undefined;
    sourceId?: string | null | undefined;
    sourceTable?: string | null | undefined;
    sourceCollection?: string | null | undefined;
    createdBy?: string | null | undefined;
    createdByType?: 'user' | 'system' | 'agent' | 'integration' | undefined;
    confidence?: number | undefined;
    status?: 'active' | 'archived' | 'stale' | 'deleted' | undefined;
    visibility?: string | undefined;
    permissions?: string[] | undefined;
    lastObservedAt?: string | null | undefined;
    lastVerifiedAt?: string | null | undefined;
    metadata?: Record<string, unknown> | undefined;
    linkedTo: string[];
    createdAt: string;
    updatedAt: string;
}

export interface ContextNode extends ContextEntry {
    x: number;
    y: number;
    connectionCount?: number;
    activityScore?: number;
}

export interface ContextEdge {
    id?: string;
    from: string;
    to: string;
    label?: string;
    kind?: CanonicalContextEdge['kind'];
    weight?: number;
    confidence?: number;
    sourceType?: string;
    sourceId?: string | null;
    createdBy?: string | null;
    createdByType?: 'user' | 'system' | 'agent' | 'integration';
    metadata?: Record<string, unknown>;
    createdAt?: string;
    updatedAt?: string;
}

export interface ContextGraph {
    nodes: ContextNode[];
    edges: ContextEdge[];
}

export type ContextPermissions = ContextPermissionSettings & {
    includeQueryGists?: boolean;
    aiPersonalization?: boolean;
};

export interface ContextEntryRow {
    id: string;
    user_id: string;
    entry_type: string;
    entity_id: string;
    label: string;
    data: Record<string, unknown>;
    linked_to: string[];
    summary?: string | null;
    tags?: string[] | null;
    source_type?: string | null;
    source_id?: string | null;
    source_table?: string | null;
    source_collection?: string | null;
    created_by?: string | null;
    created_by_type?: string | null;
    confidence?: number | null;
    status?: string | null;
    visibility?: string | null;
    permissions?: string[] | null;
    last_observed_at?: string | null;
    last_verified_at?: string | null;
    metadata?: Record<string, unknown> | null;
    created_at: string;
    updated_at: string;
}

export function rowToEntry(row: ContextEntryRow): ContextEntry {
    return {
        id: row.id,
        userId: row.user_id,
        entryType: row.entry_type as ContextEntryType,
        entityId: row.entity_id,
        label: row.label,
        data: row.data,
        linkedTo: row.linked_to,
        summary: row.summary,
        tags: row.tags ?? [],
        sourceType: row.source_type ?? undefined,
        sourceId: row.source_id,
        sourceTable: row.source_table,
        sourceCollection: row.source_collection,
        createdBy: row.created_by,
        createdByType: row.created_by_type as ContextEntry['createdByType'],
        confidence: row.confidence ?? 1,
        status: row.status as ContextEntry['status'],
        visibility: row.visibility ?? 'private',
        permissions: row.permissions ?? ['private'],
        lastObservedAt: row.last_observed_at,
        lastVerifiedAt: row.last_verified_at,
        metadata: row.metadata ?? {},
        createdAt: row.created_at,
        updatedAt: row.updated_at,
    };
}

export interface UpsertEntryPayload {
    entityId: string;
    entryType: ContextEntryType;
    label: string;
    summary?: string | null | undefined;
    data?: Record<string, unknown> | undefined;
    tags?: string[] | undefined;
    sourceType?: string | undefined;
    sourceId?: string | null | undefined;
    sourceTable?: string | null | undefined;
    sourceCollection?: string | null | undefined;
    createdBy?: string | null | undefined;
    createdByType?: 'user' | 'system' | 'agent' | 'integration' | undefined;
    confidence?: number | undefined;
    status?: 'active' | 'archived' | 'stale' | 'deleted' | undefined;
    visibility?: string | undefined;
    permissions?: string[] | undefined;
    lastVerifiedAt?: string | null | undefined;
    metadata?: Record<string, unknown> | undefined;
    linkedTo?: string[] | undefined;
}

export interface ContextEdgeLayerProps {
    graph: ContextGraph;
    selectedId: string | null;
}

export type DiagramMode = 'view' | 'pan' | 'edit';

export interface ContextGraphCanvasProps {
    graph: ContextGraph;
    selectedId: string | null;
    viewport: DiagramViewport;
    lockLayout?: boolean;
    mode?: DiagramMode;
    onSelectNode: (id: string | null) => void;
    onMouseDown: (e: React.MouseEvent) => void;
    onMouseMove: (e: React.MouseEvent) => void;
    onMouseUp: () => void;
    onWheel?: (e: React.WheelEvent) => void;
    onNodePointerDown?: (entityId: string, e: React.PointerEvent) => void;
    onNodeDoubleClick?: (entityId: string) => void;
}

export interface ContextNodeCardProps {
    node: ContextNode;
    selected: boolean;
    dimmed?: boolean;
    onClick: (entityId: string) => void;
    onPointerDown?: (entityId: string, e: React.PointerEvent) => void;
    onDoubleClick?: (entityId: string) => void;
    lockLayout?: boolean;
}

export interface ContextSidebarProps {
    node: ContextNode | null;
    graph: ContextGraph;
    onSelectNode: (entityId: string) => void;
    onUpsert: (payload: UpsertEntryPayload) => Promise<void>;
    onClose: () => void;
    onDelete: (entityId: string) => void;
}

export interface ContextCaptureProviderProps {
    children: ReactNode;
    permissionsEnabled?: boolean;
    onCapture?: (payload: UpsertEntryPayload) => void;
}
