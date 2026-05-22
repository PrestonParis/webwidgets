export const FINANCE_WIDGETS = [
    {
        id: 'net-worth',
        title: 'Net worth',
        description: 'Assets, liabilities, and account totals.',
        status: 'Needs data',
    },
    {
        id: 'expense-breakdown',
        title: 'Expense breakdown',
        description: 'Transaction categories and spending trends.',
        status: 'Scaffold',
    },
    {
        id: 'subscription-auditor',
        title: 'Subscription auditor',
        description: 'Recurring charges and renewal review.',
        status: 'Scaffold',
    },
    {
        id: 'burn-rate',
        title: 'Burn rate',
        description: 'Monthly cash flow and runway shell.',
        status: 'Scaffold',
    },
    {
        id: 'portfolio-summary',
        title: 'Portfolio summary',
        description: 'Holdings boundary for future market providers.',
        status: 'Provider-ready',
    },
    {
        id: 'dividend-forecast',
        title: 'Dividend forecast',
        description: 'Forecast view ready for live market provider data.',
        status: 'Provider-ready',
    },
] as const;
