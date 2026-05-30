import { createClients } from '@/lib/supabase/serverClient';
import { isMissingTableError } from '@/lib/supabase/missingTable';
import type { ImportExportAdapter } from '@/features/import-export/lib/adapterInterface';
import type {
    AdapterAvailability,
    ExportOptions,
    ExportResult,
    MappedRow,
} from '@/features/import-export/types/importExport';

// 30-day window for completions returned to the runtime.
// Wide enough for streak calculations (longest realistic streak) without
// pulling unbounded history on every dashboard load.
const COMPLETION_WINDOW_DAYS = 30;

export const habitAdapter: ImportExportAdapter = {
    id: 'habits',
    displayName: 'Habits',
    description: 'Habit tracking: export your habits and completion history',
    sourceType: 'habits',
    canImport: false,
    canExport: true,
    canProvideContext: false,
    importFormats: [],
    exportFormats: ['csv', 'json'],

    async checkAvailability(): Promise<AdapterAvailability> {
        try {
            const { supabase } = await createClients();
            const { error } = await supabase
                .from('habits')
                .select('id')
                .limit(1);
            if (error) {
                if (isMissingTableError(error)) {
                    return {
                        available: false,
                        message: 'habits table not found',
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

        // Fetch habits
        let habitQuery = supabase
            .from('habits')
            .select('id, name, emoji, created_at')
            .eq('user_id', userId)
            .order('created_at', { ascending: true });

        if (options?.limit) habitQuery = habitQuery.limit(options.limit);

        const { data: habits, error: habitError } = await habitQuery;
        if (habitError) {
            if (isMissingTableError(habitError)) {
                warnings.push('habits table not configured');
                return { rows: [], totalCount: 0, warnings };
            }
            throw habitError;
        }

        // Fetch completions for the last 30 days — used by the runtime for streak/today
        // calculations, and included in the flat CSV/JSON export as a denormalized count.
        const windowStart = new Date(
            Date.now() - COMPLETION_WINDOW_DAYS * 86_400_000,
        )
            .toISOString()
            .split('T')[0];

        const { data: completions, error: completionError } = await supabase
            .from('habit_completions')
            .select('id, habit_id, completed_date')
            .eq('user_id', userId)
            .gte('completed_date', windowStart ?? '');

        if (completionError && !isMissingTableError(completionError)) {
            throw completionError;
        }
        if (completionError && isMissingTableError(completionError)) {
            warnings.push(
                'habit_completions table not configured, completion data will be empty',
            );
        }

        const completionList = (completions ?? []) as {
            id: string;
            habit_id: string;
            completed_date: string;
        }[];

        // Build completion count lookup for the flat export rows
        const completionCounts: Record<string, number> = {};
        for (const c of completionList) {
            completionCounts[c.habit_id] =
                (completionCounts[c.habit_id] ?? 0) + 1;
        }

        // Flat rows for CSV/JSON export jobs
        const rows: MappedRow[] = (habits ?? []).map((habit, i) => ({
            rowIndex: i,
            data: {
                id: habit.id,
                name: habit.name ?? '',
                emoji: habit.emoji ?? '',
                completions_last_30d: completionCounts[habit.id as string] ?? 0,
                created_at: habit.created_at ?? '',
            },
        }));

        // Rich inline payload for the dashboard runtime:
        // returns full habit + completion records so the widget can compute
        // streaks, isCompletedToday, last-7-days, and calendar views locally.
        const inlinePayload = {
            habits: (habits ?? []).map((h) => ({
                id: h.id,
                name: h.name ?? '',
                emoji: h.emoji ?? '',
                created_at: h.created_at ?? '',
            })),
            completions: completionList.map((c) => ({
                id: c.id,
                habit_id: c.habit_id,
                completed_date: c.completed_date,
            })),
        };

        return { rows, totalCount: rows.length, warnings, inlinePayload };
    },
};
