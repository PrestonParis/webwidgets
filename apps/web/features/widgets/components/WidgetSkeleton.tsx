export function WidgetSkeleton() {
    return (
        <div className="rounded-3xl bg-white dark:bg-zinc-900 shadow-sm h-full p-6 flex flex-col min-h-44">
            {/* Header row */}
            <div className="flex items-center gap-3 mb-6">
                <div className="w-8 h-8 rounded-xl bg-zinc-100 dark:bg-zinc-800 animate-pulse shrink-0" />
                <div className="h-4 w-28 rounded-full bg-zinc-100 dark:bg-zinc-800 animate-pulse" />
            </div>
            {/* Content lines */}
            <div className="space-y-2.5 flex-1">
                <div className="h-2.5 rounded-full bg-zinc-100 dark:bg-zinc-800 animate-pulse" />
                <div className="h-2.5 w-4/5 rounded-full bg-zinc-100 dark:bg-zinc-800 animate-pulse" />
                <div className="h-2.5 w-3/5 rounded-full bg-zinc-100 dark:bg-zinc-800 animate-pulse" />
            </div>
        </div>
    );
}
