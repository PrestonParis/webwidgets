import { cn } from '@/lib/utils/utils';

export type TableDensity = 'compact' | 'normal' | 'relaxed';

const densityPadding: Record<TableDensity, string> = {
    compact: 'p-2',
    normal: 'p-3',
    relaxed: 'p-4',
};

interface TableLoadingProps {
    rows?: number;
    columns?: number;
    className?: string;
    showHeader?: boolean;
    density?: TableDensity;
}

export function TableLoading({
    rows = 5,
    columns = 4,
    className,
    showHeader = true,
    density = 'normal',
}: TableLoadingProps) {
    const colTemplate = { gridTemplateColumns: `repeat(${columns}, 1fr)` };
    const pad = densityPadding[density];

    return (
        <div className={cn('space-y-0', className)}>
            {showHeader && (
                <div
                    className={cn(
                        'grid gap-3 border-b border-zinc-200 dark:border-zinc-800',
                        pad,
                    )}
                    style={colTemplate}
                >
                    {Array.from({ length: columns }).map((_, idx) => (
                        <div
                            key={`header-${idx}`}
                            className="h-3.5 bg-zinc-200 dark:bg-zinc-700 rounded animate-pulse"
                        />
                    ))}
                </div>
            )}
            {Array.from({ length: rows }).map((_, rowIdx) => (
                <div
                    key={`row-${rowIdx}`}
                    className={cn(
                        'grid gap-3 border-b border-zinc-100 dark:border-zinc-900',
                        pad,
                    )}
                    style={colTemplate}
                >
                    {Array.from({ length: columns }).map((_, colIdx) => (
                        <div
                            key={`cell-${colIdx}`}
                            className="h-4 bg-zinc-100 dark:bg-zinc-800 rounded animate-pulse"
                        />
                    ))}
                </div>
            ))}
        </div>
    );
}
