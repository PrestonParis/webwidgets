import { createClients } from '@/lib/supabase/serverClient';
import { isMissingTableError } from '@/lib/supabase/missingTable';
import type { ImportExportAdapter } from '@/features/import-export/lib/adapterInterface';
import type {
    AdapterAvailability,
    ExportOptions,
    ExportResult,
    MappedRow,
} from '@/features/import-export/types/importExport';
import { getContextMapper } from '@/features/import-export/lib/contextMapper';

// Read-only adapter — collaboration handoffs cannot be bulk-imported
export const collaborationHandoffsAdapter: ImportExportAdapter = {
    id: 'collaboration_handoffs',
    displayName: 'Collaboration Handoffs',
    description: 'Export handoff records from your collaboration workspaces',
    sourceType: 'collaboration_handoffs',
    canImport: false,
    canExport: true,
    canProvideContext: false,
    importFormats: [],
    exportFormats: ['csv', 'json'],

    async checkAvailability(): Promise<AdapterAvailability> {
        try {
            const { supabase } = await createClients();
            const { error } = await supabase
                .from('collaboration_handoffs')
                .select('id')
                .limit(1);
            if (error) {
                if (isMissingTableError(error)) {
                    return {
                        available: false,
                        message: 'collaboration_handoffs table not found',
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

        // Handoffs are scoped to workspaces the user owns
        let query = supabase
            .from('collaboration_handoffs')
            .select(
                'id,workspace_id,title,owner,priority,due,complete,scope,created_at,updated_at',
            )
            .eq('owner', userId)
            .order('created_at', { ascending: false });

        if (options?.limit) query = query.limit(options.limit);

        const { data, error } = await query;
        if (error) {
            if (isMissingTableError(error)) {
                warnings.push('collaboration_handoffs table not configured');
                return { rows: [], totalCount: 0, warnings };
            }
            throw error;
        }

        const rows: MappedRow[] = (data ?? []).map((row, i) => ({
            rowIndex: i,
            data: {
                id: row.id,
                workspace_id: row.workspace_id,
                title: row.title ?? '',
                owner: row.owner ?? '',
                priority: row.priority ?? '',
                due: row.due ?? '',
                complete: row.complete ?? false,
                scope: row.scope ?? '',
                created_at: row.created_at,
            },
        }));

        return { rows, totalCount: rows.length, warnings };
    },

    mapToContext: getContextMapper('collaboration_handoffs'),
};
