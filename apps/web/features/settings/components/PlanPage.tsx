'use client';

import { useState } from 'react';
import { ExternalLink } from 'lucide-react';
import { useBilling } from '@/features/billing/hooks/useBilling';
import { PricingCard } from '@/features/billing/components/PricingCard';
import { BILLING_PLANS } from '@/features/billing/constants';
import {
    createCheckoutSession,
    createPortalSession,
} from '@/features/billing/api/billingApi';
import type { PlanId } from '@/features/billing/types/billing';

export default function PlanPage() {
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
        <div className="space-y-8">
            <div>
                <h1 className="text-xl font-bold">Plan & Billing</h1>
                <p className="text-sm text-gray-500">
                    Manage your subscription and payment details.
                </p>
            </div>

            {subscription && currentPlan.id !== 'free' && (
                <div className="flex items-center justify-between rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 px-5 py-4">
                    <div>
                        <p className="text-sm font-semibold">
                            {currentPlan.name} Plan
                        </p>
                        {subscription.currentPeriodEnd && (
                            <p className="text-xs text-zinc-400 mt-0.5">
                                Renews{' '}
                                {new Date(
                                    subscription.currentPeriodEnd,
                                ).toLocaleDateString('en-US', {
                                    month: 'long',
                                    day: 'numeric',
                                    year: 'numeric',
                                })}
                            </p>
                        )}
                    </div>
                    <button
                        type="button"
                        onClick={() => {
                            void handleManage();
                        }}
                        disabled={actionLoading}
                        className="inline-flex items-center gap-1.5 rounded-xl border border-zinc-200 dark:border-zinc-700 px-3 py-2 text-sm font-medium transition hover:bg-zinc-100 dark:hover:bg-zinc-800 disabled:opacity-50"
                    >
                        <ExternalLink className="h-3.5 w-3.5" /> Manage
                    </button>
                </div>
            )}

            {error && (
                <p className="rounded-xl border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-950/20 px-4 py-3 text-sm text-red-600 dark:text-red-400">
                    {error}
                </p>
            )}

            <div className="grid gap-5 sm:grid-cols-3">
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
