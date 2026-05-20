'use client';

import { Check, Zap } from 'lucide-react';
import { cn } from '@/lib/utils/utils';
import type { BillingPlan, PlanId } from '@/features/billing/types/billing';

interface PricingCardProps {
    plan: BillingPlan;
    currentPlanId: PlanId;
    loading: boolean;
    onSelect: (planId: PlanId) => void;
}

function FeatureItem({ text }: { text: string }) {
    return (
        <li className="flex items-start gap-2 text-sm">
            <Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" />
            <span className="text-zinc-600 dark:text-zinc-300">{text}</span>
        </li>
    );
}

export function PricingCard({
    plan,
    currentPlanId,
    loading,
    onSelect,
}: PricingCardProps) {
    const isCurrent = plan.id === currentPlanId;
    const isPaid = plan.priceMonthly > 0;

    return (
        <div
            className={cn(
                'relative flex flex-col rounded-2xl border p-6 transition',
                plan.highlighted
                    ? 'border-[#4f6ef7] shadow-lg shadow-indigo-100 dark:shadow-indigo-950'
                    : 'border-zinc-200 dark:border-zinc-800',
            )}
        >
            {(plan.highlighted || plan.badge) && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <span className="inline-flex items-center gap-1 rounded-full bg-[#4f6ef7] px-3 py-0.5 text-xs font-semibold text-white">
                        <Zap className="h-3 w-3" />{' '}
                        {plan.badge ?? 'Most popular'}
                    </span>
                </div>
            )}

            <div className="mb-5">
                <h3 className="text-base font-semibold">{plan.name}</h3>
                <div className="mt-2 flex items-baseline gap-1">
                    <span className="text-3xl font-bold">
                        ${plan.priceMonthly}
                    </span>
                    <span className="text-sm text-zinc-400">/month</span>
                </div>
                <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">
                    {plan.description}
                </p>
            </div>

            <ul className="mb-6 flex-1 space-y-2">
                {plan.features.map((f) => (
                    <FeatureItem key={f} text={f} />
                ))}
            </ul>

            {isCurrent ? (
                <div className="rounded-lg border border-zinc-200 px-4 py-2.5 text-center text-sm font-semibold text-zinc-400 dark:border-zinc-700">
                    Current plan
                </div>
            ) : (
                <button
                    type="button"
                    onClick={() => onSelect(plan.id)}
                    disabled={loading || !isPaid}
                    className={cn(
                        'rounded-lg px-4 py-2.5 text-sm font-semibold transition',
                        plan.highlighted
                            ? 'bg-[#4f6ef7] text-white hover:bg-[#3f5de2]'
                            : 'bg-zinc-950 text-white hover:bg-zinc-800 dark:bg-white dark:text-zinc-950 dark:hover:bg-zinc-200',
                        (loading || !isPaid) && 'cursor-not-allowed opacity-50',
                    )}
                >
                    {loading
                        ? 'Loading…'
                        : (plan.cta ??
                          (isPaid
                              ? `Upgrade to ${plan.name}`
                              : 'Get started free'))}
                </button>
            )}
        </div>
    );
}
