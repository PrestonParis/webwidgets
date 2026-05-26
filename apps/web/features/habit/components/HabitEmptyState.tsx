import { Flame } from 'lucide-react';

interface HabitEmptyStateProps {
    message?: string;
    action?: { label: string; onClick: () => void };
}

export default function HabitEmptyState({
    message,
    action,
}: HabitEmptyStateProps) {
    return (
        <div className="flex flex-col items-center gap-2 py-6 text-stone-400 dark:text-zinc-600">
            <Flame size={28} className="opacity-40" />
            <p className="text-xs text-center">
                {message ?? 'No habits yet. Add one to start tracking.'}
            </p>
            {action && (
                <button
                    type="button"
                    onClick={action.onClick}
                    className="mt-1 rounded-lg bg-violet-500 px-3 py-1.5 text-xs font-medium text-white hover:bg-violet-600 transition-colors"
                >
                    {action.label}
                </button>
            )}
        </div>
    );
}
