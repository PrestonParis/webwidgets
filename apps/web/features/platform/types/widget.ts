export type WidgetSurface =
    | 'dashboard'
    | 'page'
    | 'sidebar'
    | 'notification'
    | 'onboarding';
export type WidgetCapability =
    | 'read'
    | 'write'
    | 'visualize'
    | 'automate'
    | 'import'
    | 'export'
    | 'analyze';
export type WidgetRequirement =
    | 'integration'
    | 'consent'
    | 'permission'
    | 'feature'
    | 'beta';
export type WidgetPermission =
    | 'tracking_sensitive'
    | 'finance_data'
    | 'ai_analysis'
    | 'automation_actions'
    | 'external_imports';
export type WidgetDataSource =
    | 'supabase'
    | 'integration'
    | 'local'
    | 'computed'
    | 'future-provider';
export type WidgetVisualization =
    | 'card'
    | 'list'
    | 'chart'
    | 'timeline'
    | 'heatmap'
    | 'table'
    | 'form'
    | 'console';
export type WidgetCategory =
    | 'productivity'
    | 'tracking'
    | 'finance'
    | 'knowledge'
    | 'developer'
    | 'automation'
    | 'integration'
    | 'system';
export type WidgetSizePreset = 'sm' | 'md' | 'lg' | 'wide' | 'full';
export type WidgetBetaState = 'stable' | 'beta' | 'coming-soon' | 'unavailable';

export interface WidgetAction {
    id: string;
    label: string;
    capability: WidgetCapability;
    requiresConsent?: WidgetPermission;
    betaState?: WidgetBetaState;
}

export interface WidgetDefinition {
    id: string;
    type: string;
    featureId: string;
    name: string;
    description: string;
    category: WidgetCategory;
    surfaces: WidgetSurface[];
    capabilities: WidgetCapability[];
    requirements: WidgetRequirement[];
    permissions: WidgetPermission[];
    dataSources: WidgetDataSource[];
    visualizations: WidgetVisualization[];
    sizePresets: WidgetSizePreset[];
    betaState: WidgetBetaState;
    goals: string[];
    actions: WidgetAction[];
}
