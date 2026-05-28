import type {
    WidgetBuilderPurpose,
    WidgetTransformationType,
    WidgetLayoutType,
    WidgetComplexity,
    WidgetIntentDomain,
} from '../types/synthesisWidgets';
import type { SynthesizedPermissionDef } from './widgetDefinitionInterfaces';

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
