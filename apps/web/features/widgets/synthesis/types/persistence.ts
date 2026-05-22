import type { WidgetPersistenceRecord } from '@/features/widgets/synthesis/widgetDefinitionSchema';

export type WidgetTemplateKind = WidgetPersistenceRecord['kind'];

export interface WidgetPreviewHistoryRecord {
    id: string;
    widgetDraftId: string;
    status: 'successful_preview' | 'failed_preview';
    issues: string[];
    createdAt: string;
}

export interface WidgetSourceConfigRecord {
    id: string;
    widgetId: string;
    sourceType: 'custom_api' | 'platform_provider' | 'manual';
    configRef: string;
    createdAt: string;
}
