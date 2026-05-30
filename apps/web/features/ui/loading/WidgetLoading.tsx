import { cn } from '@/lib/utils/utils';

type WidgetVariant = 'compact' | 'standard' | 'large' | 'dense';

interface WidgetLoadingProps {
    variant?: WidgetVariant;
    className?: string;
    showHeader?: boolean;
    showFooter?: boolean;
}

const heightMap: Record<WidgetVariant, string> = {
    compact: 'min-h-32',
    standard: 'min-h-48',
    large: 'min-h-96',
    dense: 'min-h-24',
};

export function WidgetLoading({
    variant = 'standard',
    className,
    showHeader = true,
    showFooter = false,
}: WidgetLoadingProps) {
    return (
        <div
            className={cn(
                'rounded-xl border border-zinc-100 dark:border-zinc-800 bg-white dark:bg-zinc-900 overflow-hidden',
                heightMap[variant],
                className,
            )}
        >
            {showHeader && (
                <div className="p-4 border-b border-zinc-100 dark:border-zinc-800">
                    <div className="h-4 bg-zinc-200 dark:bg-zinc-700 rounded w-1/4 animate-pulse" />
                </div>
            )}
            <div className="p-4 space-y-3">
                {Array.from({ length: variant === 'dense' ? 2 : 3 }).map(
                    (_, idx) => (
                        <div key={idx} className="space-y-2">
                            <div className="h-3 bg-zinc-200 dark:bg-zinc-700 rounded w-full animate-pulse" />
                            <div className="h-3 bg-zinc-100 dark:bg-zinc-800 rounded w-5/6 animate-pulse" />
                        </div>
                    ),
                )}
            </div>
            {showFooter && (
                <div className="p-4 border-t border-zinc-100 dark:border-zinc-800">
                    <div className="h-3 bg-zinc-200 dark:bg-zinc-700 rounded w-1/3 animate-pulse" />
                </div>
            )}
        </div>
    );
}
