import type { WidgetComponentCategory } from './synthesisWidgets';

export interface ComponentRegistryEntry {
    id: string;
    name: string;
    category: WidgetComponentCategory;
    description: string;
    acceptedDataShape: string;
    requiredProps: string[];
    allowedProps: string[];
    preview: string;
    supportedLayouts: string[];
    supportedActions: string[];
    emptyState: string;
    loadingState: string;
    errorState: string;
    accessibilityNotes: string;
    previewSupport: boolean;
}
