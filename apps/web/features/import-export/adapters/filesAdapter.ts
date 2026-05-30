import { createClients } from '@/lib/supabase/serverClient';
import { isMissingTableError } from '@/lib/supabase/missingTable';
import type { ImportExportAdapter } from '@/features/import-export/lib/adapterInterface';
import type {
    AdapterAvailability,
    ExportOptions,
    ExportResult,
    MappedRow,
} from '@/features/import-export/types/importExport';

export const filesAdapter: ImportExportAdapter = {
    id: 'files',
    displayName: 'Files',
    description: 'Uploaded files: list and export file metadata from View',
    sourceType: 'files',
    canImport: false,
    canExport: true,
    canProvideContext: false,
    importFormats: [],
    exportFormats: ['csv', 'json'],

    async checkAvailability(): Promise<AdapterAvailability> {
        try {
            const { supabase } = await createClients();
            const { error } = await supabase
                .from('file_uploads')
                .select('id')
                .limit(1);
            if (error) {
                if (isMissingTableError(error)) {
                    return {
                        available: false,
                        message: 'file_uploads table not found',
                    };
                }
                return { available: false, message: error.message };
            }
            return { available: true };
        } catch (e) {
            return {
                available: false,
                message: e instanceof Error ? e.message : 'Unknown error',
            };
        }
    },

    async exportData(
        userId: string,
        options?: ExportOptions,
    ): Promise<ExportResult> {
        const { supabase } = await createClients();
        const warnings: string[] = [];

        let query = supabase
            .from('file_uploads')
            .select(
                'id, user_id, original_name, mime_type, size_bytes, s3_key, status, created_at, updated_at',
            )
            .eq('user_id', userId)
            .eq('status', 'uploaded')
            .order('created_at', { ascending: false });

        if (options?.limit) query = query.limit(options.limit);

        const { data, error } = await query;
        if (error) {
            if (isMissingTableError(error)) {
                warnings.push('file_uploads table not configured');
                return { rows: [], totalCount: 0, warnings };
            }
            throw error;
        }

        const rows: MappedRow[] = (data ?? []).map((row, i) => ({
            rowIndex: i,
            data: {
                id: row.id,
                name: row.original_name,
                mime_type: row.mime_type,
                size_bytes: row.size_bytes,
                s3_key: row.s3_key,
                status: row.status,
                uploaded_at: row.created_at,
                updated_at: row.updated_at,
            },
        }));

        return { rows, totalCount: rows.length, warnings };
    },
};
