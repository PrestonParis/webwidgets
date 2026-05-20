import type { WidgetPermission } from '@/features/platform/types/widgetTypes';

export type SynthesizedWidgetSource =
    | 'manual_builder'
    | 'search_synthesis'
    | 'system_template';
export type SynthesizedWidgetStatus =
    | 'draft'
    | 'active'
    | 'disabled'
    | 'invalid';
export type WidgetBuilderPurpose =
    | 'track'
    | 'display'
    | 'trigger'
    | 'monitor'
    | 'visualize'
    | 'connect_api'
    | 'dashboard_card'
    | 'automation'
    | 'analyze'
    | 'plan'
    | 'custom';
export type WidgetDataSourceType =
    | 'local_mock'
    | 'manual'
    | 'app_state'
    | 'feature_data'
    | 'api'
    | 'oauth_placeholder'
    | 'uploaded_file'
    | 'transformed'
    | 'combined';
export type WidgetTransformationType =
    | 'pick_fields'
    | 'rename_fields'
    | 'filter_rows'
    | 'sort_rows'
    | 'group_by_time'
    | 'aggregate'
    | 'convert_dates'
    | 'convert_currency'
    | 'calc_derived'
    | 'map_to_categories'
    | 'join_sources'
    | 'normalize_records'
    | 'deduplicate'
    | 'rank'
    | 'score'
    | 'bucket'
    | 'time_window'
    | 'rolling_average'
    | 'threshold_detection'
    | 'anomaly_placeholder'
    | 'correlation_placeholder'
    | 'entity_extraction_placeholder'
    | 'summarization_placeholder'
    | 'format_percentage'
    | 'merge_timelines';
export type WidgetLayoutType =
    | 'small_card'
    | 'metric_card'
    | 'list'
    | 'timeline'
    | 'chart'
    | 'table'
    | 'panel'
    | 'split'
    | 'tabbed'
    | 'compact'
    | 'expanded'
    | 'dense_dashboard_card'
    | 'full_page_module'
    | 'chart_table'
    | 'timeline_detail'
    | 'feed_inspector'
    | 'kpi_drilldown'
    | 'form_preview'
    | 'comparison';
export type WidgetComponentCategory =
    | 'layout'
    | 'display'
    | 'input'
    | 'visualization'
    | 'action'
    | 'status';
export type WidgetBuilderStepId =
    | 'purpose'
    | 'data_source'
    | 'transform'
    | 'layout'
    | 'components'
    | 'actions'
    | 'automations'
    | 'permissions'
    | 'preview'
    | 'save';
export type WidgetPreviewMode =
    | 'compact'
    | 'expanded'
    | 'empty'
    | 'loading'
    | 'error';
export type WidgetCreatorTag = 'system' | 'user' | 'ai';
export type WidgetComplexity = 'simple' | 'moderate' | 'advanced';

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
    scope: WidgetPermission | string;
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

export type WidgetIntentDomain =
    | 'finance'
    | 'communication'
    | 'productivity'
    | 'health'
    | 'recovery'
    | 'research'
    | 'news'
    | 'calendar'
    | 'developer'
    | 'weather'
    | 'sports'
    | 'custom'
    | 'system';

export interface WidgetIntent {
    rawQuery: string;
    domain: WidgetIntentDomain;
    purpose: WidgetBuilderPurpose;
    entities: string[];
    dataNeeds: string[];
    timeHorizon:
        | 'realtime'
        | 'today'
        | 'week'
        | 'month'
        | 'quarter'
        | 'long_range'
        | 'unknown';
    visualizationNeeds: Array<
        | 'metric'
        | 'chart'
        | 'table'
        | 'timeline'
        | 'feed'
        | 'form'
        | 'map'
        | 'graph'
        | 'comparison'
    >;
    actionsNeeded: string[];
    urgency: 'low' | 'normal' | 'high';
    privacySensitivity: 'low' | 'medium' | 'high';
    likelyIntegrations: string[];
    complexity: WidgetComplexity;
}

export interface CapabilityGraphNode {
    id: string;
    kind: 'data_source' | 'component' | 'transformation' | 'action' | 'layout';
    label: string;
    domain: string;
    available: boolean;
    permissions: string[];
    provides: string[];
    requires: string[];
    unavailableReason?: string | undefined;
}

export interface WidgetSynthesisPlan {
    id: string;
    intent: WidgetIntent;
    dataSources: string[];
    fallbackDataSources: string[];
    transformations: WidgetTransformationType[];
    components: string[];
    layout: WidgetLayoutType;
    actions: string[];
    permissions: SynthesizedPermissionDef[];
    previewStrategy:
        | 'sample_data'
        | 'mock_provider'
        | 'api_test_result'
        | 'empty_state';
    missingRequirements: string[];
    confidence: number;
    buildableNow: boolean;
    explanation: string[];
}

export interface CustomApiSourceConfig {
    name: string;
    baseUrl: string;
    endpoint: string;
    method: 'GET' | 'POST';
    headers: Record<string, string>;
    queryParams: Record<string, string>;
    bodyTemplate?: Record<string, unknown> | undefined;
    auth: {
        type:
            | 'none'
            | 'api_key'
            | 'bearer_token'
            | 'oauth_future'
            | 'user_secret_future';
        headerName?: string | undefined;
        secretRef?: string | undefined;
    };
    refreshIntervalSeconds: number;
    responseSchema: Record<string, string>;
    sampleResponse: unknown;
    mappingRules: Array<{ from: string; to: string; type: string }>;
    rateLimit: { requests: number; intervalSeconds: number };
}

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

export const BUILDER_STEPS: WidgetBuilderStepConfig[] = [
    {
        id: 'purpose',
        label: 'Purpose',
        description: 'What this widget does',
        optional: false,
    },
    {
        id: 'data_source',
        label: 'Data Source',
        description: 'Where data comes from',
        optional: false,
    },
    {
        id: 'transform',
        label: 'Transform',
        description: 'Clean and reshape data',
        optional: true,
    },
    {
        id: 'layout',
        label: 'Layout',
        description: 'Overall widget structure',
        optional: false,
    },
    {
        id: 'components',
        label: 'Components',
        description: 'UI building blocks',
        optional: false,
    },
    {
        id: 'actions',
        label: 'Actions',
        description: 'What users can do',
        optional: true,
    },
    {
        id: 'automations',
        label: 'Automations',
        description: 'Automatic behaviors',
        optional: true,
    },
    {
        id: 'permissions',
        label: 'Permissions',
        description: 'Access review',
        optional: false,
    },
    {
        id: 'preview',
        label: 'Preview',
        description: 'Test your widget',
        optional: false,
    },
    {
        id: 'save',
        label: 'Save',
        description: 'Name and add to dashboard',
        optional: false,
    },
];
