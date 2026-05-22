import { z } from 'zod';
import { createClients } from '@/lib/supabase/serverClient';
import { getFinanceSummary } from '@/features/finance/server/financeService';
import type { DataResolver } from '@/features/widgets/types/snapshot';

export const financeSummarySchema = z.object({
    overview: z
        .object({
            netWorth: z.number(),
            totalAssets: z.number(),
            totalLiabilities: z.number(),
            cashTotal: z.number(),
            debtTotal: z.number(),
            monthlySubscriptionCost: z.number(),
            monthlyIncome: z.number(),
            monthlyExpenses: z.number(),
            netMonthlyCashflow: z.number(),
        })
        .passthrough(),
    action: z
        .object({
            label: z.string(),
            reason: z.string(),
            confidence: z.number(),
        })
        .passthrough()
        .nullable(),
    monthlyTotal: z.number(),
    topAccounts: z.array(
        z
            .object({
                id: z.string(),
                name: z.string(),
                type: z.string(),
                balance: z.number(),
                currency: z.string(),
            })
            .passthrough(),
    ),
    accountCount: z.number(),
});

export type FinanceSummary = z.infer<typeof financeSummarySchema>;

export const financeResolvers: DataResolver[] = [
    {
        key: 'finance.summary',
        permissions: ['finance:read'],
        cachePolicy: { ttlSeconds: 60 },
        schema: financeSummarySchema,
        async resolve(ctx) {
            if (!ctx.userId)
                throw new Error('Missing user for finance resolver');
            const { supabase } = await createClients();
            return getFinanceSummary(supabase, ctx.userId);
        },
    },
];
