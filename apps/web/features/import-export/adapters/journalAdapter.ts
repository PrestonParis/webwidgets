import { createClients } from '@/lib/supabase/serverClient';
import { isMissingTableError } from '@/lib/supabase/missingTable';
import type { ImportExportAdapter } from '@/features/import-export/lib/adapterInterface';
import type {
    AdapterAvailability,
    ExportOptions,
    ExportResult,
    ImportExecutionResult,
    MappedRow,
    DuplicateStrategy,
} from '@/features/import-export/types/importExport';

export const journalAdapter: ImportExportAdapter = {
    id: 'journals',
    displayName: 'Journal',
    description: 'Journal entries and notes — import/export your writing',
    sourceType: 'journals',
    canImport: true,
    canExport: true,
    canProvideContext: false,
    importFormats: ['csv', 'json'],
    exportFormats: ['csv', 'json'],

    async checkAvailability(): Promise<AdapterAvailability> {
        try {
            const { supabase } = await createClients();
            const { error } = await supabase
                .from('journals')
                .select('id')
                .limit(1);
            if (error) {
                if (isMissingTableError(error)) {
                    return {
                        available: false,
                        message: 'journals table not found',
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
            .from('journals')
            .select('id, title, content, type, created_at')
            .eq('user_id', userId)
            .is('deleted_at', null)
            .order('created_at', { ascending: false });

        if (options?.limit) query = query.limit(options.limit);

        const { data, error } = await query;
        if (error) {
            if (isMissingTableError(error)) {
                warnings.push('journals table not configured');
                return { rows: [], totalCount: 0, warnings };
            }
            throw error;
        }

        const rows: MappedRow[] = (data ?? []).map((row, i) => ({
            rowIndex: i,
            data: {
                id: String(row.id),
                title: row.title ?? '',
                content: row.content ?? '',
                type: row.type ?? 'journal',
                created_at: row.created_at ?? '',
            },
        }));

        return { rows, totalCount: rows.length, warnings };
    },

    async importData(
        userId: string,
        rows: MappedRow[],
        strategy: DuplicateStrategy,
    ): Promise<ImportExecutionResult> {
        const { supabase } = await createClients();
        let successCount = 0;
        let errorCount = 0;
        const errors: { rowIndex: number; message: string }[] = [];
        const warnings: string[] = [];

        if (strategy === 'merge') {
            warnings.push(
                "'merge' strategy not fully implemented — using 'overwrite' behavior",
            );
        }

        for (const row of rows) {
            try {
                const d = row.data as Record<string, unknown>;

                if (!d['content']) {
                    errors.push({
                        rowIndex: row.rowIndex,
                        message: 'Missing required field: content',
                    });
                    errorCount++;
                    continue;
                }

                // Skip if id already exists
                if (strategy === 'skip' && d['id']) {
                    const { data: existing } = await supabase
                        .from('journals')
                        .select('id')
                        .eq('id', String(d['id']))
                        .single();
                    if (existing) {
                        warnings.push(
                            `Row ${row.rowIndex}: skipped existing journal entry (id=${String(d['id'])})`,
                        );
                        continue;
                    }
                }

                const record = {
                    user_id: userId,
                    title: d['title'] ? String(d['title']) : '',
                    content: String(d['content']),
                    type: d['type'] ? String(d['type']) : 'journal',
                };

                const { error } = await supabase
                    .from('journals')
                    .insert(record);
                if (error) throw error;
                successCount++;
            } catch (e) {
                errors.push({
                    rowIndex: row.rowIndex,
                    message: e instanceof Error ? e.message : String(e),
                });
                errorCount++;
            }
        }

        return {
            successCount,
            errorCount,
            warningCount: warnings.length,
            errors,
            warnings,
        };
    },
};
