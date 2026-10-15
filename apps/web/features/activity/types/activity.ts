// ── Source types ──────────────────────────────────────────────────────────────
// High-level bucket: which part of the platform originated the event
export type ActivityEventSource =
    | 'email'
    | 'calendar'
    | 'tracking'
    | 'automation'
    | 'finance'
    | 'integrations'
    | 'onboarding'
    | 'system'
    | 'artifact'
    | 'file'
    | 'news'
    | 'todo'
    | 'document'
    | 'memory'
    | 'reading'
    | 'collaboration'
    | 'research';

// ── Event types ───────────────────────────────────────────────────────────────
// Specific event within a source. Format: "<source>.<verb>"
export type ActivityEventType =
    // Artifact lifecycle
    | 'artifact.generated'
    | 'artifact.updated'
    | 'artifact.archived'
    | 'artifact.restored'
    // File lifecycle
    | 'file.uploaded'
    | 'file.converted'
    | 'file.conversion_failed'
    | 'file.extracted'
    | 'file.extraction_failed'
    // News
    | 'news.imported'
    | 'news.article_saved'
    | 'news.article_summarized'
    // Task lifecycle
    | 'todo.created'
    | 'todo.updated'
    | 'todo.completed'
    | 'todo.reopened'
    | 'todo.deleted'
    // Calendar
    | 'calendar.event_created'
    | 'calendar.event_updated'
    | 'calendar.event_deleted'
    // Automation
    | 'automation.created'
    | 'automation.executed'
    | 'automation.failed'
    | 'automation.enabled'
    | 'automation.disabled'
    // Finance
    | 'finance.transaction_added'
    | 'finance.transaction_updated'
    | 'finance.account_connected'
    | 'finance.import_completed'
    | 'finance.subscription_updated'
    // Document lifecycle
    | 'document.created'
    | 'document.updated'
    | 'document.archived'
    | 'document.shared'
    // Memory / Learning
    | 'memory.deck_created'
    | 'memory.card_created'
    | 'memory.card_reviewed'
    | 'memory.review_completed'
    // Reading
    | 'reading.bookmark_added'
    | 'reading.highlight_created'
    | 'reading.article_completed'
    // Collaboration
    | 'collaboration.comment_added'
    | 'collaboration.handoff_created'
    | 'collaboration.handoff_completed'
    | 'collaboration.approval_requested'
    | 'collaboration.approval_approved'
    | 'collaboration.approval_rejected'
    // Tracking
    | 'tracking.entry_created'
    | 'tracking.entry_updated'
    | 'tracking.entry_deleted'
    | 'tracking.goal_created'
    | 'tracking.goal_updated'
    // Email
    | 'email.imported'
    | 'email.classified'
    | 'email.action_extracted'
    | 'email.reply_needed'
    | 'email.deadline_detected'
    // Journal (extended)
    | 'journal.created'
    | 'journal.updated'
    | 'journal.deleted'
    // Research
    | 'research.started'
    | 'research.completed'
    | 'research.failed'
    // System
    | 'system.info'
    | 'system.warning'
    | 'system.error';

// ── Classification ────────────────────────────────────────────────────────────

export type ActivityEventSeverity = 'info' | 'success' | 'warning' | 'critical';

export type ActivityEventPriority = 'low' | 'normal' | 'high' | 'urgent';

export type ActivityEventCategory =
    | 'ai'
    | 'content'
    | 'data'
    | 'automation'
    | 'system';

export type ActivityEventOrigin =
    | 'domain'
    | 'system'
    | 'external'
    | 'timeline_projection';

// ── Related entity reference ──────────────────────────────────────────────────
export interface RelatedEntity {
    type: string;
    id: string;
    label?: string;
    url?: string;
}

// ── Core event model ──────────────────────────────────────────────────────────
export interface ActivityEvent {
    id: string;
    userId: string;

    // Source classification
    source: ActivityEventSource;
    eventType?: string;
    sourceId?: string;
    sourceTable?: string;

    // Display
    severity: ActivityEventSeverity;
    priority: ActivityEventPriority;
    category: ActivityEventCategory;
    title: string;
    body?: string;

    // State
    isArchived: boolean;
    readAt?: string;

    // Timing
    occurredAt: string;
    createdAt: string;

    // Relations & navigation
    relatedEntities: RelatedEntity[];
    metadata: Record<string, unknown>;
    actionUrl?: string;
    origin: ActivityEventOrigin;
}

// ── Input shape for publishing ────────────────────────────────────────────────
export interface ActivityEventInput {
    userId: string;
    source: ActivityEventSource;
    eventType?: string;
    sourceId?: string;
    sourceTable?: string;
    severity?: ActivityEventSeverity;
    priority?: ActivityEventPriority;
    category?: ActivityEventCategory;
    title: string;
    body?: string;
    occurredAt?: string;
    relatedEntities?: RelatedEntity[];
    metadata?: Record<string, unknown>;
    actionUrl?: string;
    origin?: ActivityEventOrigin;
}

// ── Query options ─────────────────────────────────────────────────────────────
export interface ActivityQueryOptions {
    limit?: number;
    offset?: number;
    source?: ActivityEventSource;
    eventType?: string;
    category?: ActivityEventCategory;
    priority?: ActivityEventPriority;
    archived?: boolean;
    unreadOnly?: boolean;
    since?: string;
    until?: string;
    sourceId?: string;
    sourceTable?: string;
    search?: string;
}

// ── Widget summary shape (used by activity resolver) ─────────────────────────
export interface ActivityWidgetData {
    events: ActivityEvent[];
    unreadCount: number;
    totalCount: number;
}
