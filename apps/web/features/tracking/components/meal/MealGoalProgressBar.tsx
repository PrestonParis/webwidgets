'use client';

interface MealGoalProgressBarProps {
    label: string;
    value: number;
    target: number;
    color?: 'green' | 'blue';
}

export function MealGoalProgressBar({
    label,
    value,
    target,
    color = 'green',
}: MealGoalProgressBarProps) {
    const pct = Math.min(100, Math.round((value / target) * 100));
    const barColor = color === 'green' ? 'bg-green-500' : 'bg-blue-500';
    return (
        <div>
            <div className="flex justify-between mb-0.5">
                <span className="text-[10px] text-gray-500 dark:text-zinc-400">
                    {label}
                </span>
                <span className="text-[10px] font-medium text-gray-700 dark:text-zinc-300">
                    {Math.round(value)}/{target}
                    <span className="text-gray-400 dark:text-zinc-500 ml-0.5">
                        ({pct}%)
                    </span>
                </span>
            </div>
            <div
                className="h-1.5 rounded-full bg-gray-100 dark:bg-zinc-700 overflow-hidden"
                role="progressbar"
                aria-valuenow={pct}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-label={`${label}: ${pct}%`}
            >
                <div
                    className={`h-full rounded-full transition-all ${barColor}`}
                    style={{ width: `${pct}%` }}
                />
            </div>
        </div>
    );
}
