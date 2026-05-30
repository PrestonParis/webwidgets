import { cn } from '@/lib/utils/utils';

export type ListDensity = 'compact' | 'normal' | 'relaxed';

const densityPadding: Record<ListDensity, string> = {
    compact: 'p-2',
    normal: 'p-3',
    relaxed: 'p-4',
};

const densityGap: Record<ListDensity, string> = {
    compact: 'space-y-1',
    normal: 'space-y-2',
    relaxed: 'space-y-3',
};

interface ListLoadingProps {
    count?: number;
    showAvatar?: boolean;
    showMeta?: boolean;
    density?: ListDensity;
    className?: string;
}

export function ListLoading({
    count = 5,
    showAvatar = false,
    showMeta = true,
    density = 'normal',
    className,
}: ListLoadingProps) {
    return (
        <div className={cn(densityGap[density], className)}>
            {Array.from({ length: count }).map((_, idx) => (
                <div
                    key={idx}
                    className={cn(
                        'rounded-lg border border-zinc-100 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900',
                        densityPadding[density],
                    )}
                >
                    <div
                        className={cn(
                            'flex gap-3',
                            showAvatar ? 'items-start' : 'items-center',
                        )}
                    >
                        {showAvatar && (
                            <div className="w-9 h-9 rounded-full bg-zinc-200 dark:bg-zinc-700 animate-pulse shrink-0" />
                        )}
                        <div className="flex-1 space-y-2 min-w-0">
                            <div className="h-3.5 bg-zinc-200 dark:bg-zinc-700 rounded animate-pulse w-3/4" />
                            {showMeta && (
                                <div className="h-3 bg-zinc-100 dark:bg-zinc-800 rounded animate-pulse w-1/2" />
                            )}
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );
}
