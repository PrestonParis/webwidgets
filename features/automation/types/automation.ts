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
    | 'disabled'
    | 'enabled'
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
