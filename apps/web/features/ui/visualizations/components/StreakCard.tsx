interface StreakCardProps {
    current: number;
    longest: number;
    label: string;
    emoji?: string;
    className?: string;
}

export function StreakCard({
    current,
    longest,
    label,
    emoji,
    className = '',
}: StreakCardProps) {
    const displayEmoji = emoji ?? (current > 0 ? '🔥' : '');

    return (
        <div
            className={`rounded-xl border border-gray-200 bg-white p-4 ${className}`}
        >
            <p className="mb-1 text-sm font-medium text-gray-500">{label}</p>
            <div className="flex items-baseline gap-2">
                <span className="text-4xl font-bold text-gray-900">
                    {current}
                </span>
                {displayEmoji && (
                    <span className="text-2xl" aria-hidden="true">
                        {displayEmoji}
                    </span>
                )}
                <span className="text-sm text-gray-500">day streak</span>
            </div>
            <p className="mt-2 text-xs text-gray-400">
                Longest:{' '}
                <span className="font-semibold text-gray-600">{longest}</span>{' '}
                days
            </p>
        </div>
    );
}
