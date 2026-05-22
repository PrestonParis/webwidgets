import type { Trend } from '@/features/tracking/types/analytics';

interface TrendSummaryProps {
    trend: Trend;
    metric?: string;
    className?: string;
}

function TrendIcon({ direction }: { direction: Trend['direction'] }) {
    if (direction === 'improving') {
        return (
            <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-green-100 text-green-600 font-bold text-sm">
                ↑
            </span>
        );
    }
    if (direction === 'declining') {
        return (
            <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-red-100 text-red-600 font-bold text-sm">
                ↓
            </span>
        );
    }
    return (
        <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-gray-100 text-gray-500 font-bold text-sm">
            →
        </span>
    );
}

const directionLabel: Record<Trend['direction'], string> = {
    improving: 'Improving',
    declining: 'Declining',
    stable: 'Stable',
};

const directionColor: Record<Trend['direction'], string> = {
    improving: 'text-green-700',
    declining: 'text-red-700',
    stable: 'text-gray-600',
};

export function TrendSummary({
    trend,
    metric,
    className = '',
}: TrendSummaryProps) {
    const pct = Math.round(trend.magnitude * 100);
    const label = metric ?? trend.metric;

    return (
        <div
            className={`flex items-center gap-3 rounded-lg border border-gray-200 bg-white px-4 py-3 ${className}`}
        >
            <TrendIcon direction={trend.direction} />
            <div>
                <p
                    className={`text-sm font-semibold ${directionColor[trend.direction]}`}
                >
                    {directionLabel[trend.direction]}
                    {pct > 0 && (
                        <span className="ml-1 font-normal">({pct}%)</span>
                    )}
                </p>
                <p className="text-xs text-gray-500">
                    {label} · past {trend.period}
                </p>
            </div>
        </div>
    );
}
