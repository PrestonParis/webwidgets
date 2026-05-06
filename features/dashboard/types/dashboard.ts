import { ReactNode } from 'react';
import { Tracker } from '@/features/recovery/types/recovery';

export type WidgetType =
    | 'journal'
    | 'email'
    | 'recovery'
    | 'converter'
    | 'recovery-empty'
    | 'chess'
    | 'pomodoro'
    | 'todo'
    | 'weather'
    | 'worldclock'
    | 'currency'
    | 'mood'
    | 'habit'
    | 'scratchpad'
    | 'countdown'
    | 'folder';

export interface WidgetConfig {
    id: string;
    type: WidgetType;
    visible: boolean;
    columnSpan: number; // For weaving and resizing
    containerId: string; // "main", "bucket", or a Folder ID
    order: number; // For manual ordering within a container
    props?: {
        tracker?: Tracker; // recovery
        initialUnit?: string; // converter
        folderName?: string; // folder
    };
}

export interface DashboardGridProps {
    layout: WidgetConfig[];
    onLayoutChange: (next: WidgetConfig[]) => void;
    onToggleVisible: (id: string) => void;
    onReset: (id: string, newStart: string) => void;
    onOpenFolder: (id: string) => void;
    onRenameFolder: (id: string, name: string) => void;
    onDeleteFolder: (id: string) => void;
}

export interface HiddenWidgetsTrayProps {
    hidden: WidgetConfig[];
    onRestore: (id: string) => void;
}

export interface WidgetWrapperProps {
    config: WidgetConfig;
    onToggleVisible: (id: string) => void;
    children: ReactNode;
}
