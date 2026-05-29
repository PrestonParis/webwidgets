import type {
    WidgetBuilderPurpose,
    WidgetDataSourceType,
    WidgetTransformationType,
    WidgetLayoutType,
    WidgetCreatorTag,
    WidgetComplexity,
} from '../types/synthesisWidgets';

export interface SynthesizedDataSourceDef {
    id: string;
    type: WidgetDataSourceType;
    label: string;
    schema: Record<string, string>;
    transformations: WidgetTransformationType[];
    config?: Record<string, unknown> | undefined;
    unavailableReason?: string | undefined;
}

export interface SynthesizedComponentDef {
    registryId: string;
    props: Record<string, unknown>;
    dataKey?: string | undefined;
    order: number;
}

export interface SynthesizedActionDef {
    registryId: string;
    label: string;
    config?: Record<string, unknown> | undefined;
}

export interface SynthesizedAutomationDef {
    trigger: string;
    action: string;
    condition?: string | undefined;
    schedule?: string | undefined;
}

export interface SynthesizedPermissionDef {
    scope: string;
    reason: string;
    required: boolean;
}

export interface SynthesizedTransformationDef {
    type: WidgetTransformationType;
    config: Record<string, unknown>;
}

export interface SynthesizedWidgetDefinition {
    id: string;
    name: string;
    description: string;
    category: string;
    purpose: WidgetBuilderPurpose;
    icon?: string | undefined;
    dataSources: SynthesizedDataSourceDef[];
    transformations: SynthesizedTransformationDef[];
    layout: WidgetLayoutType;
    components: SynthesizedComponentDef[];
    actions: SynthesizedActionDef[];
    automations: SynthesizedAutomationDef[];
    permissions: SynthesizedPermissionDef[];
    metadata: {
        version: string;
        createdBy: WidgetCreatorTag;
        tags: string[];
        complexity: WidgetComplexity;
        intentQuery?: string | undefined;
        buildableNow?: boolean | undefined;
        missingCapabilities?: string[] | undefined;
    };
}
