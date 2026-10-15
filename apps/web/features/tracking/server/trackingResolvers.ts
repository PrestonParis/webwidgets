import { z } from 'zod';
import { createClients } from '@/lib/supabase/serverClient';
import type { DataResolver } from '@/features/widgets/types/snapshot';

const trackingEntrySchema = z.object({
    id: z.string(),
    category: z.string(),
    entryDate: z.string(),
    loggedAt: z.string(),
    metadata: z.record(z.string(), z.unknown()),
    tags: z.array(z.string()),
    notes: z.string().optional(),
    source: z.string(),
});

const todayTrackingSchema = z.object({
    date: z.string(),
    entries: z.array(trackingEntrySchema),
    categoryCounts: z.record(z.string(), z.number()),
});

export const trackingResolvers: DataResolver[] = [
    {
        key: 'tracking.today',
        cachePolicy: { ttlSeconds: 60 },
        schema: todayTrackingSchema,
        async resolve(ctx) {
            if (!ctx.userId)
                throw new Error('Missing userId for tracking resolver');
            const { supabase } = await createClients();
            const today = new Date().toISOString().slice(0, 10);

            const { data, error } = await supabase
                .from('tracking_entries')
                .select(
                    'id, category, entry_date, logged_at, metadata, tags, notes, source',
                )
                .eq('user_id', ctx.userId)
                .eq('entry_date', today)
                .order('logged_at', { ascending: false });

            if (error) throw error;

            const entries = (data ?? []).map((row) => ({
                id: row.id,
                category: row.category,
                entryDate: row.entry_date,
                loggedAt: row.logged_at,
                metadata: (row.metadata as Record<string, unknown>) ?? {},
                tags: row.tags ?? [],
                notes: row.notes ?? undefined,
                source: row.source,
            }));

            const categoryCounts: Record<string, number> = {};
            for (const e of entries) {
                categoryCounts[e.category] =
                    (categoryCounts[e.category] ?? 0) + 1;
            }

            return todayTrackingSchema.parse({
                date: today,
                entries,
                categoryCounts,
            });
        },
    },
];
