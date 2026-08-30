import Anthropic from '@anthropic-ai/sdk';
import { NextResponse } from 'next/server';
import { z } from 'zod';
import { createClients } from '@/lib/supabase/serverClient';
import { getRequestUserId } from '@/features/backend/lib/requestUser';
import { getExtraction } from '@/features/extraction/services/extractionService';
import { createArtifact } from '@/features/artifacts/services/artifactService';
import { createDocument } from '@/features/documents/services/documentService';
import { publishActivityEventSafe } from '@/features/activity/services/activityService';
import {
    ingestContextEdge,
    ingestContextNode,
} from '@/features/context/services/contextService';
import { getModelKey } from '@/features/jobs/lib/modelKeyHelper';
import {
    getFileAiAction,
    type FileAiActionType,
} from '@/features/uploads/lib/fileAiActionOptions';
import { getAdapter } from '@/features/import-export/lib/adapterRegistry';
import { registerCoreImportExportAdapters } from '@/features/import-export/lib/registerCoreAdapters';
import { ingestContextFromAdapterPayload } from '@/features/import-export/lib/contextMapper';

const requestSchema = z.object({
    actionType: z.enum([
        'document_summary',
        'data_table_summary',
        'cheatsheet',
        'study_guide',
        'report',
        'action_plan',
    ]),
    title: z.string().trim().min(1).max(160).optional(),
    fileIds: z.array(z.string().uuid()).max(12).default([]),
    adapterSourceTypes: z.array(z.string().min(1)).max(8).default([]),
    instructions: z.string().trim().max(4000).default(''),
    exportToDocuments: z.boolean().default(false),
});

type FileRow = {
    id: string;
    original_name: string;
    mime_type: string;
    size_bytes: number;
    status: string;
};

type SourceBlock = {
    label: string;
    content: string;
};

export async function POST(req: Request): Promise<Response> {
    try {
        const { supabase, supabaseAdmin } = await createClients();
        const userId = await getRequestUserId(supabase);
        const parsed = requestSchema.safeParse(await req.json());
        if (!parsed.success) {
            return NextResponse.json(
                { error: 'INVALID_PAYLOAD', details: parsed.error.flatten() },
                { status: 400 },
            );
        }

        registerCoreImportExportAdapters();
        const { actionType, fileIds, adapterSourceTypes, instructions } =
            parsed.data;
        const action = getFileAiAction(actionType as FileAiActionType);
        if (!action) {
            return NextResponse.json(
                { error: 'UNKNOWN_ACTION_TYPE' },
                { status: 400 },
            );
        }

        const warnings: string[] = [];
        const fileSources = await collectFileSources(
            supabase,
            userId,
            fileIds,
            warnings,
        );
        const adapterSources = await collectAdapterSources(
            supabase,
            userId,
            adapterSourceTypes,
            warnings,
        );

        if (fileSources.length === 0 && adapterSources.length === 0) {
            return NextResponse.json(
                {
                    error: 'NO_SOURCES',
                    message:
                        'Select at least one extracted file or import-export data source.',
                    warnings,
                },
                { status: 400 },
            );
        }

        const title = parsed.data.title ?? defaultTitle(action.label);
        const content = await generateArtifactContent(supabaseAdmin, userId, {
            actionLabel: action.label,
            title,
            instructions,
            sources: [...fileSources, ...adapterSources],
        });

        const artifact = await createArtifact(supabase, userId, {
            type: action.artifactType,
            title,
            content,
            contentFormat: 'markdown',
            ...(fileIds.length === 1 ? { sourceFileId: fileIds[0] } : {}),
            tags: [
                'ai-generated',
                'files-workflow',
                action.type.replace(/_/g, '-'),
            ],
            metadata: {
                actionType,
                fileIds,
                adapterSourceTypes,
                warnings,
                generatedFrom: 'files_ai_action_flow',
            },
        });

        let documentId: string | null = null;
        if (parsed.data.exportToDocuments) {
            const document = await createDocument(supabase, userId, {
                title,
                content,
                format: 'markdown',
                ...(fileIds.length === 1 ? { sourceFileId: fileIds[0] } : {}),
                sourceArtifactId: artifact.id,
                tags: ['ai-generated', action.type.replace(/_/g, '-')],
                metadata: {
                    artifactId: artifact.id,
                    actionType,
                    sourceFileIds: fileIds,
                    adapterSourceTypes,
                },
            });
            documentId = document.id;
            await ingestGeneratedDocumentContext(supabase, userId, {
                documentId: document.id,
                artifactId: artifact.id,
                title: document.title,
                content: document.content,
                fileIds,
            });
        }

        await publishActivityEventSafe(supabase, {
            userId,
            source: 'artifact',
            eventType: 'artifact.generated',
            sourceId: artifact.id,
            sourceTable: 'artifacts',
            category: 'ai',
            severity: 'success',
            priority: 'normal',
            title: `${action.label} generated: ${artifact.title}`,
            body: content.slice(0, 200),
            actionUrl: '/files',
            relatedEntities: [
                { type: 'artifact', id: artifact.id, label: artifact.title },
                ...fileIds.map((id) => ({ type: 'file', id })),
            ],
            metadata: {
                actionType,
                fileCount: fileIds.length,
                adapterSourceTypes,
                documentId,
            },
        });

        return NextResponse.json({
            data: {
                artifact,
                documentId,
                warnings,
            },
        });
    } catch (error) {
        const message =
            error instanceof Error ? error.message : 'Generation failed';
        const status =
            message === 'NO_MODEL_KEY' || message === 'MODEL_FAILED'
                ? 503
                : 500;
        return NextResponse.json({ error: message }, { status });
    }
}

