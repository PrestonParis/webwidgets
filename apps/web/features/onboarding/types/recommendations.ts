import type { WidgetType } from '@/features/dashboard/types/dashboard';

export interface WidgetRecommendation {
    widgetType: WidgetType;
    reason: string;
    priority: number;
}

export interface WorkspaceRecommendation {
    widgets: WidgetRecommendation[];
    trackingSystems: string[];
    layoutNotes: string[];
    integrations: string[];
    automations: string[];
}
