import type { LucideIcon } from 'lucide-react';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface MetricCardProps {
    label: string;
    value: string | number;
    sub?: string;
    icon?: LucideIcon;
    delta?: number;
    color?: 'violet' | 'blue' | 'green' | 'yellow' | 'red' | 'gray';
}

const COLOR_ICON: Record<string, string> = {
    violet: 'bg-violet-50 dark:bg-violet-900/20 text-violet-600 dark:text-violet-400',
    blue: 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400',
    green: 'bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400',
    yellow: 'bg-yellow-50 dark:bg-yellow-900/20 text-yellow-600 dark:text-yellow-400',
    red: 'bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400',
    gray: 'bg-gray-100 dark:bg-zinc-800 text-gray-500 dark:text-zinc-400',
};

function DeltaBadge({ delta }: { delta: number }) {
    if (delta === 0)
        return (
            <span className="flex items-center gap-0.5 text-gray-400 text-xs">
                <Minus size={11} /> 0%
            </span>
        );
    const up = delta > 0;
    const Icon = up ? TrendingUp : TrendingDown;
    const cls = up
        ? 'text-green-600 dark:text-green-400'
        : 'text-red-600 dark:text-red-400';
    return (
        <span className={`flex items-center gap-0.5 text-xs ${cls}`}>
            <Icon size={11} />
            {Math.abs(delta).toFixed(1)}%
        </span>
    );
}

export function MetricCard({
    label,
    value,
    sub,
    icon: Icon,
    delta,
    color = 'violet',
}: MetricCardProps) {
    const iconCls = COLOR_ICON[color];
    return (
        <div className="bg-white dark:bg-zinc-900 rounded-xl border border-gray-200 dark:border-zinc-800 p-4 flex items-start gap-3">
            {Icon && (
                <div className={`p-2 rounded-lg ${iconCls}`}>
                    <Icon size={16} />
                </div>
            )}
            <div className="flex-1 min-w-0">
                <p className="text-xs text-gray-500 dark:text-zinc-500 truncate">
                    {label}
                </p>
                <p className="text-2xl font-bold text-gray-900 dark:text-zinc-100 leading-tight">
                    {value}
                </p>
                <div className="flex items-center gap-2 mt-0.5">
                    {sub && (
                        <span className="text-xs text-gray-400 dark:text-zinc-500">
                            {sub}
                        </span>
                    )}
                    {delta !== undefined && <DeltaBadge delta={delta} />}
                </div>
            </div>
        </div>
    );
}
