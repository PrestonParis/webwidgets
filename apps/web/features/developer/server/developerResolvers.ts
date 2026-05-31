import { getDeveloperSnapshot } from '@/features/developer/server/developerService';
import { developerSnapshotSchema } from '@/features/developer/schemas/developerSchemas';
import type { DataResolver } from '@/features/widgets/types/snapshot';

export const developerResolvers: DataResolver[] = [
    {
        key: 'developer.activity',
        cachePolicy: { ttlSeconds: 180, staleWhileRevalidateSeconds: 600 },
        schema: developerSnapshotSchema,
        async resolve(ctx) {
            return getDeveloperSnapshot(ctx.userId);
        },
    },
    {
        key: 'datahealth.system',
        cachePolicy: { ttlSeconds: 180, staleWhileRevalidateSeconds: 600 },
        schema: developerSnapshotSchema,
        async resolve(ctx) {
            return getDeveloperSnapshot(ctx.userId);
        },
    },
];
