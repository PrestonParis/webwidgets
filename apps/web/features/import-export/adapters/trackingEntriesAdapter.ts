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

export const trackingEntriesAdapter: ImportExportAdapter = {
    id: 'tracking_entries',
    displayName: 'Tracking Entries',
    description: 'Daily tracking data (habits, health, productivity metrics)',
    sourceType: 'tracking_entries',
    canImport: true,
    canExport: true,
    canProvideContext: false,
    importFormats: ['csv', 'json'],
    exportFormats: ['csv', 'json'],

    async checkAvailability(): Promise<AdapterAvailability> {
        try {
            const { supabase } = await createClients();
            const { error } = await supabase
                .from('tracking_entries')
                .select('id')
                .limit(1);
            if (error) {
                if (isMissingTableError(error)) {
                    return {
                        available: false,
                        message: 'tracking_entries table not found',
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
            .from('tracking_entries')
            .select(
                'id,category,entry_date,logged_at,metadata,tags,notes,source,created_at',
            )
            .eq('user_id', userId)
            .order('entry_date', { ascending: false });

        if (options?.since) {
            query = query.gte('entry_date', options.since);
        }
        if (options?.limit) {
            query = query.limit(options.limit);
        }

        const { data, error } = await query;
        if (error) {
            if (isMissingTableError(error)) {
                warnings.push('tracking_entries table not configured');
                return { rows: [], totalCount: 0, warnings };
            }
            throw error;
        }

        const rows: MappedRow[] = (data ?? []).map((row, i) => ({
            rowIndex: i,
            data: {
                id: row.id,
                category: row.category,
                entry_date: row.entry_date,
                logged_at: row.logged_at,
                notes: row.notes ?? '',
                tags: Array.isArray(row.tags) ? row.tags.join(',') : '',
                source: row.source ?? '',
                ...((row.metadata as Record<string, unknown>) ?? {}),
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

        // TODO: 'merge' strategy is complex — treat as 'overwrite' for now
        if (strategy === 'merge') {
            warnings.push(
                "'merge' strategy not fully implemented — using 'overwrite' behavior",
            );
        }

        for (const row of rows) {
            try {
                const d = row.data as Record<string, unknown>;
                if (!d['category'] || !d['entry_date']) {
                    errors.push({
                        rowIndex: row.rowIndex,
                        message:
                            'Missing required fields: category, entry_date',
                    });
                    errorCount++;
                    continue;
                }

                const record = {
                    user_id: userId,
                    category: String(d['category']),
                    entry_date: String(d['entry_date']),
                    logged_at: d['logged_at']
                        ? String(d['logged_at'])
                        : new Date().toISOString(),
                    notes: d['notes'] ? String(d['notes']) : null,
                    tags: d['tags']
                        ? String(d['tags'])
                              .split(',')
                              .map((t) => t.trim())
                              .filter(Boolean)
                        : [],
                    source: d['source'] ? String(d['source']) : 'import',
                    metadata:
                        typeof d['metadata'] === 'object' &&
                        d['metadata'] !== null
                            ? d['metadata']
                            : {},
                };

                if (strategy === 'skip') {
                    // Check for existing entry with same category + entry_date
                    const { data: existing } = await supabase
                        .from('tracking_entries')
                        .select('id')
                        .eq('user_id', userId)
                        .eq('category', record.category)
                        .eq('entry_date', record.entry_date)
                        .limit(1)
                        .single();

                    if (existing) {
                        warnings.push(
                            `Row ${row.rowIndex}: skipped duplicate (${record.category} on ${record.entry_date})`,
                        );
                        continue;
                    }
                }

                if (strategy === 'overwrite' || strategy === 'merge') {
                    const { error } = await supabase
                        .from('tracking_entries')
                        .upsert(record, {
                            onConflict: 'user_id,category,entry_date',
                        });
                    if (error) throw error;
                } else {
                    // 'skip' (no duplicate) or 'keep_both'
                    const { error } = await supabase
                        .from('tracking_entries')
                        .insert(record);
                    if (error) throw error;
                }

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
