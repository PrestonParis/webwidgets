import type { SupabaseClient } from '@supabase/supabase-js';
import type { Artifact } from '@/features/artifacts/types/artifact';
import type { FileTextExtraction } from '@/features/extraction/types/extraction';
import type { FileUpload } from '@/features/uploads/types/upload';
import {
    ingestContextEdge,
    ingestContextNode,
    markContextStatus,
} from './contextService';

function safeFileMetadata(file: FileUpload): Record<string, unknown> {
    return {
        mimeType: file.mimeType,
        sizeBytes: file.sizeBytes,
        status: file.status,
    };
}

function contextSlug(value: string): string {
    return value
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '')
        .slice(0, 80);
}

export async function ingestFileUploadContext(
    db: SupabaseClient,
    file: FileUpload,
): Promise<void> {
    await ingestContextNode(db, file.userId, {
        entityId: `file:${file.id}`,
        type: 'file',
        label: file.originalName,
        summary: `${file.mimeType} · ${file.sizeBytes} bytes · ${file.status}`,
        data: safeFileMetadata(file),
        tags: ['file', file.mimeType, file.status].filter(Boolean),
        sourceType: 'files',
        sourceId: file.id,
        sourceTable: 'file_uploads',
        createdByType: 'user',
        status: file.status === 'deleted' ? 'deleted' : 'active',
        permissions: ['private', 'ai', 'cross_widget'],
        metadata: safeFileMetadata(file),
    });
}

export async function markFileUploadContextDeleted(
    db: SupabaseClient,
    userId: string,
    fileId: string,
): Promise<void> {
    await markContextStatus(db, userId, `file:${fileId}`, 'deleted');
}

export async function ingestExtractionContext(
    db: SupabaseClient,
    userId: string,
    input: {
        fileId: string;
        fileName: string;
        extraction: FileTextExtraction;
    },
): Promise<void> {
    const preview = input.extraction.extractedText.slice(0, 280);
    const entityId = `extraction:${input.extraction.id}`;
    await ingestContextNode(db, userId, {
        entityId,
        type: 'artifact',
        label: `Text extraction: ${input.fileName}`,
        summary: `${input.extraction.extractionStatus} · ${input.extraction.characterCount} characters${preview ? ` · ${preview}` : ''}`,
        data: {
            fileId: input.fileId,
            conversionId: input.extraction.conversionId,
            textFormat: input.extraction.textFormat,
            characterCount: input.extraction.characterCount,
            tokenEstimate: input.extraction.tokenEstimate,
            extractionStatus: input.extraction.extractionStatus,
        },
        tags: ['text-extraction', input.extraction.textFormat],
        sourceType: 'file_text_extractions',
        sourceId: input.extraction.id,
        sourceTable: 'file_text_extractions',
        createdByType: 'system',
        confidence: 1,
        permissions: ['private', 'ai', 'cross_widget'],
    });
    await ingestContextEdge(db, userId, {
        fromEntityId: entityId,
        toEntityId: `file:${input.fileId}`,
        kind: 'derived_from',
        label: 'extracted text from file',
        sourceType: 'file_text_extractions',
        sourceId: input.extraction.id,
        createdByType: 'system',
        metadata: { conversionId: input.extraction.conversionId },
    });
}

export async function ingestArtifactContext(
    db: SupabaseClient,
    artifact: Artifact,
): Promise<void> {
    await ingestContextNode(db, artifact.userId, {
        entityId: `artifact:${artifact.id}`,
        type: 'artifact',
        label: artifact.title,
        summary: artifact.content.slice(0, 280),
        data: {
            artifactType: artifact.type,
            contentFormat: artifact.contentFormat,
            sourceFileId: artifact.sourceFileId,
            sourceDocumentId: artifact.sourceDocumentId,
            sourceJobId: artifact.sourceJobId,
        },
        tags: ['artifact', artifact.type, ...artifact.tags],
        sourceType: 'artifacts',
        sourceId: artifact.id,
        sourceTable: 'artifacts',
        createdByType: 'agent',
        permissions: ['private', 'ai', 'cross_widget'],
    });

    if (artifact.sourceFileId) {
        await ingestContextEdge(db, artifact.userId, {
            fromEntityId: `artifact:${artifact.id}`,
            toEntityId: `file:${artifact.sourceFileId}`,
            kind: 'derived_from',
            label: 'generated from file',
            sourceType: 'artifacts',
            sourceId: artifact.id,
            createdByType: 'agent',
        });
    }
    if (artifact.sourceDocumentId) {
        await ingestContextEdge(db, artifact.userId, {
            fromEntityId: `artifact:${artifact.id}`,
            toEntityId: `document:${artifact.sourceDocumentId}`,
            kind: 'derived_from',
            label: 'generated from document',
            sourceType: 'artifacts',
            sourceId: artifact.id,
            createdByType: 'agent',
        });
    }
    if (artifact.type === 'summary' || artifact.type === 'cheatsheet') {
        await ingestContextEdge(db, artifact.userId, {
            fromEntityId: `artifact:${artifact.id}`,
            toEntityId: artifact.sourceDocumentId
                ? `document:${artifact.sourceDocumentId}`
                : `file:${artifact.sourceFileId ?? artifact.id}`,
            kind: 'summarizes',
            label: `${artifact.type} summary artifact`,
            sourceType: 'artifacts',
            sourceId: artifact.id,
            createdByType: 'agent',
        });
    }
}

