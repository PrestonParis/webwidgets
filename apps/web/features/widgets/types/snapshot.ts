import type { z } from 'zod';
import type {
    resolverContextSchema,
    screenSnapshotSchema,
    widgetManifestSchema,
    widgetSnapshotSchema,
} from '@/features/widgets/schemas/snapshotSchemas';

export type WidgetManifest = z.infer<typeof widgetManifestSchema>;
export type WidgetSnapshot<T = unknown> = Omit<
    z.infer<typeof widgetSnapshotSchema>,
    'data'
> & {
    data?: T;
};
export type ScreenSnapshot = z.infer<typeof screenSnapshotSchema>;
export type ResolverContext = z.infer<typeof resolverContextSchema>;

export type DataResolver<TOutput = unknown> = {
    key: string;
    permissions?: string[];
    cachePolicy?: {
        ttlSeconds?: number;
        staleWhileRevalidateSeconds?: number;
    };
    resolve: (ctx: ResolverContext) => Promise<TOutput>;
    schema?: z.ZodType<TOutput>;
};

export type ResolvedData = {
    key: string;
    status: 'fulfilled' | 'rejected';
    data?: unknown;
    error?: {
        code: string;
        message: string;
    };
    durationMs: number;
};
