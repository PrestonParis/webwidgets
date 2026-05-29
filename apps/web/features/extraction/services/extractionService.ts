import type { SupabaseClient } from '@supabase/supabase-js';
import {
    type FileTextExtraction,
    type FileTextExtractionRow,
    rowToExtraction,
} from '@/features/extraction/types/extraction';

interface UpsertExtractionInput {
    fileId: string;
    sourcePath: string;
    extractedText: string;
    textFormat: 'plain_text' | 'markdown' | 'html';
    conversionId?: string;
}

export async function getExtraction(
    supabase: SupabaseClient,
    userId: string,
    fileId: string,
): Promise<FileTextExtraction | null> {
    const result = await supabase
        .from('file_text_extractions')
        .select('*')
        .eq('user_id', userId)
        .eq('file_id', fileId)
        .maybeSingle();
    if (result.error) throw result.error;
    if (!result.data) return null;
    return rowToExtraction(result.data as unknown as FileTextExtractionRow);
}

export async function upsertExtraction(
    supabase: SupabaseClient,
    userId: string,
    data: UpsertExtractionInput,
): Promise<FileTextExtraction> {
    const charCount = data.extractedText.length;
    // rough token estimate: ~4 chars per token
    const tokenEstimate = Math.ceil(charCount / 4);

    const result = await supabase
        .from('file_text_extractions')
        .upsert(
            {
                user_id: userId,
                file_id: data.fileId,
                source_storage_path: data.sourcePath,
                extracted_text: data.extractedText,
                text_format: data.textFormat,
                character_count: charCount,
                token_estimate: tokenEstimate,
                extraction_status: 'ready',
                extraction_error: null,
                updated_at: new Date().toISOString(),
                ...(data.conversionId !== undefined
                    ? { conversion_id: data.conversionId }
                    : {}),
            },
            { onConflict: 'file_id' },
        )
        .select()
        .single();
    if (result.error) throw result.error;
    return rowToExtraction(result.data as unknown as FileTextExtractionRow);
}

export async function markExtractionFailed(
    supabase: SupabaseClient,
    userId: string,
    fileId: string,
    error: string,
): Promise<void> {
    const result = await supabase.from('file_text_extractions').upsert(
        {
            user_id: userId,
            file_id: fileId,
            source_storage_path: '',
            extraction_status: 'failed',
            extraction_error: error,
            updated_at: new Date().toISOString(),
        },
        { onConflict: 'file_id' },
    );
    if (result.error) throw result.error;
}

export async function markExtractionProcessing(
    supabase: SupabaseClient,
    userId: string,
    fileId: string,
    sourcePath: string,
): Promise<FileTextExtraction> {
    const result = await supabase
        .from('file_text_extractions')
        .upsert(
            {
                user_id: userId,
                file_id: fileId,
                source_storage_path: sourcePath,
                extraction_status: 'processing',
                updated_at: new Date().toISOString(),
            },
            { onConflict: 'file_id' },
        )
        .select()
        .single();
    if (result.error) throw result.error;
    return rowToExtraction(result.data as unknown as FileTextExtractionRow);
}
