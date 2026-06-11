// Typed context contract for AI Chat.
// This is the interface between the chat send flow and the context collection service.
// Designed for future integration with the import/export service — all source fields
// describe their availability so the UI can be transparent about what context is present.

export type ContextSourceStatus =
    | 'available'
    | 'empty'
    | 'unavailable'
    | 'permission_denied'
    | 'not_configured'
    | 'loading';

export type ContextCollectionError =
    | 'CONTEXT_SERVICE_UNAVAILABLE'
    | 'CONTEXT_EXPORT_NOT_CONFIGURED'
    | 'CONTEXT_SOURCE_UNAVAILABLE'
    | 'CONTEXT_PERMISSION_DENIED'
    | 'CONTEXT_PAYLOAD_EMPTY'
    | 'CONTEXT_AUTH_REQUIRED'
    | 'CONTEXT_FETCH_FAILED';

export interface ContextSource {
    id: string;
    type:
        | 'user_profile'
        | 'widget_registry'
        | 'context_graph'
        | 'workspace'
        | 'integration'
        | 'memory'
        | 'import_export_service'
        | 'activity_feed';
    displayName: string;
    status: ContextSourceStatus;
    permissionGranted: boolean;
    lastSynced: string | null;
    included: boolean;
    itemCount: number;
    error?: string;
}

export interface ContextPayload {
    contextId: string;
    generatedAt: string;
    userId: string;
    scope: 'personal' | 'workspace' | 'global';
    sources: ContextSource[];
    // Summary counts for UI display
    availableSources: number;
    unavailableSources: number;
    // The actual system prompt content generated from available context.
    // Empty string if no context is available.
    systemPromptContent: string;
    // Warnings that should be shown to the user (non-blocking)
    warnings: string[];
}

export type ContextCollectionResult =
    | {
          ok: true;
          payload: ContextPayload;
      }
    | {
          ok: false;
          error: ContextCollectionError;
          message: string;
          // Partial source status even on failure, for UI display
          sources?: ContextSource[];
      };

// What the client sends alongside the message
export interface ChatContextRef {
    contextId: string;
    generatedAt: string;
    // Whether the UI explicitly acknowledged partial/empty context
    userAcknowledgedPartialContext: boolean;
}
