import { createClients } from '@/lib/supabase/serverClient';
import { isMissingTableError } from '@/lib/supabase/missingTable';
import { listActivityEvents } from '@/features/activity/services/activityService';
import type { ImportExportAdapter } from '@/features/import-export/lib/adapterInterface';
import type {
    AdapterAvailability,
    ExportOptions,
    ExportResult,
    MappedRow,
} from '@/features/import-export/types/importExport';
import type { ActivityEvent } from '@/features/activity/types/activity';

export const activityAdapter: ImportExportAdapter = {
    id: 'activity_events',
    displayName: 'Activity Feed',
    description:
        'Export your platform event history and provide AI context about recent platform actions',
    sourceType: 'activity_events',
    canImport: false,
    canExport: true,
    canProvideContext: true,
    importFormats: [],
    exportFormats: ['csv', 'json'],

    async checkAvailability(): Promise<AdapterAvailability> {
        try {
            const { supabase } = await createClients();
            const { error } = await supabase
                .from('activity_events')
                .select('id')
                .limit(1);
            if (error) {
                if (isMissingTableError(error))
                    return {
                        available: false,
                        message: 'activity_events table not found',
                    };
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

        const events = await listActivityEvents(supabase, userId, {
            limit: options?.limit ?? 500,
            ...(options?.since ? { since: options.since } : {}),
        }).catch((err) => {
            if (isMissingTableError(err)) {
                warnings.push('activity_events table not configured');
                return [] as ActivityEvent[];
            }
            throw err;
        });

        const rows: MappedRow[] = events.map((evt, i) => ({
            rowIndex: i,
            data: {
                id: evt.id,
                source: evt.source,
                event_type: evt.eventType ?? '',
                category: evt.category,
                priority: evt.priority,
                severity: evt.severity,
                title: evt.title,
                body: evt.body ?? '',
                is_archived: evt.isArchived,
                is_read: !!evt.readAt,
                occurred_at: evt.occurredAt,
                created_at: evt.createdAt,
                source_id: evt.sourceId ?? '',
                source_table: evt.sourceTable ?? '',
                action_url: evt.actionUrl ?? '',
            },
        }));

        return { rows, totalCount: rows.length, warnings };
    },

    async provideContext(userId: string): Promise<string> {
        const { supabase } = await createClients();

        const events = await listActivityEvents(supabase, userId, {
            limit: 50,
            archived: false,
        }).catch(() => [] as ActivityEvent[]);

        if (events.length === 0) return '';

        // Group by source for structured summary
        const bySource = new Map<string, ActivityEvent[]>();
        for (const evt of events) {
            const group = bySource.get(evt.source) ?? [];
            group.push(evt);
            bySource.set(evt.source, group);
        }

        const unread = events.filter((e) => !e.readAt);
        const aiEvents = events.filter((e) => e.category === 'ai');
        const recentHours = events.filter(
            (e) =>
                Date.now() - new Date(e.occurredAt).getTime() < 3 * 3_600_000,
        );

        const lines: string[] = [
            '## Activity Context',
            '',
            `Total recent events: ${events.length} | Unread: ${unread.length} | AI-generated: ${aiEvents.length}`,
            `Active in last 3 hours: ${recentHours.length} event(s)`,
            '',
        ];

        // Source breakdown
        if (bySource.size > 0) {
            lines.push('### By Source');
            for (const [source, sourceEvents] of bySource.entries()) {
                lines.push(
                    `- **${source}** (${sourceEvents.length}): ${sourceEvents[0]?.title ?? ''}`,
                );
            }
            lines.push('');
        }

        // Most recent 20 events with timestamps
        lines.push('### Recent Events (newest first)');
        const recent = events.slice(0, 20);
        for (const evt of recent) {
            const ts = new Date(evt.occurredAt).toLocaleString();
            const read = evt.readAt ? '' : ' [unread]';
            const type = evt.eventType ? ` (${evt.eventType})` : '';
            lines.push(`- [${ts}] ${evt.source}${type}: ${evt.title}${read}`);
        }

        // AI output summary
        if (aiEvents.length > 0) {
            lines.push('');
            lines.push('### Recent AI Outputs');
            for (const evt of aiEvents.slice(0, 5)) {
                lines.push(`- ${evt.title}`);
                if (evt.body) lines.push(`  ${evt.body.slice(0, 120)}`);
            }
        }

        return lines.join('\n');
    },
};