export async function ingestJournalContext(
    db: SupabaseClient,
    userId: string,
    input: {
        id: string;
        title: string;
        content?: string;
        type?: string;
        status?: 'active' | 'deleted';
    },
): Promise<void> {
    const isNote = input.type === 'note';
    await ingestContextNode(db, userId, {
        entityId: `${isNote ? 'memory' : 'journal_entry'}:${input.id}`,
        type: isNote ? 'memory' : 'journal_entry',
        label: input.title || 'Untitled',
        summary: (input.content ?? '').slice(0, 280),
        data: {
            entryType: input.type ?? 'journal',
        },
        tags: ['journal', input.type ?? 'journal'],
        sourceType: 'journals',
        sourceId: input.id,
        sourceTable: 'journals',
        createdByType: 'user',
        status: input.status === 'deleted' ? 'deleted' : 'active',
        permissions: ['private', 'ai'],
    });
}

export async function ingestAutomationRunContext(
    db: SupabaseClient,
    userId: string,
    input: {
        automationConfigId: string;
        runId?: string;
        status: string;
    },
): Promise<void> {
    const runEntityId = `automation_run:${input.runId ?? `${input.automationConfigId}:${input.status}`}`;
    await ingestContextNode(db, userId, {
        entityId: `automation:${input.automationConfigId}`,
        type: 'automation',
        label: `Automation ${input.automationConfigId}`,
        summary: `Automation configuration observed with latest status ${input.status}`,
        data: { automationConfigId: input.automationConfigId },
        tags: ['automation'],
        sourceType: 'automation_configs',
        sourceId: input.automationConfigId,
        sourceTable: 'automation_configs',
        createdByType: 'system',
        permissions: ['private', 'ai', 'automation'],
    });
    await ingestContextNode(db, userId, {
        entityId: runEntityId,
        type: 'automation_run',
        label: `Automation run ${input.status}`,
        summary: `Automation run status: ${input.status}`,
        data: {
            automationConfigId: input.automationConfigId,
            runId: input.runId,
            status: input.status,
        },
        tags: ['automation', input.status],
        sourceType: 'automation_runs',
        sourceId: input.runId ?? `${input.automationConfigId}:${input.status}`,
        sourceTable: 'automation_runs',
        createdByType: 'system',
        permissions: ['private', 'ai', 'automation'],
    });
    await ingestContextEdge(db, userId, {
        fromEntityId: runEntityId,
        toEntityId: `automation:${input.automationConfigId}`,
        kind: 'triggered_by',
        label: 'run triggered by automation',
        sourceType: 'automation_runs',
        sourceId: input.runId ?? `${input.automationConfigId}:${input.status}`,
        createdByType: 'system',
    });
}

