'use client';

interface FinanceChartTooltipProps {
    x: number;
    y: number;
    visible: boolean;
    children: React.ReactNode;
}

export function FinanceChartTooltip({
    x,
    y,
    visible,
    children,
}: FinanceChartTooltipProps) {
    if (!visible) return null;
    return (
        <div
            className="pointer-events-none absolute z-40 min-w-[130px] rounded-xl border border-zinc-700 bg-zinc-900/96 px-3 py-2.5 text-xs text-zinc-100 shadow-2xl backdrop-blur-sm"
            style={{ left: x + 14, top: y - 8, transform: 'translateY(-50%)' }}
        >
            {children}
        </div>
    );
}
