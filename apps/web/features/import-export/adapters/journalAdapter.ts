import { createClients } from '@/lib/supabase/serverClient';
import { isMissingTableError } from '@/lib/supabase/missingTable';
import { sanitizeRichText } from '@/features/view/security/contentSecurity';
import type { ImportExportAdapter } from '@/features/import-export/lib/adapterInterface';
import { toText } from '@/features/import-export/lib/coerce';
import type {
    AdapterAvailability,
    ExportOptions,
    ExportResult,
    ImportExecutionResult,
    MappedRow,
    DuplicateStrategy,
} from '@/features/import-export/types/importExport';
import { getContextMapper } from '@/features/import-export/lib/contextMapper';

function escapeHtml(value: string) {
    return value
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

export const journalAdapter: ImportExportAdapter = {
    id: 'journals',
    displayName: 'Journal',
    description: 'Journal entries and notes: import/export your writing',
    sourceType: 'journals',
    canImport: true,
    canExport: true,
    canProvideContext: false,
    importFormats: ['csv', 'json'],
    exportFormats: ['csv', 'json', 'docx', 'pdf'],

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
                "'merge' strategy not fully implemented, using 'overwrite' behavior",
            );
        }

        for (const row of rows) {
            try {
                const d = row.data;

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
                        .eq('id', toText(d['id']))
                        .single();
                    if (existing) {
                        warnings.push(
                            `Row ${row.rowIndex}: skipped existing journal entry (id=${toText(d['id'])})`,
                        );
                        continue;
                    }
                }

                const record = {
                    user_id: userId,
                    title: d['title'] ? toText(d['title']) : '',
                    content: toText(d['content']),
                    type: d['type'] ? toText(d['type']) : 'journal',
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

    async exportDocument(userId: string, options?: ExportOptions) {
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
                return {
                    html: '<p>No journal entries found.</p>',
                    title: 'Journal Export',
                    warnings,
                };
            }
            throw error;
        }

        const entries = data ?? [];
        const exportDate = new Date().toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
        });
        const title = `Journal Export — ${exportDate}`;

        const sections = entries
            .map((row) => {
                const entryTitle = row.title || 'Untitled';
                const entryDate = row.created_at
                    ? new Date(row.created_at).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                      })
                    : '';
                const content = sanitizeRichText(row.content || '<p></p>');
                return [
                    '<section>',
                    `<h2>${escapeHtml(entryTitle)}</h2>`,
                    entryDate
                        ? `<p class="entry-date"><em>${escapeHtml(entryDate)}</em></p>`
                        : '',
                    content,
                    '</section>',
                ].join('\n');
            })
            .join('\n\n');

        const html = [
            '<!doctype html>',
            '<html>',
            '<head>',
            '<meta charset="utf-8">',
            `<title>${escapeHtml(title)}</title>`,
            '<style>',
            'body{font-family:Georgia,serif;max-width:700px;margin:0 auto;padding:2em;line-height:1.6}',
            'h1{border-bottom:2px solid #333;padding-bottom:.5em;margin-bottom:1.5em}',
            'section{margin-bottom:2.5em;padding-bottom:2.5em;border-bottom:1px solid #ddd}',
            'section:last-child{border-bottom:none}',
            'h2{margin-bottom:.25em}',
            '.entry-date{margin-top:0;color:#666;font-size:.9em}',
            '</style>',
            '</head>',
            '<body>',
            `<h1>${escapeHtml(title)}</h1>`,
            entries.length === 0
                ? '<p>No journal entries found.</p>'
                : sections,
            '</body>',
            '</html>',
        ].join('\n');

        return { html, title, warnings };
    },

    mapToContext: getContextMapper('journals'),
};
