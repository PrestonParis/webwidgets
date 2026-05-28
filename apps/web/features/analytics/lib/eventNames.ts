export const ANALYTICS_EVENTS = {
    // Widget lifecycle
    WIDGET_ADDED: 'widget_added',
    WIDGET_REMOVED: 'widget_removed',
    WIDGET_HIDDEN: 'widget_hidden',
    WIDGET_OPENED: 'widget_opened',
    WIDGET_CONFIGURED: 'widget_configured',
    WIDGET_WEAVED: 'widget_weaved',
    WIDGET_GLUED: 'widget_glued',
    WIDGET_FOLDERED: 'widget_foldered',
    WIDGET_CROPPED: 'widget_cropped',

    // Widget discovery / search
    SEARCH_PERFORMED: 'search_performed',
    WIDGET_SEARCH_RESULT_CLICKED: 'widget_search_result_clicked',
    WIDGET_GENERATION_STARTED: 'widget_generation_started',
    WIDGET_GENERATION_FAILED: 'widget_generation_failed',
    WIDGET_GENERATION_COMPLETED: 'widget_generation_completed',

    // Actions
    ACTION_SUGGESTED: 'action_suggested',
    ACTION_ACCEPTED: 'action_accepted',
    ACTION_REJECTED: 'action_rejected',
    ACTION_EXECUTED: 'action_executed',
    ACTION_FAILED: 'action_failed',
    ACTION_RETRIED: 'action_retried',
    USER_INTERACTION: 'user_interaction',

    // ML / Predictions
    ML_PREDICTION_CREATED: 'ml_prediction_created',
    ML_PREDICTION_LOW_CONFIDENCE: 'ml_prediction_low_confidence',
    ML_PREDICTION_CORRECTED: 'ml_prediction_corrected',
    ML_FALLBACK_USED: 'ml_fallback_used',

    // Email
    EMAIL_CLASSIFIED: 'email_classified',
    EMAIL_ACTION_EXTRACTED: 'email_action_extracted',
    EMAIL_PROCESSING_FAILED: 'email_processing_failed',

    // Onboarding
    ONBOARDING_STARTED: 'onboarding_started',
    ONBOARDING_WIDGET_SELECTED: 'onboarding_widget_selected',
    ONBOARDING_API_CONNECTED: 'onboarding_api_connected',
    ONBOARDING_COMPLETED: 'onboarding_completed',
} as const;

export type EventName =
    (typeof ANALYTICS_EVENTS)[keyof typeof ANALYTICS_EVENTS];
