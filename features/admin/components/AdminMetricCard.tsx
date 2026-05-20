import type { LucideIcon } from 'lucide-react';

interface AdminMetricCardProps {
    label: string;
    value: string | number;
    sub?: string;
    icon?: LucideIcon;
    trend?: 'up' | 'down' | 'neutral';
    trendValue?: string;
    color?: 'indigo' | 'green' | 'yellow' | 'red' | 'purple' | 'blue';
}

const COLOR_MAP = {
    indigo: 'bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400',
    green: 'bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400',
    yellow: 'bg-yellow-50 dark:bg-yellow-900/20 text-yellow-600 dark:text-yellow-400',
    red: 'bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400',
    purple: 'bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400',
    blue: 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400',
};

const TREND_STYLES = {
    up: 'text-green-600 dark:text-green-400',
    down: 'text-red-600 dark:text-red-400',
    neutral: 'text-gray-500 dark:text-zinc-400',
};

export function AdminMetricCard({
    label,
    value,
    sub,
    icon: Icon,
    trend,
    trendValue,
    color = 'indigo',
}: AdminMetricCardProps) {
    const iconCls = COLOR_MAP[color];

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
                {(sub ?? trendValue) && (
                    <p
                        className={`text-xs mt-0.5 ${trend ? TREND_STYLES[trend] : 'text-gray-400 dark:text-zinc-500'}`}
                    >
                        {trendValue ?? sub}
                    </p>
                )}
            </div>
        </div>
    );
}
