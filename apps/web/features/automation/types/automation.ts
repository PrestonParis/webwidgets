export type AutomationTriggerType =
    | 'schedule'
    | 'event'
    | 'threshold'
    | 'manual';
export type AutomationBackendTriggerType =
    | AutomationTriggerType
    | 'activity_event'
    | 'email_received'
    | 'calendar_event'
    | 'tracking_logged'
    | 'threshold_crossed';
export type AutomationConditionType =
    | 'time_window'
    | 'service_connected'
    | 'consent_granted'
    | 'data_available';
export type AutomationActionType =
    | 'notify'
    | 'summarize'
    | 'create_task'
    | 'request_approval'
    | 'webhook_placeholder';
export type AutomationConfigState =
    | 'draft'
    | 'dry_run'
    | 'disabled'
    | 'enabled'
    | 'paused'
    | 'requires_connection'
    | 'requires_consent';

export interface AutomationConfig {
    id: string;
    userId: string;
    name: string;
    triggerType: AutomationTriggerType;
    conditionTypes: AutomationConditionType[];
    actionTypes: AutomationActionType[];
    state: AutomationConfigState;
    requiresApproval: boolean;
    serviceRequirements: string[];
    consentRequirements: string[];
    schedule?: string;
}

// ─── Automation Center types ───────────────────────────────────────────────────

// Safety levels
export type AutomationSafetyLevel =
    | 'local_only'
    | 'read_only'
    | 'draft_only'
    | 'approval_required'
    | 'external_write'
    | 'destructive'
    | 'disabled';

// Status
export type AutomationStatus =
    | 'enabled'
    | 'paused'
    | 'draft'
    | 'needs_setup'
    | 'needs_approval'
    | 'provider_missing'
    | 'error';

export type AutomationRunStatus =
    | 'queued'
    | 'running'
    | 'waiting_for_approval'
    | 'completed'
    | 'failed'
    | 'skipped'
    | 'cancelled';

// Full trigger definition (richer than existing)
export interface AutomationTrigger {
    type:
        | 'manual'
        | 'scheduled'
        | 'event_based'
        | 'data_threshold'
        | 'new_item'
        | 'new_email'
        | 'calendar_event'
        | 'file_uploaded'
        | 'widget_data_changed'
        | 'integration_sync'
        | 'user_inactivity'
        | 'deadline_approaching'
        | 'recurring_digest';
    label: string;
    config?: Record<string, unknown>;
}

// Condition
export interface AutomationCondition {
    type:
        | 'time_window'
        | 'widget_state'
        | 'data_threshold'
        | 'provider_connected'
        | 'user_status'
        | 'priority'
        | 'label'
        | 'date_range'
        | 'frequency_limit'
        | 'requires_confirmation'
        | 'prev_run_succeeded';
    label: string;
    config?: Record<string, unknown>;
}

// Action
export interface AutomationAction {
    type:
        | 'notify'
        | 'create_insight'
        | 'add_item'
        | 'generate_digest'
        | 'update_widget_state'
        | 'email_draft'
        | 'prepare_deliverable'
        | 'schedule_report'
        | 'create_calendar_draft'
        | 'classify_tag'
        | 'archive_when_approved'
        | 'webhook_consented';
    label: string;
    safetyLevel: AutomationSafetyLevel;
    requiresApproval: boolean;
    config?: Record<string, unknown>;
}

// Schedule
export interface AutomationSchedule {
    type:
        | 'one_time'
        | 'daily'
        | 'weekly'
        | 'monthly'
        | 'custom'
        | 'specific_days';
    interval?: number; // in minutes for custom
    days?: number[]; // 0-6 for specific_days
    time?: string; // HH:MM
    timezone?: string;
    quietHours?: { start: string; end: string };
    pauseDates?: string[];
}

// Approval policy
export interface AutomationApprovalPolicy {
    required: boolean;
    draftFirst: boolean;
    reviewQueue: boolean;
    alwaysAsk: boolean;
}

// Consent
export interface AutomationConsentRequirement {
    providersRequired: string[];
    dataRead: string[];
    dataWritten: string[];
    affectsExternal: boolean;
    affectsOthers: boolean;
    reversible: boolean;
}

// Full automation definition (template)
export interface AutomationDefinition {
    id: string;
    name: string;
    description: string;
    widgetId: string;
    widgetName: string;
    category: string;
    safetyLevel: AutomationSafetyLevel;
    trigger: AutomationTrigger;
    conditions: AutomationCondition[];
    actions: AutomationAction[];
    schedule?: AutomationSchedule;
    approvalPolicy: AutomationApprovalPolicy;
    consent: AutomationConsentRequirement;
    defaultEnabled: boolean;
    suggestedReason?: string;
}

// User's automation instance
export interface AutomationInstance {
    id: string;
    userId: string;
    definitionId: string;
    definition: AutomationDefinition;
    status: AutomationStatus;
    enabled: boolean;
    lastRunAt?: string;
    nextRunAt?: string;
    errorMessage?: string;
    approvalRequired: boolean;
    createdAt: string;
    updatedAt: string;
}

// Run history (Automation Center model)
export interface AutomationRunRecord {
    id: string;
    userId: string;
    instanceId: string;
    automationName: string;
    widgetName: string;
    status: AutomationRunStatus;
    triggeredBy: string;
    startedAt: string;
    completedAt?: string;
    durationMs?: number;
    summary?: string;
    errorMessage?: string;
    approvalStatus?: 'pending' | 'approved' | 'rejected';
    triggerInput?: Record<string, unknown>;
    actionsAttempted?: string[];
    outputGenerated?: string;
}

// Pending approval
export interface AutomationApproval {
    id: string;
    runId: string;
    automationName: string;
    proposedAction: string;
    externalEffectWarning?: string;
    outputPreview?: string;
    createdAt: string;
    widgetName: string;
    payloadVersion: number;
    payloadHash: string;
}

// Deliverable
export interface AutomationDeliverable {
    id: string;
    userId: string;
    name: string;
    sourceWidgets: string[];
    outputType: 'summary' | 'report' | 'digest' | 'briefing' | 'export';
    schedule: AutomationSchedule;
    deliveryDestination:
        | 'dashboard_notification'
        | 'inbox'
        | 'email_draft'
        | 'calendar_suggestion'
        | 'download';
    approvalMode: 'auto' | 'review';
    enabled: boolean;
    lastGeneratedAt?: string;
    nextGeneratedAt?: string;
}

// Suggestion
export interface AutomationSuggestion {
    id: string;
    definitionId: string;
    definition: AutomationDefinition;
    reason: string;
    dismissed: boolean;
}

// Widget profile
export interface AutomationWidgetProfile {
    widgetId: string;
    widgetName: string;
    emoji: string;
    availableTriggers: AutomationTrigger['type'][];
    availableActions: AutomationAction['type'][];
    providersRequired: string[];
    safeLocalActions: AutomationAction['type'][];
    approvalRequiredActions: AutomationAction['type'][];
    defaultEnabled: boolean;
}

// Legacy run model retained for existing services/routes
export interface AutomationRun {
    id: string;
    userId: string;
    automationConfigId: string;
    status:
        | 'queued'
        | 'running'
        | 'waiting_for_approval'
        | 'completed'
        | 'failed'
        | 'cancelled';
    startedAt?: string;
    completedAt?: string;
    result?: Record<string, unknown>;
}
