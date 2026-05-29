'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
    HelpCircle,
    Settings,
    User,
    LogOut,
    ChevronDown,
    MessageSquare,
    Sun,
    Moon,
    Accessibility,
    Shield,
    CreditCard,
    Zap,
    ExternalLink,
} from 'lucide-react';
import { AccountDropdownProps } from '@/features/ui/types/ui';
import { useTheme } from '@/features/ui/hooks/useTheme';
import { useBilling } from '@/features/billing/hooks/useBilling';
import {
    createCheckoutSession,
    createPortalSession,
} from '@/features/billing/api/billingApi';

const PLAN_BADGE: Record<string, string> = {
    free: 'bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400',
    pro: 'bg-violet-100 text-violet-600 dark:bg-violet-900/30 dark:text-violet-400',
    business:
        'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400',
};

export default function AccountDropdown({
    firstName,
    isAdmin,
    open,
    loading,
    onToggle,
    onSignOut,
}: AccountDropdownProps) {
    const { isDark, toggle } = useTheme();
    const { subscription, currentPlan, loading: billingLoading } = useBilling();
    const [portalLoading, setPortalLoading] = useState(false);
    const [upgradeLoading, setUpgradeLoading] = useState(false);
    const [billingError, setBillingError] = useState<string | null>(null);

    const isPaid = currentPlan.id !== 'free';

    async function handleManage() {
        setPortalLoading(true);
        setBillingError(null);
        try {
            const url = await createPortalSession();
            window.location.assign(url);
        } catch (err) {
            setBillingError(
                err instanceof Error
                    ? err.message
                    : 'Failed to open billing portal',
            );
            setPortalLoading(false);
        }
    }

    async function handleUpgrade() {
        setUpgradeLoading(true);
        setBillingError(null);
        try {
            const url = await createCheckoutSession('pro');
            window.location.assign(url);
        } catch (err) {
            setBillingError(
                err instanceof Error ? err.message : 'Failed to start checkout',
            );
            setUpgradeLoading(false);
        }
    }

    return (
        <>
            <button
                onClick={onToggle}
                className="flex items-center gap-2 px-3 py-1.5 rounded-xl border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 hover:border-gray-300 dark:hover:border-zinc-600 shadow-sm transition-all text-gray-600 dark:text-zinc-400 hover:text-gray-900 dark:hover:text-zinc-100"
            >
                <div className="w-5 h-5 rounded-full bg-[#4f6ef7]/10 flex items-center justify-center">
                    <span className="text-[10px] font-bold text-[#4f6ef7]">
                        {firstName?.[0]?.toUpperCase() ?? '?'}
                    </span>
                </div>
                <span className="text-xs font-medium hidden sm:block">
                    {firstName ?? 'Account'}
                </span>
                <ChevronDown
                    className={`w-3 h-3 transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
                />
            </button>

            {open && (
                <div className="absolute right-0 mt-2 w-64 bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-700 rounded-2xl shadow-xl p-2 z-50">
                    {/* Header */}
                    <div className="px-3 py-2 border-b border-gray-100 dark:border-zinc-800 mb-1">
                        <div className="flex items-center justify-between">
                            <p className="text-xs font-semibold">
                                {firstName ?? 'User'}
                            </p>
                            {!billingLoading && (
                                <span
                                    className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-md ${PLAN_BADGE[currentPlan.id] ?? PLAN_BADGE.free}`}
                                >
                                    {currentPlan.name}
                                </span>
                            )}
                        </div>
                        <p className="text-[11px] text-gray-400">Account</p>
                    </div>

                    {/* Navigation */}
                    <Link
                        href="/settings"
                        onClick={onToggle}
                        className="flex items-center gap-2 px-3 py-2 text-sm hover:bg-gray-50 dark:hover:bg-zinc-800 rounded-xl"
                    >
                        <Settings className="w-3.5 h-3.5 text-gray-400" />
                        Settings
                    </Link>
                    <Link
                        href="/settings/profile"
                        onClick={onToggle}
                        className="flex items-center gap-2 px-3 py-2 text-sm hover:bg-gray-50 dark:hover:bg-zinc-800 rounded-xl"
                    >
                        <User className="w-3.5 h-3.5 text-gray-400" />
                        Profile
                    </Link>
                    <Link
                        href="/accessibility"
                        onClick={onToggle}
                        className="flex items-center gap-2 px-3 py-2 text-sm hover:bg-gray-50 dark:hover:bg-zinc-800 rounded-xl"
                    >
                        <Accessibility className="w-3.5 h-3.5 text-gray-400" />
                        Accessibility
                    </Link>
                    {isAdmin && (
                        <Link
                            href="/admin"
                            onClick={onToggle}
                            className="flex items-center gap-2 px-3 py-2 text-sm hover:bg-gray-50 dark:hover:bg-zinc-800 rounded-xl"
                        >
                            <Shield className="w-3.5 h-3.5 text-gray-400" />
                            Admin
                        </Link>
                    )}
                    <Link
                        href="/help"
                        onClick={onToggle}
                        className="flex items-center gap-2 px-3 py-2 text-sm hover:bg-gray-50 dark:hover:bg-zinc-800 rounded-xl"
                    >
                        <HelpCircle className="w-3.5 h-3.5 text-gray-400" />
                        Help
                    </Link>
                    <Link
                        href="/feedback"
                        onClick={onToggle}
                        className="flex items-center gap-2 px-3 py-2 text-sm hover:bg-gray-50 dark:hover:bg-zinc-800 rounded-xl"
                    >
                        <MessageSquare className="w-3.5 h-3.5 text-gray-400" />
                        Feedback
                    </Link>

                    {/* Billing section */}
                    <div className="my-1.5 border-t border-gray-100 dark:border-zinc-800" />
                    <div className="px-3 py-2 rounded-xl">
                        <div className="flex items-center gap-2 mb-2">
                            <CreditCard className="w-3.5 h-3.5 text-gray-400" />
                            <span className="text-sm font-medium">Billing</span>
                        </div>

                        {!billingLoading && (
                            <div className="space-y-1.5">
                                {isPaid ? (
                                    <>
                                        <div className="flex items-center justify-between text-xs text-gray-500 dark:text-zinc-400">
                                            <span>{currentPlan.name} Plan</span>
                                            {subscription?.currentPeriodEnd && (
                                                <span>
                                                    Renews{' '}
                                                    {new Date(
                                                        subscription.currentPeriodEnd,
                                                    ).toLocaleDateString(
                                                        'en-US',
                                                        {
                                                            month: 'short',
                                                            day: 'numeric',
                                                        },
                                                    )}
                                                </span>
                                            )}
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => void handleManage()}
                                            disabled={portalLoading}
                                            className="w-full flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border border-gray-200 dark:border-zinc-700 hover:bg-gray-50 dark:hover:bg-zinc-800 disabled:opacity-50 transition-colors"
                                        >
                                            <ExternalLink className="w-3 h-3" />
                                            {portalLoading
                                                ? 'Opening…'
                                                : 'Manage subscription'}
                                        </button>
                                    </>
                                ) : (
                                    <>
                                        <p className="text-xs text-gray-500 dark:text-zinc-400">
                                            You&apos;re on the Free plan.
                                        </p>
                                        <button
                                            type="button"
                                            onClick={() => void handleUpgrade()}
                                            disabled={upgradeLoading}
                                            className="w-full flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-violet-600 text-white hover:bg-violet-700 disabled:opacity-50 transition-colors"
                                        >
                                            <Zap className="w-3 h-3" />
                                            {upgradeLoading
                                                ? 'Loading…'
                                                : 'Upgrade to Pro — $9/mo'}
                                        </button>
                                        <Link
                                            href="/settings"
                                            onClick={onToggle}
                                            className="block text-center text-[11px] text-gray-400 hover:text-gray-600 dark:hover:text-zinc-300 transition-colors"
                                        >
                                            See all plans
                                        </Link>
                                    </>
                                )}
                                {billingError && (
                                    <p className="text-[11px] text-red-500 dark:text-red-400">
                                        {billingError}
                                    </p>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Theme + sign out */}
                    <div className="my-1.5 border-t border-gray-100 dark:border-zinc-800" />
                    <button
                        onClick={toggle}
                        className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-gray-50 dark:hover:bg-zinc-800 rounded-xl text-left"
                    >
                        {isDark ? (
                            <Sun className="w-3.5 h-3.5 text-gray-400" />
                        ) : (
                            <Moon className="w-3.5 h-3.5 text-gray-400" />
                        )}
                        {isDark ? 'Light mode' : 'Dark mode'}
                    </button>
                    <div className="my-1.5 border-t border-gray-100 dark:border-zinc-800" />
                    <button
                        onClick={onSignOut}
                        disabled={loading}
                        className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl disabled:opacity-50"
                    >
                        <LogOut className="w-3.5 h-3.5" />
                        {loading ? 'Signing out...' : 'Sign out'}
                    </button>
                </div>
            )}
        </>
    );
}
