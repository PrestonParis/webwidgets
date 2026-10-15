export interface TimelineChange {
    id: string;
    title: string;
    summary: string | null;
    sourceLabel: string;
    sourceType: string;
    occurredAt: string;
    ingestedAt: string;
}

export interface SourceHealth {
    id: string;
    label: string;
    providerId: string;
    health: string;
    lastSucceededAt: string | null;
    issueCode: string | null;
}

export interface BriefingItem {
    id: string;
    section: 'changed' | 'matters' | 'due' | 'review';
    title: string;
    summary: string;
    evidence: Array<{ eventId: string; title: string }>;
}

export interface BriefingSummary {
    status: string;
    generatedAt: string | null;
    warnings: string[];
    items: BriefingItem[];
}

export interface Candidate {
    id: string;
    kind: 'task' | 'calendar';
    payload: Record<string, unknown>;
    payloadHash: string;
    payloadVersion: number;
    reason: string;
    confidence: number;
    state: string;
    createdAt: string;
    evidence: Array<{ id: string; title: string }>;
    execution: {
        actionRequestId: string;
        status: string;
        failureCode: string | null;
        taskId: string | null;
        verificationStatus: string | null;
        verifiedAt: string | null;
    } | null;
}

export interface CommandTask {
    id: string;
    text: string;
    completed: boolean;
    created_at: string;
    completed_at: string | null;
    due_at: string | null;
}

export interface AutomationSummary {
    globalEnabled: boolean;
    instances: Array<{
        id: string;
        definition: { name: string };
        status: string;
        enabled: boolean;
        nextRunAt?: string;
        errorMessage?: string;
    }>;
    runs: Array<{
        id: string;
        automationName: string;
        status: string;
        startedAt: string;
        completedAt?: string;
        summary?: string;
        errorMessage?: string;
    }>;
    approvals: Array<{ id: string; proposedAction: string; createdAt: string }>;
}

export interface SeenState {
    lastSeenAt: string | null;
}

export interface RuntimeHealth {
    state: 'operational' | 'degraded';
    lastSeenAt: string | null;
}
