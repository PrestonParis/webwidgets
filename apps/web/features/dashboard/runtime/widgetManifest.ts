// Widget data manifest: typed declaration of what each widget needs.
// The runtime manager reads manifests to schedule fetches, batch shared sources,
// and route requests through the import/export adapter layer.

import { z } from 'zod';

export const widgetDataRequirementSchema = z.object({
    // import/export source type — matches SourceDestinationType in import-export
    sourceType: z.enum([
        'tracking_entries',
        'todos',
        'collaboration_workspaces',
        'collaboration_handoffs',
        'context_entries',
        'ai_context',
        'mood_logs',
        'journals',
        'habits',
        'finance_records',
        'countdowns',
        'recovery_records',
        'calendar_events',
        'memory_decks',
        // Direct API pass-through for sources not yet in import/export
        'api',
    ]),
    // For 'api' sourceType: the API route to call
    apiRoute: z.string().optional(),
    // Scope restriction passed to the adapter (optional, defaults to 'current_user')
    scope: z
        .enum(['current_user', 'workspace', 'global'])
        .optional()
        .default('current_user'),
    // Client-side cache TTL in ms. Defaults to runtime config.
    cacheTtlMs: z.number().int().positive().optional(),
    // If true, widget cannot render without this source (optional, defaults to true)
    required: z.boolean().optional().default(true),
    // Human-readable label for inspector/debug
    label: z.string().optional(),
});

// Use z.input for WidgetDataRequirement so optional-with-default fields (scope, required, aboveFold)
// don't need to be specified in object literals — they are filled in by Zod at parse time.
export type WidgetDataRequirement = z.input<typeof widgetDataRequirementSchema>;

export const widgetManifestSchema = z.object({
    widgetType: z.string(),
    // Load priority hint (overrides weight-based default in runtime)
    priority: z.enum(['critical', 'high', 'normal', 'low']).optional(),
    // Whether widget blocks above-fold rendering (optional, defaults to false)
    aboveFold: z.boolean().optional().default(false),
    // Data sources this widget needs, in priority order
    dataRequirements: z.array(widgetDataRequirementSchema).default([]),
    // What normalized data schemas this widget can consume
    acceptsSchemas: z.array(z.string()).default([]),
    // What this widget can export back through import/export
    exportsSchemas: z.array(z.string()).default([]),
});

// Use z.input for WidgetManifest so optional-with-default fields don't require
// explicit values in object literals in widgetManifestRegistry.ts.
export type WidgetManifest = z.input<typeof widgetManifestSchema>;

// Resolved at runtime after fetching all requirements
export interface WidgetDataPayload {
    widgetType: string;
    widgetId: string;
    sources: Record<
        string,
        {
            data: unknown;
            fetchedAt: number;
            sourceType: string;
            error?: string;
        }
    >;
    allResolved: boolean;
    partiallyResolved: boolean;
    errors: string[];
}
