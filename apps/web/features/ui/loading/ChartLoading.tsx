import { cn } from '@/lib/utils/utils';

interface ChartLoadingProps {
    height?: string;
    barCount?: number;
    variant?: 'line' | 'bar' | 'area';
    className?: string;
}

const BAR_HEIGHTS = [64, 38, 82, 51, 73, 45, 91, 57, 69, 34, 78, 49];

export function ChartLoading({
    height = 'h-64',
    barCount = 8,
    variant = 'line',
    className,
}: ChartLoadingProps) {
    return (
        <div
            className={cn(
                'w-full',
                height,
                'flex items-end gap-2 p-4',
                className,
            )}
        >
            {variant === 'bar' && (
                <>
                    {Array.from({ length: barCount }).map((_, idx) => (
                        <div
                            key={idx}
                            className="flex-1 bg-zinc-200 dark:bg-zinc-700 rounded-t animate-pulse"
                            style={{
                                height: `${BAR_HEIGHTS[idx % BAR_HEIGHTS.length]}%`,
                            }}
                        />
                    ))}
                </>
            )}
            {variant === 'line' && (
                <div className="w-full h-full flex items-center justify-center">
                    <div className="w-3/4 h-1/2 bg-zinc-200 dark:bg-zinc-700 rounded animate-pulse" />
                </div>
            )}
            {variant === 'area' && (
                <svg
                    className="w-full h-full"
                    viewBox="0 0 100 100"
                    preserveAspectRatio="none"
                >
                    <defs>
                        <linearGradient
                            id="loading-gradient"
                            x1="0%"
                            y1="0%"
                            x2="0%"
                            y2="100%"
                        >
                            <stop
                                offset="0%"
                                className="animate-pulse"
                                stopColor="currentColor"
                                stopOpacity="0.3"
                            />
                            <stop
                                offset="100%"
                                className="animate-pulse"
                                stopColor="currentColor"
                                stopOpacity="0"
                            />
                        </linearGradient>
                    </defs>
                    <polygon
                        points="0,100 100,100 100,50 0,50"
                        fill="url(#loading-gradient)"
                        className="text-zinc-200 dark:text-zinc-700"
                    />
                </svg>
            )}
        </div>
    );
}
