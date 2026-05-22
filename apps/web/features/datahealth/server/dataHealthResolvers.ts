import { serviceHealthSchema } from '@/lib/connectors/serviceHealth';
import { getSystemDataHealth } from '@/features/datahealth/server/dataHealthService';
import type { DataResolver } from '@/features/widgets/types/snapshot';

export const dataHealthResolvers: DataResolver[] = [
    {
        key: 'datahealth.system',
        cachePolicy: { ttlSeconds: 60 },
        schema: serviceHealthSchema,
        resolve: getSystemDataHealth,
    },
];
