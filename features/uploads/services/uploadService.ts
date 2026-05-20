import type { SupabaseClient } from '@supabase/supabase-js';
import type {
    FileUpload,
    FileUploadRow,
} from '@/features/uploads/types/upload';
import { rowToFileUpload } from '@/features/uploads/types/upload';

const TABLE = 'file_uploads';

export async function insertUploadRecord(
    supabase: SupabaseClient,
    data: {
        userId: string;
        fileId: string;
        originalName: string;
        mimeType: string;
        sizeBytes: number;
        s3Key: string;
    },
): Promise<FileUpload> {
    const result = await supabase
        .from(TABLE)
        .insert({
            id: data.fileId,
            user_id: data.userId,
            original_name: data.originalName,
            mime_type: data.mimeType,
            size_bytes: data.sizeBytes,
            s3_key: data.s3Key,
            status: 'pending',
        })
        .select()
        .single();

    if (result.error) throw result.error;
    return rowToFileUpload(result.data as FileUploadRow);
}

export async function confirmUpload(
    supabase: SupabaseClient,
    userId: string,
    fileId: string,
): Promise<FileUpload> {
    const result = await supabase
        .from(TABLE)
        .update({ status: 'uploaded', updated_at: new Date().toISOString() })
        .eq('id', fileId)
        .eq('user_id', userId)
        .select()
        .single();

    if (result.error) throw result.error;
    return rowToFileUpload(result.data as FileUploadRow);
}

export async function markUploadDeleted(
    supabase: SupabaseClient,
    userId: string,
    fileId: string,
): Promise<void> {
    const { error } = await supabase
        .from(TABLE)
        .update({ status: 'deleted', updated_at: new Date().toISOString() })
        .eq('id', fileId)
        .eq('user_id', userId);

    if (error) throw error;
}

export async function listUploads(
    supabase: SupabaseClient,
    userId: string,
): Promise<FileUpload[]> {
    const { data, error } = await supabase
        .from(TABLE)
        .select('*')
        .eq('user_id', userId)
        .eq('status', 'uploaded')
        .order('created_at', { ascending: false });

    if (error) throw error;
    return (data as FileUploadRow[]).map(rowToFileUpload);
}

export async function getUpload(
    supabase: SupabaseClient,
    userId: string,
    fileId: string,
): Promise<FileUpload | null> {
    const { data, error } = await supabase
        .from(TABLE)
        .select('*')
        .eq('id', fileId)
        .eq('user_id', userId)
        .maybeSingle();

    if (error) throw error;
    return data ? rowToFileUpload(data as FileUploadRow) : null;
}
