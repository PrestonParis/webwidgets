import type { WidgetTransformationType } from './synthesisWidgets';

export interface TransformationRegistryEntry {
    id: WidgetTransformationType;
    label: string;
    description: string;
    inputShape: string;
    outputShape: string;
    configSchema: Record<string, string>;
    safe: boolean;
    example: string;
    compatibleComponents: string[];
    complexity: 'simple' | 'moderate' | 'advanced';
    previewSupport: boolean;
}
