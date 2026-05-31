import { createClients } from '@/lib/supabase/serverClient';
import { isMissingTableError } from '@/lib/supabase/missingTable';
import type { ImportExportAdapter } from '@/features/import-export/lib/adapterInterface';
import type {
    AdapterAvailability,
    ExportOptions,
    ExportResult,
    MappedRow,
} from '@/features/import-export/types/importExport';
import { buildContextBundleForChat } from '@/features/context/services/contextBundleService';

// Read-only context adapter — exports context entries and provides AI context
export const contextEntriesAdapter: ImportExportAdapter = {
    id: 'context_entries',
    displayName: 'Context Entries',
    description:
        'Personal context graph: goals, profile, widgets, integrations',
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
                'id,entity_id,entry_type,label,summary,tags,source_type,source_id,source_table,confidence,status,visibility,permissions,metadata,data,linked_to,created_at,updated_at',
            )
            .eq('user_id', userId)
            .neq('status', 'deleted')
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
                record_type: 'context_node',
                entity_id: row.entity_id,
                entry_type: row.entry_type,
                label: row.label,
                summary: row.summary,
                tags: row.tags,
                source_type: row.source_type,
                source_id: row.source_id,
                source_table: row.source_table,
                confidence: row.confidence,
                status: row.status,
                visibility: row.visibility,
                permissions: row.permissions,
                metadata: row.metadata,
                data: row.data,
                linked_to: Array.isArray(row.linked_to)
                    ? row.linked_to.join(',')
                    : '',
                created_at: row.created_at,
            },
        }));

        const { data: edgeData, error: edgeError } = await (supabase as any)
            .from('context_edges')
            .select(
                'id,from_entity_id,to_entity_id,kind,label,weight,confidence,source_type,source_id,metadata,created_at,updated_at',
            )
            .eq('user_id', userId);
        if (edgeError) warnings.push('context_edges table unavailable');

        const edgeRows: MappedRow[] = (
            (edgeData ?? []) as Array<Record<string, unknown>>
        ).map((row, index) => ({
            rowIndex: rows.length + index,
            data: {
                record_type: 'context_edge',
                id: row.id,
                from_entity_id: row.from_entity_id,
                to_entity_id: row.to_entity_id,
                kind: row.kind,
                label: row.label,
                weight: row.weight,
                confidence: row.confidence,
                source_type: row.source_type,
                source_id: row.source_id,
                metadata: row.metadata,
                created_at: row.created_at,
                updated_at: row.updated_at,
            },
        }));

        return {
            rows: [...rows, ...edgeRows],
            totalCount: rows.length + edgeRows.length,
            warnings,
        };
    },

    async provideContext(userId: string): Promise<string> {
        const { supabase } = await createClients();
        const bundle = await buildContextBundleForChat(supabase, userId, {
            maxNodes: 40,
            maxPromptChars: 7000,
        });
        return bundle.nodes.length > 0 ? bundle.promptSection : '';
    },
};
