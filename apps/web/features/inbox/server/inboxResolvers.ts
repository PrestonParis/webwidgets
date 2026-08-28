import { loadCredentialInboxSnapshot } from '@/app/api/auth/_lib/providerSnapshots';
import { inboxSummarySchema } from '@/features/inbox/schemas/inboxSchemas';
import type { DataResolver } from '@/features/widgets/types/snapshot';

export const inboxResolvers: DataResolver[] = [
    {
        key: 'inbox.messages',
        permissions: ['inbox:read'],
        cachePolicy: { ttlSeconds: 120, staleWhileRevalidateSeconds: 300 },
        schema: inboxSummarySchema,
        async resolve(ctx) {
            if (!ctx.userId)
                throw new Error('Missing userId for inbox resolver');
            return loadCredentialInboxSnapshot(ctx.userId, 10);
        },
    },
];
