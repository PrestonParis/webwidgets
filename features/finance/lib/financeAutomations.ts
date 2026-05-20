import type {
    FinanceAccount,
    FinanceAutomationRule,
    FinanceSubscription,
} from '@/features/finance/types/finance';
import type { WatchlistItemWithLatest } from '@/features/finance/types/watchlist';

export function buildFinanceAutomationRules(
    accounts: FinanceAccount[],
    subscriptions: FinanceSubscription[],
    watchlist: WatchlistItemWithLatest[] = [],
): FinanceAutomationRule[] {
    const cashAccounts = accounts.filter((account) =>
        ['cash', 'checking', 'savings'].includes(account.type),
    );
    const activeSubscriptions = subscriptions.filter(
        (subscription) => subscription.active,
    );
    const targetItems = watchlist.filter(
        (item) => typeof item.config?.targetPrice === 'number',
    );

    return [
        {
            id: 'subscription-renewal-reminder',
            type: 'subscription_reminder',
            label: 'Subscription renewal reminder',
            enabled: activeSubscriptions.length > 0,
            conditions: {
                daysBeforeBilling: 3,
                activeSubscriptionCount: activeSubscriptions.length,
            },
            action: { kind: 'notify', route: '/finance?tab=subscriptions' },
        },
        {
            id: 'low-balance-alert',
            type: 'low_balance',
            label: 'Low balance alert',
            enabled: cashAccounts.length > 0,
            conditions: {
                threshold: 250,
                accountIds: cashAccounts.map((account) => account.id),
            },
            action: { kind: 'notify', route: '/finance?tab=accounts' },
        },
        {
            id: 'high-spending-alert',
            type: 'high_spending',
            label: 'High spending alert',
            enabled: true,
            conditions: { monthlyCategoryThreshold: 500 },
            action: { kind: 'review_spending', route: '/finance?tab=overview' },
        },
        {
            id: 'savings-goal-progress',
            type: 'savings_goal_progress',
            label: 'Savings goal progress alert',
            enabled: cashAccounts.length > 0,
            conditions: { cadence: 'weekly' },
            action: { kind: 'notify', route: '/finance?tab=overview' },
        },
        {
            id: 'watchlist-price-target',
            type: 'price_target',
            label: 'Watchlist price target alert',
            enabled: targetItems.length > 0,
            conditions: { targetItemCount: targetItems.length },
            action: { kind: 'notify', route: '/finance?tab=watchlist' },
        },
    ];
}
