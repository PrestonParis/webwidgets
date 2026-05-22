'use client';

interface SpendingBreakdownProps {
    breakdown: Array<{ category: string; amount: number }>;
    formatAmount?:
        | ((
              value: number,
              currency?: string,
              maximumFractionDigits?: number,
          ) => string)
        | undefined;
    amountClassName?: string;
}

export function SpendingBreakdown({
    breakdown,
    formatAmount,
    amountClassName = '',
}: SpendingBreakdownProps) {
    const fmt =
        formatAmount ??
        ((n: number) =>
            n.toLocaleString('en-US', {
                style: 'currency',
                currency: 'USD',
                maximumFractionDigits: 0,
            }));
    const top = breakdown.slice(0, 6);
    const max = top[0]?.amount ?? 1;

    if (top.length === 0) {
        return (
            <div className="text-center py-6">
                <p className="text-sm text-gray-400 dark:text-zinc-500">
                    No spending this month
                </p>
            </div>
        );
    }

    return (
        <div className="space-y-2">
            {top.map(({ category, amount }) => (
                <div key={category} className="flex items-center gap-3">
                    <span className="text-xs text-gray-600 dark:text-zinc-300 w-28 shrink-0 truncate">
                        {category}
                    </span>
                    <div className="flex-1 h-1.5 rounded-full bg-gray-100 dark:bg-zinc-800 overflow-hidden">
                        <div
                            className="h-full rounded-full bg-orange-400/70 dark:bg-orange-500/60 transition-all"
                            style={{ width: `${(amount / max) * 100}%` }}
                        />
                    </div>
                    <span
                        className={`text-xs font-medium text-gray-700 dark:text-zinc-300 w-20 text-right shrink-0 ${amountClassName}`}
                    >
                        {fmt(amount)}
                    </span>
                </div>
            ))}
        </div>
    );
}
