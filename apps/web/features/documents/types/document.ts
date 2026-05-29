export interface DocumentRow {
    id: string;
    user_id: string;
    title: string;
    content: string;
    format: 'markdown' | 'plain_text' | 'rich_text' | 'json';
    source_file_id: string | null;
    source_artifact_id: string | null;
    folder_id: string | null;
    tags: string[];
    metadata: Record<string, unknown>;
    created_at: string;
    updated_at: string;
    archived_at: string | null;
    deleted_at: string | null;
}

export interface Document {
    id: string;
    userId: string;
    title: string;
    content: string;
    format: 'markdown' | 'plain_text' | 'rich_text' | 'json';
    sourceFileId: string | null;
    sourceArtifactId: string | null;
    folderId: string | null;
    tags: string[];
    metadata: Record<string, unknown>;
    createdAt: string;
    updatedAt: string;
    archivedAt: string | null;
    deletedAt: string | null;
}

export function rowToDocument(row: DocumentRow): Document {
    return {
        id: row.id,
        userId: row.user_id,
        title: row.title,
        content: row.content,
        format: row.format,
        sourceFileId: row.source_file_id,
        sourceArtifactId: row.source_artifact_id,
        folderId: row.folder_id,
        tags: row.tags,
        metadata: row.metadata,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
        archivedAt: row.archived_at,
        deletedAt: row.deleted_at,
    };
}
