'use client';

export function MealEmptyState({
    onLog,
    onGoal,
}: {
    onLog: () => void;
    onGoal: () => void;
}) {
    return (
        <div className="text-center py-6 space-y-3">
            <p className="text-2xl">🍽️</p>
            <p className="text-sm text-gray-600 dark:text-zinc-400 font-medium">
                No meals logged yet
            </p>
            <p className="text-xs text-gray-400 dark:text-zinc-500">
                Start tracking your nutrition
            </p>
            <div className="flex gap-2 justify-center">
                <button
                    type="button"
                    onClick={onLog}
                    className="text-xs px-3 py-1.5 rounded-lg bg-green-500 text-white hover:bg-green-600 transition-colors"
                >
                    Log your first meal
                </button>
                <button
                    type="button"
                    onClick={onGoal}
                    className="text-xs px-3 py-1.5 rounded-lg border border-gray-200 dark:border-zinc-700 text-gray-500 dark:text-zinc-400 hover:border-green-300 hover:text-green-500 transition-colors"
                >
                    Set nutrition goals
                </button>
            </div>
        </div>
    );
}