async function collectFileSources(
    supabase: Awaited<ReturnType<typeof createClients>>['supabase'],
    userId: string,
    fileIds: string[],
    warnings: string[],
): Promise<SourceBlock[]> {
    if (fileIds.length === 0) return [];

    const { data, error } = await supabase
        .from('file_uploads')
        .select('id, original_name, mime_type, size_bytes, status')
        .eq('user_id', userId)
        .in('id', fileIds);
    if (error) throw error;

    const files = (data ?? []) as FileRow[];
    const blocks: SourceBlock[] = [];
    for (const file of files) {
        const extraction = await getExtraction(supabase, userId, file.id).catch(
            () => null,
        );
        if (!extraction || extraction.extractionStatus !== 'ready') {
            warnings.push(
                `${file.original_name} has no ready text extraction; convert/extract it before using full text.`,
            );
            blocks.push({
                label: `File metadata: ${file.original_name}`,
                content: JSON.stringify(
                    {
                        id: file.id,
                        name: file.original_name,
                        mimeType: file.mime_type,
                        sizeBytes: file.size_bytes,
                        status: file.status,
                    },
                    null,
                    2,
                ),
            });
            continue;
        }
        blocks.push({
            label: `Extracted file: ${file.original_name}`,
            content: extraction.extractedText.slice(0, 40_000),
        });
    }
    return blocks;
}

async function collectAdapterSources(
    supabase: Awaited<ReturnType<typeof createClients>>['supabase'],
    userId: string,
    sourceTypes: string[],
    warnings: string[],
): Promise<SourceBlock[]> {
    const blocks: SourceBlock[] = [];
    for (const sourceType of sourceTypes) {
        const adapter = getAdapter(sourceType);
        if (!adapter?.exportData) {
            warnings.push(`${sourceType} is not exportable.`);
            continue;
        }
        try {
            const result = await adapter.exportData(userId, {
                format: 'json',
                limit: 120,
            });
            void ingestContextFromAdapterPayload(
                supabase,
                userId,
                sourceType,
                result.rows,
            ).catch(() => undefined);
            blocks.push({
                label: `Import-export data: ${adapter.displayName}`,
                content: JSON.stringify(
                    result.rows.map((row) => row.data),
                    null,
                    2,
                ).slice(0, 30_000),
            });
            warnings.push(...result.warnings);
        } catch (error) {
            warnings.push(
                `${sourceType} export failed: ${error instanceof Error ? error.message : 'unknown error'}`,
            );
        }
    }
    return blocks;
}

async function generateArtifactContent(
    supabase: Awaited<ReturnType<typeof createClients>>['supabase'],
    userId: string,
    input: {
        actionLabel: string;
        title: string;
        instructions: string;
        sources: SourceBlock[];
    },
): Promise<string> {
    const apiKey =
        (await getModelKey(supabase, userId, 'anthropic').catch(() => null)) ??
        process.env.ANTHROPIC_API_KEY ??
        null;
    if (!apiKey) throw new Error('NO_MODEL_KEY');

    const sourceText = input.sources
        .map(
            (source, index) =>
                `## Source ${index + 1}: ${source.label}\n\n${source.content}`,
        )
        .join('\n\n---\n\n')
        .slice(0, 90_000);
    const prompt = `You are generating a WebWidgets file artifact.

Output type: ${input.actionLabel}
Title: ${input.title}
User instructions: ${input.instructions || '(none)'}

Use only the provided file and import-export source data. If a source is metadata-only, say what is missing instead of pretending full text was available.

Return polished Markdown only. Include source-aware sections, concrete observations, and next steps where useful.

${sourceText}`;

    const anthropic = new Anthropic({ apiKey });
    const response = await anthropic.messages.create({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 4096,
        messages: [{ role: 'user', content: prompt }],
    });
    const firstBlock = response.content[0];
    if (firstBlock?.type !== 'text' || !firstBlock.text.trim()) {
        throw new Error('MODEL_FAILED');
    }
    return firstBlock.text;
}

async function ingestGeneratedDocumentContext(
    supabase: Awaited<ReturnType<typeof createClients>>['supabase'],
    userId: string,
    input: {
        documentId: string;
        artifactId: string;
        title: string;
        content: string;
        fileIds: string[];
    },
): Promise<void> {
    await ingestContextNode(supabase, userId, {
        entityId: `document:${input.documentId}`,
        type: 'document',
        label: input.title,
        summary: input.content.slice(0, 240),
        data: {
            sourceArtifactId: input.artifactId,
            sourceFileIds: input.fileIds,
            format: 'markdown',
        },
        tags: ['ai-generated'],
        sourceType: 'documents',
        sourceId: input.documentId,
        sourceTable: 'documents',
        createdByType: 'agent',
        permissions: ['private', 'ai', 'cross_widget'],
    });
    await ingestContextEdge(supabase, userId, {
        fromEntityId: `document:${input.documentId}`,
        toEntityId: `artifact:${input.artifactId}`,
        kind: 'derived_from',
        label: 'document exported from artifact',
        sourceType: 'documents',
        sourceId: input.documentId,
        createdByType: 'agent',
    });
    await Promise.all(
        input.fileIds.map((fileId) =>
            ingestContextEdge(supabase, userId, {
                fromEntityId: `document:${input.documentId}`,
                toEntityId: `file:${fileId}`,
                kind: 'derived_from',
                label: 'document generated with file source',
                sourceType: 'documents',
                sourceId: input.documentId,
                createdByType: 'agent',
            }),
        ),
    );
}

function defaultTitle(label: string): string {
    return `${label} ${new Date().toISOString().slice(0, 10)}`;
}
