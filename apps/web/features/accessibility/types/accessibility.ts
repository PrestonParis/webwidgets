import type { LucideIcon } from 'lucide-react';

export type AccessibilityCategory =
    | 'Vision'
    | 'Motion'
    | 'Keyboard'
    | 'Cognitive'
    | 'Audio';

export type AccessibilitySeverity = 'low' | 'medium' | 'high' | 'critical';
export type AccessibilityStatus = 'passing' | 'needs-review' | 'failing';

export interface AccessibilityMetric {
    id: string;
    label: string;
    value: string;
    detail: string;
    icon: LucideIcon;
    tone: 'emerald' | 'blue' | 'amber' | 'rose';
}

export interface AccessibilityPreference {
    id: string;
    category: AccessibilityCategory;
    label: string;
    description: string;
    enabled: boolean;
    control: 'toggle' | 'slider' | 'select';
    value?: number | string;
}

export interface AccessibilityAuditItem {
    id: string;
    title: string;
    surface: string;
    category: AccessibilityCategory;
    severity: AccessibilitySeverity;
    status: AccessibilityStatus;
    recommendation: string;
}

export interface AccessibilityMode {
    id: string;
    name: string;
    description: string;
    category: AccessibilityCategory;
    enabled: boolean;
    affectedSurfaces: string[];
}

export interface AccessibilityFilters {
    query: string;
    category: AccessibilityCategory | 'all';
    status: AccessibilityStatus | 'all';
}
