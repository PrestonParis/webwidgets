import { createClients } from '@/lib/supabase/serverClient';
import { isMissingTableError } from '@/lib/supabase/missingTable';
import type { ImportExportAdapter } from '@/features/import-export/lib/adapterInterface';
import type {
    AdapterAvailability,
    ExportOptions,
    ExportResult,
    MappedRow,
} from '@/features/import-export/types/importExport';

// Read-only context adapter — exports context entries and provides AI context
export const contextEntriesAdapter: ImportExportAdapter = {
    id: 'context_entries',
    displayName: 'Context Entries',
    description:
        'Personal context graph — goals, profile, widgets, integrations',
    sourceType: 'context_entries',
    canImport: false,
    canExport: true,
    canProvideContext: true,
    importFormats: [],
    exportFormats: ['csv', 'json'],

    async checkAvailability(): Promise<AdapterAvailability> {
        try {
            const { supabase } = await createClients();
            const { error } = await supabase
                .from('context_entries')
                .select('id')
                .limit(1);
            if (error) {
                if (isMissingTableError(error)) {
                    return {
                        available: false,
                        message: 'context_entries table not found',
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
            .from('context_entries')
            .select(
                'id,entity_id,entry_type,label,data,linked_to,created_at,updated_at',
            )
            .eq('user_id', userId)
            .order('created_at', { ascending: true });

        if (options?.limit) query = query.limit(options.limit);

        const { data, error } = await query;
        if (error) {
            if (isMissingTableError(error)) {
                warnings.push('context_entries table not configured');
                return { rows: [], totalCount: 0, warnings };
            }
            throw error;
        }

        const rows: MappedRow[] = (data ?? []).map((row, i) => ({
            rowIndex: i,
            data: {
                id: row.id,
                type: 'context_entry',
                entity_id: row.entity_id,
                entry_type: row.entry_type,
                label: row.label,
                data: row.data,
                linked_to: Array.isArray(row.linked_to)
                    ? row.linked_to.join(',')
                    : '',
                created_at: row.created_at,
            },
        }));

        return { rows, totalCount: rows.length, warnings };
    },

    async provideContext(userId: string): Promise<string> {
        const { supabase } = await createClients();

        const { data, error } = await supabase
            .from('context_entries')
            .select('entry_type,label,data')
            .eq('user_id', userId)
            .order('created_at', { ascending: true })
            .limit(100);

        if (error || !data || data.length === 0) return '';

        const lines: string[] = ['## Personal Context'];

        const byType = new Map<string, typeof data>();
        data.forEach((entry) => {
            const t = entry.entry_type as string;
            if (!byType.has(t)) byType.set(t, []);
            byType.get(t)!.push(entry);
        });

        byType.forEach((entries, type) => {
            lines.push(`### ${type}`);
            entries.forEach((e) => lines.push(`- ${e.label}`));
        });

        return lines.join('\n');
    },
};
