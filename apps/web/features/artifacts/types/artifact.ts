export type ArtifactType =
    | 'summary'
    | 'cheatsheet'
    | 'flashcards'
    | 'study_guide'
    | 'outline'
    | 'report'
    | 'action_plan'
    | 'extraction'
    | 'other';

export interface ArtifactRow {
    id: string;
    user_id: string;
    type: ArtifactType;
    title: string;
    content: string;
    content_format: 'markdown' | 'json' | 'plain_text';
    source_file_id: string | null;
    source_document_id: string | null;
    source_job_id: string | null;
    parent_artifact_id: string | null;
    tags: string[];
    metadata: Record<string, unknown>;
    created_at: string;
    updated_at: string;
    archived_at: string | null;
    deleted_at: string | null;
}

export interface Artifact {
    id: string;
    userId: string;
    type: ArtifactType;
    title: string;
    content: string;
    contentFormat: 'markdown' | 'json' | 'plain_text';
    sourceFileId: string | null;
    sourceDocumentId: string | null;
    sourceJobId: string | null;
    parentArtifactId: string | null;
    tags: string[];
    metadata: Record<string, unknown>;
    createdAt: string;
    updatedAt: string;
    archivedAt: string | null;
    deletedAt: string | null;
}

export function rowToArtifact(row: ArtifactRow): Artifact {
    return {
        id: row.id,
        userId: row.user_id,
        type: row.type,
        title: row.title,
        content: row.content,
        contentFormat: row.content_format,
        sourceFileId: row.source_file_id,
        sourceDocumentId: row.source_document_id,
        sourceJobId: row.source_job_id,
        parentArtifactId: row.parent_artifact_id,
        tags: row.tags,
        metadata: row.metadata,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
        archivedAt: row.archived_at,
        deletedAt: row.deleted_at,
    };
}
