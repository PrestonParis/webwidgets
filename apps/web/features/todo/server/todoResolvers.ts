import { z } from 'zod';
import { createClients } from '@/lib/supabase/serverClient';
import type { DataResolver } from '@/features/widgets/types/snapshot';

const todoSchema = z.object({
    id: z.string(),
    text: z.string(),
    completed: z.boolean(),
    createdAt: z.string(),
    completedAt: z.string().optional(),
    dueAt: z.string().optional(),
});

const tasksSnapshotSchema = z.object({
    open: z.array(todoSchema),
    completedToday: z.number(),
    totalOpen: z.number(),
});

export const todoResolvers: DataResolver[] = [
    {
        key: 'tasks.open',
        cachePolicy: { ttlSeconds: 30 },
        schema: tasksSnapshotSchema,
        async resolve(ctx) {
            if (!ctx.userId)
                throw new Error('Missing userId for tasks resolver');
            const { supabase } = await createClients();
            const today = new Date().toISOString().slice(0, 10);

            const { data, error } = await supabase
                .from('todos')
                .select('id, text, completed, created_at, completed_at, due_at')
                .eq('user_id', ctx.userId)
                .order('created_at', { ascending: false })
                .limit(50);

            if (error) throw error;

            const all = (data ?? []).map((row) => ({
                id: row.id as string,
                text: row.text as string,
                completed: row.completed as boolean,
                createdAt: row.created_at as string,
                completedAt: (row.completed_at as string | null) ?? undefined,
                dueAt: (row.due_at as string | null) ?? undefined,
            }));

            const open = all.filter((t) => !t.completed).slice(0, 20);
            const completedToday = all.filter(
                (t) => t.completed && t.completedAt?.startsWith(today),
            ).length;

            return tasksSnapshotSchema.parse({
                open,
                completedToday,
                totalOpen: open.length,
            });
        },
    },
];
