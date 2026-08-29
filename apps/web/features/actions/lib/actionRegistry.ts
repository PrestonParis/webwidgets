import FlexSearch from 'flexsearch';
import { z } from 'zod';
import {
    actionDefinitionMetadataSchema,
    type ActionDefinition,
    type ActionDefinitionMetadata,
} from '@/features/actions/lib/schemas/definitionSchemas';

const taskCreateInput = z.object({
    title: z.string().min(1),
    dueAt: z.string().datetime().nullable().default(null),
    notes: z.string().max(1_000).default(''),
    sourceReference: z.string().max(2_000).nullable().default(null),
});

const taskUpdateInput = z
    .object({
        taskId: z.string().uuid(),
        expectedUpdatedAt: z.string().datetime(),
        title: z.string().min(1).max(300).optional(),
        dueAt: z.string().datetime().nullable().optional(),
        notes: z.string().max(1_000).optional(),
    })
    .refine(
        (value) =>
            value.title !== undefined ||
            value.dueAt !== undefined ||
            value.notes !== undefined,
        'At least one task field must change',
    );

const taskCompleteInput = z.object({
    taskId: z.string().uuid(),
    expectedUpdatedAt: z.string().datetime(),
});

const calendarCreateInput = z.object({
    title: z.string().min(1),
    startsAt: z.string().datetime(),
    endsAt: z.string().datetime(),
    attendees: z.array(z.string().email()).default([]),
});

const emailMessageInput = z.object({
    provider: z.enum(['google', 'microsoft']),
    accountId: z.string().uuid(),
    from: z.string().email(),
    to: z.array(z.string().email()).min(1),
    cc: z.array(z.string().email()).default([]),
    bcc: z.array(z.string().email()).default([]),
    subject: z.string().min(1),
    body: z.string().min(1),
    reply: z.unknown().nullable().default(null),
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
        queueability: 'required',
        expectedInputs: taskCreateInput,
        expectedOutputs: genericOutput,
        requiredPermissions: [],
        requiredConsents: [],
        canUndo: true,
        handlerId: 'worker.tasks.create',
    },
    {
        id: 'tasks.update',
        category: 'tasks',
        providerScope: 'local',
        label: 'Update task',
        description: 'Update an existing local task after exact approval.',
        mutability: 'state-altering',
        destructiveLevel: 'safe',
        queueability: 'required',
        expectedInputs: taskUpdateInput,
        expectedOutputs: genericOutput,
        requiredPermissions: [],
        requiredConsents: [],
        canUndo: true,
        handlerId: 'worker.tasks.update',
    },
    {
        id: 'tasks.complete',
        category: 'tasks',
        providerScope: 'local',
        label: 'Complete task',
        description: 'Complete an existing local task after exact approval.',
        mutability: 'state-altering',
        destructiveLevel: 'safe',
        queueability: 'required',
        expectedInputs: taskCompleteInput,
        expectedOutputs: genericOutput,
        requiredPermissions: [],
        requiredConsents: [],
        canUndo: false,
        handlerId: 'worker.tasks.complete',
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
        queueability: 'required',
        expectedInputs: calendarCreateInput,
        expectedOutputs: genericOutput,
        requiredPermissions: ['calendar:write'],
        requiredConsents: ['calendar_access'],
        canUndo: true,
        handlerId: 'provider.calendar.createEvent',
    },
    {
        id: 'email.draft',
        category: 'email',
        providerScope: 'email',
        label: 'Create email draft',
        description:
            'Create an exact approved Gmail or Outlook draft without sending.',
        mutability: 'state-altering',
        destructiveLevel: 'safe',
        queueability: 'required',
        expectedInputs: emailMessageInput,
        expectedOutputs: genericOutput,
        requiredPermissions: ['email:write'],
        requiredConsents: ['email_access'],
        canUndo: false,
        handlerId: 'provider.email.draft',
    },
    {
        id: 'email.send',
        category: 'email',
        providerScope: 'email',
        label: 'Send approved email',
        description:
            'Send one exact approved message through the selected Gmail or Outlook account.',
        mutability: 'state-altering',
        destructiveLevel: 'warning',
        queueability: 'required',
        expectedInputs: emailMessageInput,
        expectedOutputs: genericOutput,
        requiredPermissions: ['email:send'],
        requiredConsents: ['email_access'],
        canUndo: false,
        handlerId: 'provider.email.send',
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
