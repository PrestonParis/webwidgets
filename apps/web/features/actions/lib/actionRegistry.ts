import FlexSearch from 'flexsearch';
import { z } from 'zod';
import {
    actionDefinitionMetadataSchema,
    type ActionDefinition,
    type ActionDefinitionMetadata,
} from '@/features/actions/lib/schemas/definitionSchemas';

const taskCreateInput = z.object({
    title: z.string().min(1),
    dueAt: z.string().datetime().optional(),
    notes: z.string().optional(),
});

const calendarCreateInput = z.object({
    title: z.string().min(1),
    startsAt: z.string().datetime(),
    endsAt: z.string().datetime(),
    attendees: z.array(z.string().email()).default([]),
});

const emailDraftInput = z.object({
    threadId: z.string(),
    body: z.string().min(1),
    tone: z.enum(['concise', 'warm', 'formal']).default('concise'),
});

const automationRunInput = z.object({
    automationId: z.string(),
    parameters: z.record(z.string(), z.unknown()).default({}),
});

const parseRssInput = z.object({
    url: z.string().url(),
    providerId: z.string().default('manual-rss'),
});

const generateBriefingInput = z.object({
    topic: z.string().min(1),
    lookbackHours: z.number().int().min(1).max(168).default(24),
});

const genericOutput = z.object({
    accepted: z.boolean(),
    message: z.string(),
    data: z.unknown().optional(),
});

export const ACTION_DEFINITIONS: ActionDefinition[] = [
    {
        id: 'tasks.create',
        category: 'tasks',
        providerScope: 'local',
        label: 'Create task',
        description:
            'Create a local task from a widget, agent, or workflow request.',
        mutability: 'state-altering',
        destructiveLevel: 'safe',
        queueability: 'immediate',
        expectedInputs: taskCreateInput,
        expectedOutputs: genericOutput,
        requiredPermissions: [],
        requiredConsents: [],
        canUndo: true,
        handlerId: 'local.echo',
    },
    {
        id: 'calendar.create_event',
        category: 'calendar',
        providerScope: 'calendar',
        label: 'Create calendar event',
        description:
            'Create a calendar event through the calendar provider boundary.',
        mutability: 'state-altering',
        destructiveLevel: 'warning',
        queueability: 'optional',
        expectedInputs: calendarCreateInput,
        expectedOutputs: genericOutput,
        requiredPermissions: ['calendar:write'],
        requiredConsents: ['calendar_access'],
        canUndo: true,
        handlerId: 'provider.calendar.createEvent',
    },
    {
        id: 'email.draft_reply',
        category: 'email',
        providerScope: 'email',
        label: 'Draft email reply',
        description: 'Draft a reply without sending it.',
        mutability: 'state-altering',
        destructiveLevel: 'safe',
        queueability: 'optional',
        expectedInputs: emailDraftInput,
        expectedOutputs: genericOutput,
        requiredPermissions: ['email:read'],
        requiredConsents: ['email_access'],
        canUndo: true,
        handlerId: 'provider.email.draftReply',
    },
    {
        id: 'automation.run',
        category: 'automation',
        providerScope: 'automation',
        label: 'Run automation',
        description:
            'Run a configured automation with explicit approval gates.',
        mutability: 'state-altering',
        destructiveLevel: 'warning',
        queueability: 'required',
        expectedInputs: automationRunInput,
        expectedOutputs: genericOutput,
        requiredPermissions: [],
        requiredConsents: ['automation_execution'],
        canUndo: false,
        handlerId: 'provider.automation.run',
    },
    {
        id: 'news.parse_rss_feed',
        category: 'news',
        providerScope: 'news',
        label: 'Parse RSS feed',
        description:
            'Fetch and parse an RSS feed through the queueable ingestion boundary.',
        mutability: 'read-only',
        destructiveLevel: 'safe',
        queueability: 'required',
        expectedInputs: parseRssInput,
        expectedOutputs: genericOutput,
        requiredPermissions: [],
        requiredConsents: [],
        canUndo: false,
        handlerId: 'provider.news.parseRss',
    },
    {
        id: 'system.generate_briefing',
        category: 'system',
        providerScope: 'internal',
        label: 'Generate briefing',
        description:
            'Prepare an AI-ready briefing payload from normalized platform events.',
        mutability: 'read-only',
        destructiveLevel: 'safe',
        queueability: 'optional',
        expectedInputs: generateBriefingInput,
        expectedOutputs: genericOutput,
        requiredPermissions: [],
        requiredConsents: [],
        canUndo: false,
        handlerId: 'local.echo',
    },
];

const metadataById = new Map<string, ActionDefinitionMetadata>();
const definitionsById = new Map<string, ActionDefinition>();
const searchIndex = new FlexSearch.Index({ tokenize: 'forward', cache: true });

for (const definition of ACTION_DEFINITIONS) {
    const metadata = actionDefinitionMetadataSchema.parse(definition);
    metadataById.set(metadata.id, metadata);
    definitionsById.set(definition.id, definition);
    searchIndex.add(
        metadata.id,
        `${metadata.label} ${metadata.description} ${metadata.category} ${metadata.providerScope} ${metadata.id}`,
    );
}

export function getActionDefinition(actionId: string) {
    return definitionsById.get(actionId) ?? null;
}

export function listActionDefinitions() {
    return [...definitionsById.values()];
}

export function listActionMetadata() {
    return [...metadataById.values()];
}

export function searchActionMetadata(query: string) {
    if (!query.trim()) return listActionMetadata();
    const ids = searchIndex.search(query, 25).map(String);
    return ids.flatMap((id) => {
        const metadata = metadataById.get(id);
        return metadata ? [metadata] : [];
    });
}
