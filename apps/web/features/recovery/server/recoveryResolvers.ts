import { z } from 'zod';
import { createClients } from '@/lib/supabase/serverClient';
import type { DataResolver } from '@/features/widgets/types/snapshot';

const trackerSchema = z.object({
    id: z.string(),
    name: z.string(),
    startTime: z.string(),
    category: z.string().optional(),
    isActive: z.boolean(),
});

const recoverySnapshotSchema = z.object({
    trackers: z.array(trackerSchema),
    activeCount: z.number(),
});

export const recoveryResolvers: DataResolver[] = [
    {
        key: 'recovery.trackers',
        cachePolicy: { ttlSeconds: 60 },
        schema: recoverySnapshotSchema,
        async resolve(ctx) {
            if (!ctx.userId)
                throw new Error('Missing userId for recovery resolver');
            const { supabase } = await createClients();

            const { data: profiles, error } = await supabase
                .from('recovery_profiles')
                .select('id, name, start_time, category')
                .eq('user_id', ctx.userId)
                .order('created_at', { ascending: true });

            if (error) throw error;

            const trackers = (profiles ?? []).map((p) => ({
                id: p.id as string,
                name: p.name as string,
                startTime: p.start_time as string,
                category: (p.category as string | null) ?? undefined,
                isActive: true,
            }));

            return recoverySnapshotSchema.parse({
                trackers,
                activeCount: trackers.length,
            });
        },
    },
];
