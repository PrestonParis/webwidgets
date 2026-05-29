export type ActivityEventSource =
    | 'email'
    | 'calendar'
    | 'tracking'
    | 'automation'
    | 'finance'
    | 'integrations'
    | 'onboarding'
    | 'system';
export type ActivityEventSeverity = 'info' | 'success' | 'warning' | 'critical';

export interface ActivityEvent {
    id: string;
    userId: string;
    source: ActivityEventSource;
    severity: ActivityEventSeverity;
    title: string;
    body?: string;
    createdAt: string;
    readAt?: string;
}
