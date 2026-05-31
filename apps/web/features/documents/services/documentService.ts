import type { SupabaseClient } from '@supabase/supabase-js';
import {
    type Document,
    type DocumentRow,
    rowToDocument,
} from '@/features/documents/types/document';

interface CreateDocumentInput {
    title: string;
    content: string;
    format?: 'markdown' | 'plain_text' | 'rich_text' | 'json';
    sourceFileId?: string;
    sourceArtifactId?: string;
    tags?: string[];
    metadata?: Record<string, unknown>;
}

interface UpdateDocumentInput {
    title?: string;
    content?: string;
    format?: 'markdown' | 'plain_text' | 'rich_text' | 'json';
    tags?: string[];
    metadata?: Record<string, unknown>;
}

interface ListDocumentsOptions {
    limit?: number;
    archived?: boolean;
    deleted?: boolean;
}

export async function createDocument(
    supabase: SupabaseClient,
    userId: string,
    data: CreateDocumentInput,
): Promise<Document> {
    const result = await supabase
        .from('documents')
        .insert({
            user_id: userId,
            title: data.title,
            content: data.content,
            format: data.format ?? 'markdown',
            ...(data.sourceFileId !== undefined
                ? { source_file_id: data.sourceFileId }
                : {}),
            ...(data.sourceArtifactId !== undefined
                ? { source_artifact_id: data.sourceArtifactId }
                : {}),
            tags: data.tags ?? [],
            ...(data.metadata !== undefined ? { metadata: data.metadata } : {}),
        })
        .select()
        .single();
    if (result.error) throw result.error;
    return rowToDocument(result.data as unknown as DocumentRow);
}

export async function listDocuments(
    supabase: SupabaseClient,
    userId: string,
    opts?: ListDocumentsOptions,
): Promise<Document[]> {
    let query = supabase
        .from('documents')
        .select('*')
        .eq('user_id', userId)
        .order('updated_at', { ascending: false })
        .limit(opts?.limit ?? 100);

    if (!opts?.deleted) {
        query = query.is('deleted_at', null);
    }
    if (!opts?.archived) {
        query = query.is('archived_at', null);
    }

    const result = await query;
    if (result.error) throw result.error;
    return ((result.data ?? []) as unknown as DocumentRow[]).map(rowToDocument);
}

export async function getDocument(
    supabase: SupabaseClient,
    userId: string,
    id: string,
): Promise<Document | null> {
    const result = await supabase
        .from('documents')
        .select('*')
        .eq('user_id', userId)
        .eq('id', id)
        .maybeSingle();
    if (result.error) throw result.error;
    if (!result.data) return null;
    return rowToDocument(result.data as unknown as DocumentRow);
}

export async function updateDocument(
    supabase: SupabaseClient,
    userId: string,
    id: string,
    data: UpdateDocumentInput,
): Promise<Document> {
    const updatePayload: Record<string, unknown> = {
        updated_at: new Date().toISOString(),
    };
    if (data.title !== undefined) updatePayload.title = data.title;
    if (data.content !== undefined) updatePayload.content = data.content;
    if (data.format !== undefined) updatePayload.format = data.format;
    if (data.tags !== undefined) updatePayload.tags = data.tags;
    if (data.metadata !== undefined) updatePayload.metadata = data.metadata;

    const result = await supabase
        .from('documents')
        .update(updatePayload)
        .eq('user_id', userId)
        .eq('id', id)
        .select()
        .single();
    if (result.error) throw result.error;
    return rowToDocument(result.data as unknown as DocumentRow);
}

export async function archiveDocument(
    supabase: SupabaseClient,
    userId: string,
    id: string,
): Promise<void> {
    const result = await supabase
        .from('documents')
        .update({ archived_at: new Date().toISOString() })
        .eq('user_id', userId)
        .eq('id', id);
    if (result.error) throw result.error;
}

export async function deleteDocument(
    supabase: SupabaseClient,
    userId: string,
    id: string,
): Promise<void> {
    const result = await supabase
        .from('documents')
        .update({ deleted_at: new Date().toISOString() })
        .eq('user_id', userId)
        .eq('id', id);
    if (result.error) throw result.error;
}
