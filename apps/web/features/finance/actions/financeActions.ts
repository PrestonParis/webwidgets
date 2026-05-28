export type FinanceActionId =
    | 'finance.addAccount'
    | 'finance.addTransaction'
    | 'finance.addSubscription'
    | 'finance.cancelSubscriptionReminder'
    | 'finance.reviewSpending'
    | 'finance.categorizeTransaction'
    | 'finance.createSavingsGoal'
    | 'finance.addWatchlistItem';

export type FinanceActionDefinition = {
    id: FinanceActionId;
    label: string;
    description: string;
    requiredInputs: string[];
    widgetTarget?: string;
    routeTarget: string;
    handler: (
        input: Record<string, unknown>,
    ) => Promise<{ ok: boolean; message: string }>;
};

const registeredAction = (label: string) =>
    Promise.resolve({
        ok: true,
        message: `${label} action is registered and ready for UI wiring.`,
    });

export const FINANCE_ACTIONS: FinanceActionDefinition[] = [
    {
        id: 'finance.addAccount',
        label: 'Add account',
        description:
            'Open the account creation flow from a widget, search result, or command bar.',
        requiredInputs: ['name', 'type', 'balance'],
        widgetTarget: 'finance-widget',
        routeTarget: '/finance?tab=accounts&action=add',
        handler: () => registeredAction('Add account'),
    },
    {
        id: 'finance.addTransaction',
        label: 'Add transaction',
        description:
            'Log an income, expense, or transfer against a finance account.',
        requiredInputs: ['title', 'amount', 'type', 'date'],
        widgetTarget: 'finance-widget',
        routeTarget: '/finance?tab=transactions&action=add',
        handler: () => registeredAction('Add transaction'),
    },
    {
        id: 'finance.addSubscription',
        label: 'Add subscription',
        description: 'Track a recurring bill or subscription renewal.',
        requiredInputs: ['name', 'amount', 'billingCycle'],
        widgetTarget: 'finance-widget',
        routeTarget: '/finance?tab=subscriptions&action=add',
        handler: () => registeredAction('Add subscription'),
    },
    {
        id: 'finance.cancelSubscriptionReminder',
        label: 'Cancel subscription reminder',
        description:
            'Create a reminder to review or cancel a subscription before renewal.',
        requiredInputs: ['subscriptionId', 'remindOn'],
        widgetTarget: 'finance-widget',
        routeTarget: '/finance?tab=subscriptions',
        handler: () => registeredAction('Cancel subscription reminder'),
    },
    {
        id: 'finance.reviewSpending',
        label: 'Review spending',
        description:
            'Open deterministic spending summaries and largest categories.',
        requiredInputs: ['dateRange'],
        routeTarget: '/finance?tab=overview',
        handler: () => registeredAction('Review spending'),
    },
    {
        id: 'finance.categorizeTransaction',
        label: 'Categorize transaction',
        description: 'Apply a suggested or manual category to a transaction.',
        requiredInputs: ['transactionId', 'category'],
        routeTarget: '/finance?tab=transactions',
        handler: () => registeredAction('Categorize transaction'),
    },
    {
        id: 'finance.createSavingsGoal',
        label: 'Create savings goal',
        description:
            'Create a simple savings goal target for future automation wiring.',
        requiredInputs: ['name', 'targetAmount'],
        routeTarget: '/finance?tab=overview',
        handler: () => registeredAction('Create savings goal'),
    },
    {
        id: 'finance.addWatchlistItem',
        label: 'Add watchlist item',
        description:
            'Track a stock, crypto asset, ETF, index, or manual target.',
        requiredInputs: ['symbol', 'name', 'type'],
        widgetTarget: 'finance-widget',
        routeTarget: '/finance?tab=watchlist&action=add',
        handler: () => registeredAction('Add watchlist item'),
    },
];

export function getFinanceAction(id: FinanceActionId) {
    return FINANCE_ACTIONS.find((action) => action.id === id);
}
