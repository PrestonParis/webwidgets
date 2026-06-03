import type {
    SynthesizedWidgetSource,
    SynthesizedWidgetStatus,
    WidgetBuilderStepId,
    WidgetPreviewMode,
} from '../types/synthesisWidgets';
import type {
    SynthesizedPermissionDef,
    SynthesizedWidgetDefinition,
} from './widgetDefinitionInterfaces';

export interface WidgetPersistenceRecord {
    id: string;
    ownerId: string;
    kind:
        | 'synthesized_draft'
        | 'saved_custom_widget'
        | 'template'
        | 'version'
        | 'preview_history'
        | 'source_config';
    definition: Partial<SynthesizedWidgetDefinition>;
    version: number;
    createdAt: string;
    updatedAt: string;
}

export interface CustomWidgetDefinition extends SynthesizedWidgetDefinition {
    ownerId?: string | undefined;
    source: SynthesizedWidgetSource;
    status: SynthesizedWidgetStatus;
    createdAt: string;
    updatedAt: string;
}

export interface WidgetBuilderStepConfig {
    id: WidgetBuilderStepId;
    label: string;
    description: string;
    optional: boolean;
}

export interface WidgetValidationIssue {
    field: string;
    message: string;
    severity: 'error' | 'warning';
}

export interface WidgetPreviewState {
    mode: WidgetPreviewMode;
    sampleData: Record<string, unknown>;
    resolvedComponents: string[];
    permissionSummary: string[];
}

export interface WidgetBuilderState {
    stepId: WidgetBuilderStepId;
    stepIndex: number;
    definition: Partial<SynthesizedWidgetDefinition>;
    nlQuery: string;
    isDirty: boolean;
    isValid: boolean;
    validationIssues: WidgetValidationIssue[];
    previewMode: WidgetPreviewMode;
    visitedStepIds: string[];
}

export interface WidgetSynthesisCandidate {
    id: string;
    title: string;
    description: string;
    confidence: number;
    emoji: string;
    requiredDataSources: string[];
    suggestedComponents: string[];
    suggestedActions: string[];
    missingCapabilities: string[];
    buildableNow?: boolean | undefined;
    requiredPermissions?: string[] | undefined;
    explanation?: string[] | undefined;
    definitionDraft: SynthesizedWidgetDefinition;
}

export interface AssembledWidget {
    definition: SynthesizedWidgetDefinition;
    resolvedDataSources: string[];
    resolvedComponents: string[];
    resolvedActions: string[];
    requiredPermissions: SynthesizedPermissionDef[];
    preview: WidgetPreviewState;
    isValid: boolean;
    issues: WidgetValidationIssue[];
    missingCapabilities?: string[] | undefined;
    buildableNow?: boolean | undefined;
}
