import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/types/supabase';
import type {
    ContextEdge,
    ContextEntry,
} from '@/features/context/types/context';
import {
    getContextEdges,
    listContextNodes,
    rankContextForQuery,
    type ContextTraversalFilters,
} from './contextTraversalService';
import { getContextPermissions } from './contextPermissionsService';
import { toText } from '@/lib/utils/utils';

export interface ContextBundle {
    nodes: ContextEntry[];
    edges: ContextEdge[];
    compactSummaries: string[];
    sourceReferences: Array<{
        entityId: string;
        sourceType?: string | undefined;
        sourceId?: string | null | undefined;
        sourceTable?: string | null | undefined;
    }>;
    permissionsApplied: string[];
    relevanceRanking: Array<{ entityId: string; rank: number }>;
    freshness: Array<{
        entityId: string;
        status?: string | undefined;
        lastObservedAt?: string | null | undefined;
    }>;
    warnings: string[];
    promptSection: string;
}

export interface ContextBundleOptions extends ContextTraversalFilters {
    query?: string;
    maxNodes?: number;
    maxPromptChars?: number;
    consumer?: 'chat' | 'widget' | 'automation' | 'file' | 'generic';
}

export async function buildContextBundle(
    db: SupabaseClient<Database>,
    userId: string,
    options?: ContextBundleOptions,
): Promise<ContextBundle> {
    const permissions = await getContextPermissions(db, userId);
    const warnings: string[] = [];
    if (options?.consumer === 'chat' && !permissions.allowAIPersonalization) {
        warnings.push('AI personalization is disabled for this user.');
        return emptyBundle(warnings);
    }
    if (
        options?.consumer === 'automation' &&
        !permissions.allowAutomationContextAccess
    ) {
        warnings.push('Automation context access is disabled for this user.');
        return emptyBundle(warnings);
    }

    const maxNodes = options?.maxNodes ?? options?.limit ?? 30;
    const nodes = options?.query
        ? await rankContextForQuery(db, userId, options.query, {
              ...options,
              limit: maxNodes,
              permissionScope:
                  options.permissionScope ??
                  (options.consumer === 'chat' ? 'ai' : undefined),
          } as ContextTraversalFilters)
        : await listContextNodes(db, userId, {
              ...options,
              limit: maxNodes,
              permissionScope:
                  options?.permissionScope ??
                  (options?.consumer === 'chat' ? 'ai' : undefined),
          } as ContextTraversalFilters);
    const nodeIds = new Set(nodes.map((node) => node.entityId));
    const edges = (await getContextEdges(db, userId, options)).filter(
        (edge) => nodeIds.has(edge.from) && nodeIds.has(edge.to),
    );
    const compactSummaries = nodes.map(summarizeNode);
    const sourceReferences = nodes.map((node) => ({
        entityId: node.entityId,
        sourceType: node.sourceType,
        sourceId: node.sourceId,
        sourceTable: node.sourceTable,
    }));
    const relevanceRanking = nodes.map((node, index) => ({
        entityId: node.entityId,
        rank: index + 1,
    }));
    const freshness = nodes.map((node) => ({
        entityId: node.entityId,
        status: node.status,
        lastObservedAt: node.lastObservedAt,
    }));
    const promptSection = trimPrompt(
        buildContextPromptFromBundle({
            nodes,
            edges,
            compactSummaries,
            sourceReferences,
            permissionsApplied: appliedPermissions(options),
            relevanceRanking,
            freshness,
            warnings,
            promptSection: '',
        }),
        options?.maxPromptChars ?? 6000,
    );
    return {
        nodes,
        edges,
        compactSummaries,
        sourceReferences,
        permissionsApplied: appliedPermissions(options),
        relevanceRanking,
        freshness,
        warnings,
        promptSection,
    };
}

export function buildContextBundleForChat(
    db: SupabaseClient<Database>,
    userId: string,
    input: Omit<ContextBundleOptions, 'consumer'> = {},
): Promise<ContextBundle> {
    return buildContextBundle(db, userId, { ...input, consumer: 'chat' });
}

export function buildContextBundleForWidget(
    db: SupabaseClient<Database>,
    userId: string,
    widgetIdOrType: string,
    input: Omit<ContextBundleOptions, 'consumer'> = {},
): Promise<ContextBundle> {
    return buildContextBundle(db, userId, {
        ...input,
        consumer: 'widget',
        query: input.query ?? widgetIdOrType,
    });
}

export function buildContextBundleForAutomation(
    db: SupabaseClient<Database>,
    userId: string,
    automationId: string,
    input: Omit<ContextBundleOptions, 'consumer'> = {},
): Promise<ContextBundle> {
    return buildContextBundle(db, userId, {
        ...input,
        consumer: 'automation',
        query: input.query ?? automationId,
    });
}

export function buildContextBundleForFile(
    db: SupabaseClient<Database>,
    userId: string,
    fileId: string,
    input: Omit<ContextBundleOptions, 'consumer'> = {},
): Promise<ContextBundle> {
    return buildContextBundle(db, userId, {
        ...input,
        consumer: 'file',
        query: input.query ?? fileId,
    });
}

export function buildContextPromptFromBundle(bundle: ContextBundle): string {
    if (bundle.nodes.length === 0) {
        return "You are a helpful AI assistant embedded in the user's WebWidgets workspace.";
    }
    const lines = [
        "You are a personalized AI assistant embedded in the user's WebWidgets workspace.",
        'Use the structured context below when it is relevant.',
        '',
        '## Context Bundle',
        ...bundle.compactSummaries.map((summary) => `- ${summary}`),
    ];
    if (bundle.edges.length > 0) {
        lines.push('', '## Relationships');
        bundle.edges.slice(0, 20).forEach((edge) => {
            lines.push(
                `- ${edge.from} ${edge.kind ?? 'relates_to'} ${edge.to}${
                    edge.label ? ` (${edge.label})` : ''
                }`,
            );
        });
    }
    if (bundle.warnings.length > 0) {
        lines.push('', '## Context Warnings', ...bundle.warnings);
    }
    lines.push(
        '',
        "Respond concisely. Reference the user's context naturally without reciting it verbatim.",
    );
    return lines.join('\n');
}

function summarizeNode(node: ContextEntry): string {
    const summary =
        node.summary ||
        toText(
            node.data.description ??
                node.data.note ??
                node.data.text ??
                node.data.title ??
                '',
        );
    const freshness =
        node.status && node.status !== 'active' ? ` [${node.status}]` : '';
    return `${node.entryType}: ${node.label}${summary ? ` - ${summary}` : ''}${freshness}`;
}

function trimPrompt(prompt: string, maxChars: number): string {
    if (prompt.length <= maxChars) return prompt;
    return `${prompt.slice(0, maxChars - 80)}\n\n[Context trimmed for size.]`;
}

function appliedPermissions(options?: ContextBundleOptions): string[] {
    return [
        options?.consumer ? `consumer:${options.consumer}` : 'consumer:generic',
        options?.permissionScope
            ? `scope:${options.permissionScope}`
            : 'scope:default',
    ];
}

function emptyBundle(warnings: string[]): ContextBundle {
    return {
        nodes: [],
        edges: [],
        compactSummaries: [],
        sourceReferences: [],
        permissionsApplied: [],
        relevanceRanking: [],
        freshness: [],
        warnings,
        promptSection: buildContextPromptFromBundle({
            nodes: [],
            edges: [],
            compactSummaries: [],
            sourceReferences: [],
            permissionsApplied: [],
            relevanceRanking: [],
            freshness: [],
            warnings,
            promptSection: '',
        }),
    };
}
