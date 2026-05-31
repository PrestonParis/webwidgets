import { createClients } from '@/lib/supabase/serverClient';
import { isMissingTableError } from '@/lib/supabase/missingTable';
import type { ImportExportAdapter } from '@/features/import-export/lib/adapterInterface';
import type {
    AdapterAvailability,
    DuplicateStrategy,
    ExportOptions,
    ExportResult,
    ImportExecutionResult,
    MappedRow,
} from '@/features/import-export/types/importExport';
import { getContextMapper } from '@/features/import-export/lib/contextMapper';

export const documentsAdapter: ImportExportAdapter = {
    id: 'documents',
    displayName: 'Documents',
    description: 'Documents created in WebWidgets, including generated outputs',
    sourceType: 'documents',
    canImport: true,
    canExport: true,
    canProvideContext: false,
    importFormats: ['csv', 'json'],
    exportFormats: ['csv', 'json'],

    async checkAvailability(): Promise<AdapterAvailability> {
        try {
            const { supabase } = await createClients();
            const { error } = await supabase
                .from('documents')
                .select('id')
                .limit(1);
            if (error) {
                if (isMissingTableError(error)) {
                    return {
                        available: false,
                        message: 'documents table not found',
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
            .from('documents')
            .select(
                'id,title,content,format,source_file_id,source_artifact_id,tags,metadata,created_at,updated_at',
            )
            .eq('user_id', userId)
            .is('deleted_at', null)
            .order('updated_at', { ascending: false });
        if (options?.limit) query = query.limit(options.limit);

        const { data, error } = await query;
        if (error) {
            if (isMissingTableError(error)) {
                warnings.push('documents table not configured');
                return { rows: [], totalCount: 0, warnings };
            }
            throw error;
        }

        const rows: MappedRow[] = (data ?? []).map((row, index) => ({
            rowIndex: index,
            data: {
                id: row.id,
                title: row.title,
                content: row.content,
                format: row.format,
                source_file_id: row.source_file_id,
                source_artifact_id: row.source_artifact_id,
                tags: Array.isArray(row.tags) ? row.tags.join(',') : '',
                metadata: row.metadata,
                created_at: row.created_at,
                updated_at: row.updated_at,
            },
        }));

        return { rows, totalCount: rows.length, warnings };
    },

    async importData(
        userId: string,
        rows: MappedRow[],
        _strategy: DuplicateStrategy,
    ): Promise<ImportExecutionResult> {
        const { supabase } = await createClients();
        let successCount = 0;
        let errorCount = 0;
        const errors: { rowIndex: number; message: string }[] = [];

        for (const row of rows) {
            try {
                const data = row.data;
                const title =
                    typeof data.title === 'string' && data.title.trim()
                        ? data.title.trim()
                        : 'Imported document';
                const content =
                    typeof data.content === 'string' ? data.content : '';
                if (!content) {
                    errors.push({
                        rowIndex: row.rowIndex,
                        message: 'Missing required field: content',
                    });
                    errorCount += 1;
                    continue;
                }
                const tags =
                    typeof data.tags === 'string'
                        ? data.tags
                              .split(',')
                              .map((tag) => tag.trim())
                              .filter(Boolean)
                        : [];

                const { error } = await supabase.from('documents').insert({
                    user_id: userId,
                    title,
                    content,
                    format:
                        data.format === 'json' ||
                        data.format === 'plain_text' ||
                        data.format === 'rich_text'
                            ? data.format
                            : 'markdown',
                    tags,
                });
                if (error) throw error;
                successCount += 1;
            } catch (error) {
                errors.push({
                    rowIndex: row.rowIndex,
                    message:
                        error instanceof Error ? error.message : String(error),
                });
                errorCount += 1;
            }
        }

        return {
            successCount,
            errorCount,
            warningCount: 0,
            errors,
            warnings: [],
        };
    },

    mapToContext: getContextMapper('documents'),
};
