import type { LucideIcon } from 'lucide-react';

export type CreativeTool =
    | 'select'
    | 'pen'
    | 'shape'
    | 'text'
    | 'image'
    | 'comment';

export type CreativeAssetType = 'shape' | 'text' | 'image' | 'note';
export type CreativeExportFormat = 'png' | 'svg' | 'pdf' | 'widget';

export interface CreativeMetric {
    id: string;
    label: string;
    value: string;
    detail: string;
    icon: LucideIcon;
    tone: 'blue' | 'emerald' | 'amber' | 'rose';
}

export interface CreativeLayer {
    id: string;
    name: string;
    type: CreativeAssetType;
    visible: boolean;
    locked: boolean;
    x: number;
    y: number;
    width: number;
    height: number;
    color: string;
}

export interface CreativeTemplate {
    id: string;
    title: string;
    description: string;
    format: string;
    recommendedFor: string;
    selected: boolean;
}

export interface CreativeExportTarget {
    id: CreativeExportFormat;
    label: string;
    description: string;
    ready: boolean;
}
