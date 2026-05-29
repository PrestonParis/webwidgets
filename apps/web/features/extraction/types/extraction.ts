export interface FileTextExtractionRow {
    id: string;
    user_id: string;
    file_id: string;
    conversion_id: string | null;
    source_storage_path: string;
    extracted_text: string;
    text_format: 'plain_text' | 'markdown' | 'html';
    character_count: number;
    token_estimate: number | null;
    extraction_status: 'pending' | 'processing' | 'ready' | 'failed';
    extraction_error: string | null;
    created_at: string;
    updated_at: string;
}

export interface FileTextExtraction {
    id: string;
    userId: string;
    fileId: string;
    conversionId: string | null;
    sourceStoragePath: string;
    extractedText: string;
    textFormat: 'plain_text' | 'markdown' | 'html';
    characterCount: number;
    tokenEstimate: number | null;
    extractionStatus: 'pending' | 'processing' | 'ready' | 'failed';
    extractionError: string | null;
    createdAt: string;
    updatedAt: string;
}

export function rowToExtraction(
    row: FileTextExtractionRow,
): FileTextExtraction {
    return {
        id: row.id,
        userId: row.user_id,
        fileId: row.file_id,
        conversionId: row.conversion_id,
        sourceStoragePath: row.source_storage_path,
        extractedText: row.extracted_text,
        textFormat: row.text_format,
        characterCount: row.character_count,
        tokenEstimate: row.token_estimate,
        extractionStatus: row.extraction_status,
        extractionError: row.extraction_error,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
    };
}