export async function ingestEmailActionTodoContext(
    db: SupabaseClient,
    userId: string,
    input: {
        actionId: string;
        emailId: string;
        todoId: string;
        title: string;
        description?: string | null;
        dueDate?: string | null;
        actionType?: string | null;
    },
): Promise<void> {
    const actionEntityId = `agent_action:gmail:${input.emailId}:${contextSlug(input.title) || input.actionId}`;
    const todoEntityId = `todo:${input.todoId}`;
    const emailEntityId = `email:gmail:${input.emailId}`;

    await ingestContextNode(db, userId, {
        entityId: todoEntityId,
        type: 'todo',
        label: input.title,
        summary: input.description ?? input.title,
        data: {
            completed: false,
            dueDate: input.dueDate,
            sourceEmailId: input.emailId,
            sourceActionId: input.actionId,
            actionType: input.actionType,
        },
        tags: ['todo', 'email-action', input.actionType ?? 'action'],
        sourceType: 'todos',
        sourceId: input.todoId,
        sourceTable: 'todos',
        createdByType: 'agent',
        permissions: ['private', 'ai', 'cross_widget'],
    });

    await ingestContextEdge(db, userId, {
        fromEntityId: todoEntityId,
        toEntityId: emailEntityId,
        kind: 'derived_from',
        label: 'created from Gmail action',
        sourceType: 'email_actions',
        sourceId: input.actionId,
        createdByType: 'agent',
        metadata: { actionType: input.actionType },
    });
    await ingestContextEdge(db, userId, {
        fromEntityId: todoEntityId,
        toEntityId: actionEntityId,
        kind: 'created_from',
        label: 'materialized from extracted action',
        sourceType: 'email_actions',
        sourceId: input.actionId,
        createdByType: 'agent',
        metadata: { emailId: input.emailId },
    });
    if (input.dueDate) {
        await ingestContextEdge(db, userId, {
            fromEntityId: todoEntityId,
            toEntityId: actionEntityId,
            kind: 'scheduled_for',
            label: 'due date from extracted action',
            sourceType: 'email_actions',
            sourceId: input.actionId,
            createdByType: 'agent',
            metadata: { dueDate: input.dueDate },
        });
    }
}

export async function ingestEmailActionCalendarContext(
    db: SupabaseClient,
    userId: string,
    input: {
        actionId: string;
        emailId: string;
        eventId: string;
        title: string;
        description?: string | null;
        start?: string | null;
        htmlLink?: string | null;
    },
): Promise<void> {
    const eventEntityId = `calendar_event:${input.eventId}`;
    const actionEntityId = `agent_action:gmail:${input.emailId}:${contextSlug(input.title) || input.actionId}`;
    const emailEntityId = `email:gmail:${input.emailId}`;

    await ingestContextNode(db, userId, {
        entityId: eventEntityId,
        type: 'calendar_event',
        label: input.title,
        summary: input.description ?? input.title,
        data: {
            emailId: input.emailId,
            actionId: input.actionId,
            start: input.start,
            htmlLink: input.htmlLink,
            provider: 'google_calendar',
        },
        tags: ['calendar', 'email-action'],
        sourceType: 'calendar_events',
        sourceId: input.eventId,
        sourceTable: 'google_calendar',
        createdByType: 'integration',
        permissions: ['private', 'ai', 'cross_widget'],
    });
    await ingestContextEdge(db, userId, {
        fromEntityId: eventEntityId,
        toEntityId: emailEntityId,
        kind: 'created_from',
        label: 'created from Gmail action',
        sourceType: 'email_actions',
        sourceId: input.actionId,
        createdByType: 'agent',
    });
    await ingestContextEdge(db, userId, {
        fromEntityId: eventEntityId,
        toEntityId: actionEntityId,
        kind: 'created_from',
        label: 'materialized from extracted action',
        sourceType: 'email_actions',
        sourceId: input.actionId,
        createdByType: 'agent',
    });
}

export async function ingestCalendarEventContext(
    db: SupabaseClient,
    userId: string,
    input: {
        id: string;
        summary: string;
        description?: string | null;
        start?: string | null;
        end?: string | null;
        htmlLink?: string | null;
        status?: 'active' | 'deleted';
        createdByType?: 'user' | 'system' | 'agent' | 'integration';
    },
): Promise<void> {
    await ingestContextNode(db, userId, {
        entityId: `calendar_event:${input.id}`,
        type: 'calendar_event',
        label: input.summary || 'Calendar event',
        summary: input.description ?? input.summary,
        data: {
            start: input.start,
            end: input.end,
            htmlLink: input.htmlLink,
            provider: 'google_calendar',
        },
        tags: ['calendar'],
        sourceType: 'calendar_events',
        sourceId: input.id,
        sourceTable: 'google_calendar',
        createdByType: input.createdByType ?? 'user',
        status: input.status ?? 'active',
        permissions: ['private', 'ai', 'cross_widget'],
    });
}
