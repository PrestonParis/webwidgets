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
import { getContextMapper } from '@/features/import-export/lib/contextMapper';

export const todosAdapter: ImportExportAdapter = {
    id: 'todos',
    displayName: 'Todos',
    description: 'Task list: import/export your todos and task data',
    sourceType: 'todos',
    canImport: true,
    canExport: true,
    canProvideContext: false,
    importFormats: ['csv', 'json'],
    exportFormats: ['csv', 'json'],

    async checkAvailability(): Promise<AdapterAvailability> {
        try {
            const { supabase } = await createClients();
            const { error } = await supabase
                .from('todos')
                .select('id')
                .limit(1);
            if (error) {
                if (isMissingTableError(error)) {
                    return {
                        available: false,
                        message: 'todos table not found',
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
            .from('todos')
            .select('id, text, completed, created_at, completed_at')
            .eq('user_id', userId)
            .order('created_at', { ascending: false });

        if (options?.limit) query = query.limit(options.limit);

        const { data, error } = await query;
        if (error) {
            if (isMissingTableError(error)) {
                warnings.push('todos table not configured');
                return { rows: [], totalCount: 0, warnings };
            }
            throw error;
        }

        const rows: MappedRow[] = (data ?? []).map((row, i) => ({
            rowIndex: i,
            data: {
                id: row.id,
                // The todos table uses 'text' as the task description column.
                // Expose it as both 'text' (native) and 'title' (normalized alias).
                text: row.text ?? '',
                title: row.text ?? '',
                completed: row.completed ?? false,
                done: row.completed ?? false,
                created_at: row.created_at,
                completed_at: row.completed_at ?? '',
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

        for (const row of rows) {
            try {
                const d = row.data as Record<string, unknown>;
                // Accept 'text' (native) or 'title' (normalized alias)
                const textValue = (d['text'] ?? d['title']) as
                    | string
                    | undefined;
                if (!textValue) {
                    errors.push({
                        rowIndex: row.rowIndex,
                        message: 'Missing required field: text (or title)',
                    });
                    errorCount++;
                    continue;
                }

                const completed =
                    d['completed'] === true ||
                    d['done'] === true ||
                    d['done'] === 'true' ||
                    d['done'] === '1';

                const rowId = d['id'] ? String(d['id']) : undefined;

                if (strategy === 'skip' && rowId) {
                    const { data: existing } = await supabase
                        .from('todos')
                        .select('id')
                        .eq('id', rowId)
                        .single();
                    if (existing) {
                        warnings.push(
                            `Row ${row.rowIndex}: skipped existing todo (id=${rowId})`,
                        );
                        continue;
                    }
                }

                if (strategy === 'merge' && rowId) {
                    const { data: existing } = await supabase
                        .from('todos')
                        .select('text, completed')
                        .eq('id', rowId)
                        .maybeSingle();
                    if (existing) {
                        const { error } = await supabase
                            .from('todos')
                            .update({
                                // Only overwrite text if the imported value differs from existing
                                text: textValue || existing.text,
                                completed,
                            })
                            .eq('id', rowId);
                        if (error) throw error;
                        successCount++;
                        continue;
                    }
                    // No existing record — fall through to insert
                }

                if (strategy === 'overwrite' && rowId) {
                    const { error } = await supabase.from('todos').upsert(
                        {
                            id: rowId,
                            user_id: userId,
                            text: String(textValue),
                            completed,
                        },
                        { onConflict: 'id' },
                    );
                    if (error) throw error;
                    successCount++;
                    continue;
                }

                const { error } = await supabase.from('todos').insert({
                    user_id: userId,
                    text: String(textValue),
                    completed,
                });
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

    mapToContext: getContextMapper('todos'),
};
