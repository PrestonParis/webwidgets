import { z } from 'zod';
import { createClients } from '@/lib/supabase/serverClient';
import type { DataResolver } from '@/features/widgets/types/snapshot';

const fileItemSchema = z.object({
    id: z.string(),
    originalName: z.string(),
    sizeBytes: z.number(),
    mimeType: z.string().optional(),
    createdAt: z.string(),
    url: z.string().optional(),
});

const filesSnapshotSchema = z.object({
    recent: z.array(fileItemSchema),
    totalCount: z.number(),
    driveConnected: z.boolean(),
});

export const filesResolvers: DataResolver[] = [
    {
        key: 'files.recent',
        cachePolicy: { ttlSeconds: 120 },
        schema: filesSnapshotSchema,
        async resolve(ctx) {
            if (!ctx.userId)
                throw new Error('Missing userId for files resolver');
            const { supabase, supabaseAdmin } = await createClients();

            const { data, error } = await supabase
                .from('user_files')
                .select(
                    'id, original_name, size_bytes, mime_type, created_at, url',
                )
                .eq('user_id', ctx.userId)
                .order('created_at', { ascending: false })
                .limit(10);

            if (error) throw error;

            const { data: driveRow } = await supabaseAdmin
                .from('user_tokens')
                .select('has_drive')
                .eq('user_id', ctx.userId)
                .maybeSingle();

            const files = (data ?? []).map((row) => ({
                id: row.id as string,
                originalName: row.original_name as string,
                sizeBytes: row.size_bytes as number,
                mimeType: (row.mime_type as string | null) ?? undefined,
                createdAt: row.created_at as string,
                url: (row.url as string | null) ?? undefined,
            }));

            return filesSnapshotSchema.parse({
                recent: files,
                totalCount: files.length,
                driveConnected: Boolean(driveRow?.has_drive),
            });
        },
    },
];
