import { AlertTriangle } from 'lucide-react';

interface MetricsErrorStateProps {
    message?: string;
    onRetry?: () => void;
}

export function MetricsErrorState({
    message = 'Failed to load data',
    onRetry,
}: MetricsErrorStateProps) {
    return (
        <div className="flex flex-col items-center justify-center gap-2 py-10 text-red-400 dark:text-red-600">
            <AlertTriangle size={24} className="opacity-60" />
            <p className="text-sm">{message}</p>
            {onRetry && (
                <button
                    onClick={onRetry}
                    className="text-xs text-red-500 hover:text-red-600 underline transition-colors"
                >
                    Retry
                </button>
            )}
        </div>
    );
}
