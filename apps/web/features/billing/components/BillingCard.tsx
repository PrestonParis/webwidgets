'use client';

import { useState } from 'react';
import { CreditCard, ExternalLink } from 'lucide-react';
import { useBilling } from '@/features/billing/hooks/useBilling';
import { PricingCard } from '@/features/billing/components/PricingCard';
import { BILLING_PLANS } from '@/features/billing/constants/plans';
import {
    createCheckoutSession,
    createPortalSession,
} from '@/features/billing/api/billingApi';
import type { PlanId } from '@/features/billing/types/billing';

function CurrentPlanBanner({
    planName,
    periodEnd,
    onManage,
    loading,
}: {
    planName: string;
    periodEnd: string | null;
    onManage: () => void;
    loading: boolean;
}) {
    return (
        <div className="flex items-center justify-between rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-3 dark:border-zinc-800 dark:bg-zinc-900">
            <div>
                <p className="text-sm font-semibold">{planName}</p>
                {periodEnd && (
                    <p className="text-xs text-zinc-400">
                        Renews{' '}
                        {new Date(periodEnd).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric',
                        })}
                    </p>
                )}
            </div>
            <button
                type="button"
                onClick={onManage}
                disabled={loading}
                className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-200 px-3 py-1.5 text-xs font-semibold transition hover:bg-zinc-100 disabled:opacity-50 dark:border-zinc-700 dark:hover:bg-zinc-800"
            >
                <ExternalLink className="h-3.5 w-3.5" />
                Manage
            </button>
        </div>
    );
}

export function BillingCard() {
    const { subscription, currentPlan, loading } = useBilling();
    const [actionLoading, setActionLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    async function handleUpgrade(planId: PlanId) {
        if (planId === 'free') return;
        setActionLoading(true);
        setError(null);
        try {
            const url = await createCheckoutSession(planId);
            window.location.assign(url);
        } catch (err) {
            setError(
                err instanceof Error ? err.message : 'Something went wrong',
            );
            setActionLoading(false);
        }
    }

    async function handleManage() {
        setActionLoading(true);
        setError(null);
        try {
            const url = await createPortalSession();
            window.location.assign(url);
        } catch (err) {
            setError(
                err instanceof Error ? err.message : 'Something went wrong',
            );
            setActionLoading(false);
        }
    }

    return (
        <div className="rounded-2xl border border-zinc-200 p-6 dark:border-zinc-800">
            <div className="mb-5 flex items-center gap-2">
                <CreditCard className="h-4 w-4 text-zinc-500" />
                <h2 className="text-sm font-semibold">Billing & Plan</h2>
            </div>

            {subscription && currentPlan.id !== 'free' && (
                <div className="mb-5">
                    <CurrentPlanBanner
                        planName={currentPlan.name}
                        periodEnd={subscription.currentPeriodEnd}
                        onManage={() => {
                            void handleManage();
                        }}
                        loading={actionLoading}
                    />
                </div>
            )}

            {error && (
                <p className="mb-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-600 dark:border-red-800 dark:bg-red-900/20 dark:text-red-400">
                    {error}
                </p>
            )}

            <div className="grid gap-4 sm:grid-cols-3">
                {BILLING_PLANS.map((plan) => (
                    <PricingCard
                        key={plan.id}
                        plan={plan}
                        currentPlanId={currentPlan.id}
                        loading={loading || actionLoading}
                        onSelect={(id) => {
                            void handleUpgrade(id);
                        }}
                    />
                ))}
            </div>
        </div>
    );
}
