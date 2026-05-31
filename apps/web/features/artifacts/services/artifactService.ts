import type { SupabaseClient } from '@supabase/supabase-js';
import {
    type Artifact,
    type ArtifactRow,
    type ArtifactType,
    rowToArtifact,
} from '@/features/artifacts/types/artifact';
import { ingestArtifactContext } from '@/features/context/services/contextProducerService';

interface CreateArtifactInput {
    type: ArtifactType;
    title: string;
    content: string;
    contentFormat?: 'markdown' | 'json' | 'plain_text';
    sourceFileId?: string;
    sourceDocumentId?: string;
    sourceJobId?: string;
    tags?: string[];
    metadata?: Record<string, unknown>;
}

interface UpdateArtifactInput {
    title?: string;
    content?: string;
    contentFormat?: 'markdown' | 'json' | 'plain_text';
    tags?: string[];
    metadata?: Record<string, unknown>;
}

interface ListArtifactsOptions {
    limit?: number;
    type?: ArtifactType;
    archived?: boolean;
}

export async function createArtifact(
    supabase: SupabaseClient,
    userId: string,
    data: CreateArtifactInput,
): Promise<Artifact> {
    const result = await supabase
        .from('artifacts')
        .insert({
            user_id: userId,
            type: data.type,
            title: data.title,
            content: data.content,
            content_format: data.contentFormat ?? 'markdown',
            ...(data.sourceFileId !== undefined
                ? { source_file_id: data.sourceFileId }
                : {}),
            ...(data.sourceDocumentId !== undefined
                ? { source_document_id: data.sourceDocumentId }
                : {}),
            ...(data.sourceJobId !== undefined
                ? { source_job_id: data.sourceJobId }
                : {}),
            tags: data.tags ?? [],
            ...(data.metadata !== undefined ? { metadata: data.metadata } : {}),
        })
        .select()
        .single();
    if (result.error) throw result.error;
    const artifact = rowToArtifact(result.data as unknown as ArtifactRow);
    await ingestArtifactContext(supabase, artifact).catch(() => undefined);
    return artifact;
}

export async function listArtifacts(
    supabase: SupabaseClient,
    userId: string,
    opts?: ListArtifactsOptions,
): Promise<Artifact[]> {
    let query = supabase
        .from('artifacts')
        .select('*')
        .eq('user_id', userId)
        .is('deleted_at', null)
        .order('created_at', { ascending: false })
        .limit(opts?.limit ?? 100);

    if (opts?.type) {
        query = query.eq('type', opts.type);
    }
    if (!opts?.archived) {
        query = query.is('archived_at', null);
    }

    const result = await query;
    if (result.error) throw result.error;
    return ((result.data ?? []) as unknown as ArtifactRow[]).map(rowToArtifact);
}

export async function getArtifact(
    supabase: SupabaseClient,
    userId: string,
    id: string,
): Promise<Artifact | null> {
    const result = await supabase
        .from('artifacts')
        .select('*')
        .eq('user_id', userId)
        .eq('id', id)
        .maybeSingle();
    if (result.error) throw result.error;
    if (!result.data) return null;
    return rowToArtifact(result.data as unknown as ArtifactRow);
}

export async function updateArtifact(
    supabase: SupabaseClient,
    userId: string,
    id: string,
    data: UpdateArtifactInput,
): Promise<Artifact> {
    const updatePayload: Record<string, unknown> = {
        updated_at: new Date().toISOString(),
    };
    if (data.title !== undefined) updatePayload.title = data.title;
    if (data.content !== undefined) updatePayload.content = data.content;
    if (data.contentFormat !== undefined)
        updatePayload.content_format = data.contentFormat;
    if (data.tags !== undefined) updatePayload.tags = data.tags;
    if (data.metadata !== undefined) updatePayload.metadata = data.metadata;

    const result = await supabase
        .from('artifacts')
        .update(updatePayload)
        .eq('user_id', userId)
        .eq('id', id)
        .select()
        .single();
    if (result.error) throw result.error;
    return rowToArtifact(result.data as unknown as ArtifactRow);
}

export async function archiveArtifact(
    supabase: SupabaseClient,
    userId: string,
    id: string,
): Promise<void> {
    const result = await supabase
        .from('artifacts')
        .update({ archived_at: new Date().toISOString() })
        .eq('user_id', userId)
        .eq('id', id);
    if (result.error) throw result.error;
}

export async function deleteArtifact(
    supabase: SupabaseClient,
    userId: string,
    id: string,
): Promise<void> {
    const result = await supabase
        .from('artifacts')
        .update({ deleted_at: new Date().toISOString() })
        .eq('user_id', userId)
        .eq('id', id);
    if (result.error) throw result.error;
}
