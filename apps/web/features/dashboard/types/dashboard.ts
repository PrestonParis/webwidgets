import { ReactNode } from 'react';
import { Tracker } from '@/features/recovery/types/recovery';

export type WidgetType =
    | 'texteditor'
    | 'research-queue'
    | 'activity'
    | 'automation'
    | 'developer'
    | 'email'
    | 'recovery'
    | 'converter'
    | 'countdown'
    | 'currency'
    | 'recovery-empty'
    | 'chess'
    | 'timekeeping'
    | 'pomodoro'
    | 'todo'
    | 'habit'
    | 'weather'
    | 'worldclock'
    | 'mood'
    | 'journal'
    | 'notes'
    | 'scratchpad'
    | 'calendar'
    | 'form-filler'
    | 'datahealth'
    | 'tracking'
    | 'tracking-sleep'
    | 'tracking-workout'
    | 'tracking-meal'
    | 'tracking-mood'
    | 'tracking-supplements'
    | 'context-diagram'
    | 'chat'
    | 'finance'
    | 'news'
    | 'widget-builder'
    | 'files'
    | 'view'
    | 'folder'
    | 'reading'
    | 'collaboration'
    | 'command-center'
    | 'accessibility'
    | 'memorization'
    | 'creative'
    | 'insight-cards'
    | 'action-cards';

export type SnapRule = 'free' | 'grid' | 'edges' | 'guides';
export type LayoutMode = 'grid' | 'free';

export type RelationshipType =
    | 'independent'
    | 'attached'
    | 'embedded'
    | 'merged'
    | 'dependent'
    | 'reactive'
    | 'mirrored';

export interface WidgetConfig {
    id: string;
    type: WidgetType;
    visible: boolean;
    columnSpan: number; // For weaving and resizing
    containerId: string; // "main", "bucket", or a Folder ID
    order: number; // For manual ordering within a container
    /** Free-canvas X position (px) */
    x?: number;
    /** Free-canvas Y position (px) */
    y?: number;
    /** Free-canvas width (px) */
    w?: number;
    /** Free-canvas min-height (px) */
    h?: number;
    /** Not rendered anywhere; restore from Widget Library */
    unpresented?: boolean;
    /** Relationship to other widgets */
    relationship?: RelationshipType;
    /** Free-canvas glue group — widgets sharing this ID move as a unit (gap connector) */
    glueGroupId?: string;
    /** Free-canvas weave group — widgets sharing this ID are rendered as a single tabbed card */
    weaveGroupId?: string;
    props?: {
        tracker?: Tracker; // recovery
        initialUnit?: string; // converter
        folderName?: string; // folder
    };
}

export interface DashboardGridProps {
    layout: WidgetConfig[];
    onLayoutChange: (next: WidgetConfig[]) => void;
    onDragComplete?: () => void;
    onToggleVisible: (id: string) => void;
    onReset: (id: string, newStart: string) => void;
    onOpenFolder: (id: string) => void;
    onRenameFolder: (id: string, name: string) => void;
    onDeleteFolder: (id: string) => void;
    onMoveToBucket?: (id: string) => void;
    onUnpresent?: (id: string) => void;
}

export interface HiddenWidgetsTrayProps {
    hidden: WidgetConfig[];
    onRestore: (id: string) => void;
}

export interface WidgetWrapperProps {
    config: WidgetConfig;
    onToggleVisible: (id: string) => void;
    onRemove?: (id: string) => void;
    onMoveToBucket?: (id: string) => void;
    onUnpresent?: (id: string) => void;
    children: ReactNode;
}
