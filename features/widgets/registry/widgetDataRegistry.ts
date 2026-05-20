import type { DataResolver } from '@/features/widgets/types/snapshot';
import { currencyResolvers } from '@/features/currency/server/currencyResolvers';
import { dataHealthResolvers } from '@/features/datahealth/server/dataHealthResolvers';
import { financeResolvers } from '@/features/finance/server/financeResolvers';
import { workflowResolvers } from '@/features/workflows/server/workflowResolvers';
import { inboxResolvers } from '@/features/inbox/server/inboxResolvers';
import { calendarResolvers } from '@/features/calendar/server/calendarResolvers';
import { developerResolvers } from '@/features/developer/server/developerResolvers';
import { filesResolvers } from '@/features/uploads/server/filesResolvers';
import { trackingResolvers } from '@/features/tracking/server/trackingResolvers';
import { recoveryResolvers } from '@/features/recovery/server/recoveryResolvers';
import { todoResolvers } from '@/features/todo/server/todoResolvers';
import { weatherResolvers } from '@/features/weather/server/weatherResolvers';

const resolvers = [
    ...financeResolvers,
    ...currencyResolvers,
    ...dataHealthResolvers,
    ...workflowResolvers,
    ...inboxResolvers,
    ...calendarResolvers,
    ...developerResolvers,
    ...filesResolvers,
    ...trackingResolvers,
    ...recoveryResolvers,
    ...todoResolvers,
    ...weatherResolvers,
] satisfies DataResolver[];

export const widgetDataRegistry = new Map(
    resolvers.map((resolver) => [resolver.key, resolver] as const),
);

export function getDataResolver(key: string): DataResolver | undefined {
    return widgetDataRegistry.get(key);
}

export function listDataResolvers(): DataResolver[] {
    return [...widgetDataRegistry.values()];
}
