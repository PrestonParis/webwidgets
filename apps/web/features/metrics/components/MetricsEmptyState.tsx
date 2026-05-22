import { BarChart2 } from 'lucide-react';

interface MetricsEmptyStateProps {
    message?: string;
}

export function MetricsEmptyState({
    message = 'No data available',
}: MetricsEmptyStateProps) {
    return (
        <div className="flex flex-col items-center justify-center gap-2 py-10 text-gray-400 dark:text-zinc-600">
            <BarChart2 size={24} className="opacity-40" />
            <p className="text-sm">{message}</p>
        </div>
    );
}
