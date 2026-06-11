'use client';

import { MealGoalProgressBar } from './MealGoalProgressBar';
import { MealCard } from './MealCard';
import { MealEmptyState } from './MealEmptyState';
import {
    calorieStatus,
    calorieStatusLabel,
} from '@/features/tracking/lib/meal/helpers';
import { formatDate } from '@/features/tracking/lib/trackingUtils';
import type { MealRecord } from '@/features/tracking/types/meal';

function todayKey(): string {
    return new Date().toISOString().slice(0, 10);
}

interface MealSummaryViewProps {
    records: MealRecord[];
    calorieTarget: number | null;
    proteinMin: number | null;
    onLog: () => void;
    onGoal: () => void;
}

export function MealSummaryView({
    records,
    calorieTarget,
    proteinMin,
    onLog,
    onGoal,
}: MealSummaryViewProps) {
    const today = todayKey();
    const todayRecords = records.filter((r) => r.date === today);
    const todayCals = todayRecords.reduce((s, r) => s + (r.calories ?? 0), 0);
    const todayProtein = todayRecords.reduce(
        (s, r) => s + (r.proteinGrams ?? 0),
        0,
    );
    const status = calorieStatus(todayCals, calorieTarget);
    const statusColors: Record<typeof status, string> = {
        on_track: 'text-green-600 dark:text-green-400',
        under_target: 'text-yellow-500 dark:text-yellow-400',
        over_target: 'text-red-500 dark:text-red-400',
        no_goal: 'text-gray-400 dark:text-zinc-500',
    };

    if (records.length === 0)
        return <MealEmptyState onLog={onLog} onGoal={onGoal} />;

    return (
        <div className="space-y-3">
            <div className="grid grid-cols-3 gap-2">
                <div className="text-center">
                    <p className="text-lg font-bold text-gray-800 dark:text-zinc-200">
                        {todayRecords.length}
                    </p>
                    <p className="text-[10px] text-gray-400 dark:text-zinc-500">
                        Meals today
                    </p>
                </div>
                {todayCals > 0 && (
                    <div className="text-center">
                        <p className="text-lg font-bold text-green-600 dark:text-green-400">
                            {Math.round(todayCals)}
                        </p>
                        <p className="text-[10px] text-gray-400 dark:text-zinc-500">
                            Calories
                        </p>
                    </div>
                )}
                {todayProtein > 0 && (
                    <div className="text-center">
                        <p className="text-lg font-bold text-blue-500 dark:text-blue-400">
                            {Math.round(todayProtein)}g
                        </p>
                        <p className="text-[10px] text-gray-400 dark:text-zinc-500">
                            Protein
                        </p>
                    </div>
                )}
            </div>
            <p className={`text-xs font-medium ${statusColors[status]}`}>
                {calorieStatusLabel(status)}
                {status !== 'no_goal' &&
                    todayCals > 0 &&
                    ` · ${Math.round(todayCals)} kcal`}
            </p>
            {calorieTarget !== null && todayCals > 0 && (
                <MealGoalProgressBar
                    label="Calories"
                    value={todayCals}
                    target={calorieTarget}
                    color="green"
                />
            )}
            {proteinMin !== null && todayProtein > 0 && (
                <MealGoalProgressBar
                    label="Protein"
                    value={todayProtein}
                    target={proteinMin}
                    color="blue"
                />
            )}
            {records[0] && (
                <div>
                    <p className="text-[10px] text-gray-400 dark:text-zinc-500 mb-1">
                        Latest · {formatDate(records[0].date)}
                    </p>
                    <MealCard record={records[0]} />
                </div>
            )}
        </div>
    );
}
