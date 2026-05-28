export type TrackingAutomationType =
    | 'streak_risk'
    | 'threshold_crossed'
    | 'missing_log'
    | 'recovery_suggested'
    | 'correlation_review'
    | 'goal_progress';
export type TrackingActionInputType =
    | 'category'
    | 'metric'
    | 'date'
    | 'number'
    | 'text'
    | 'boolean';

export type TrackingPrediction = {
    id: string;
    label: string;
    confidence: number;
    reason: string;
    category?: string;
    suggestedActionId?: string;
};

export type TrackingActionDefinition = {
    id: string;
    label: string;
    description: string;
    requiredInputs: Array<{
        key: string;
        label: string;
        type: TrackingActionInputType;
        optional?: boolean;
    }>;
    widgetTarget?: string;
    routeTarget?: string;
    handler: (
        input: Record<string, unknown>,
    ) => Promise<{ ok: boolean; message: string }>;
};

export type TrackingAutomationRule = {
    id: string;
    label: string;
    type: TrackingAutomationType;
    enabled: boolean;
    category?: string;
    conditions: Record<string, unknown>;
    action: {
        type: 'notify' | 'open_widget' | 'suggest_entry' | 'review';
        label: string;
        target?: string;
    };
};
