import type { ReactNode } from 'react';
import type { DiagramViewport } from './diagram';

export type ContextEntryType =
    | 'profile'
    | 'goal'
    | 'widget'
    | 'integration'
    | 'query_gist'
    | 'insight';

export interface ContextEntry {
    id: string;
    userId: string;
    entryType: ContextEntryType;
    entityId: string;
    label: string;
    data: Record<string, unknown>;
    linkedTo: string[];
    createdAt: string;
    updatedAt: string;
}

export interface ContextNode extends ContextEntry {
    x: number;
    y: number;
}

export interface ContextEdge {
    from: string;
    to: string;
    label?: string;
}

export interface ContextGraph {
    nodes: ContextNode[];
    edges: ContextEdge[];
}

export interface ContextPermissions {
    captureWidgetInteractions: boolean;
    includeQueryGists: boolean;
    aiPersonalization: boolean;
}

export interface ContextEntryRow {
    id: string;
    user_id: string;
    entry_type: string;
    entity_id: string;
    label: string;
    data: Record<string, unknown>;
    linked_to: string[];
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
        createdAt: row.created_at,
        updatedAt: row.updated_at,
    };
}

export interface UpsertEntryPayload {
    entityId: string;
    entryType: ContextEntryType;
    label: string;
    data?: Record<string, unknown>;
    linkedTo?: string[];
}

export interface ContextEdgeLayerProps {
    graph: ContextGraph;
    selectedId: string | null;
}

export interface ContextGraphCanvasProps {
    graph: ContextGraph;
    selectedId: string | null;
    viewport: DiagramViewport;
    onSelectNode: (id: string | null) => void;
    onMouseDown: (e: React.MouseEvent) => void;
    onMouseMove: (e: React.MouseEvent) => void;
    onMouseUp: () => void;
}

export interface ContextNodeCardProps {
    node: ContextNode;
    selected: boolean;
    onClick: (entityId: string) => void;
}

export interface ContextSidebarProps {
    node: ContextNode | null;
    onClose: () => void;
    onDelete: (entityId: string) => void;
}

export interface ContextCaptureProviderProps {
    children: ReactNode;
    permissionsEnabled?: boolean;
    onCapture?: (payload: UpsertEntryPayload) => void;
}
