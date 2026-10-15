import { loadCredentialCalendarSnapshot } from '@/app/api/auth/_lib/providerSnapshots';
import { calendarSnapshotSchema } from '@/features/calendar/lib/calendarSchemas';
import type { DataResolver } from '@/features/widgets/types/snapshot';

export const calendarResolvers: DataResolver[] = [
    {
        key: 'calendar.events',
        permissions: ['calendar:read'],
        cachePolicy: { ttlSeconds: 300, staleWhileRevalidateSeconds: 600 },
        schema: calendarSnapshotSchema,
        async resolve(ctx) {
            if (!ctx.userId)
                throw new Error('Missing userId for calendar resolver');
            return loadCredentialCalendarSnapshot(ctx.userId, 7);
        },
    },
];
