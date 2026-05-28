'use client';

export function ActivityPage() {
    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
            <div className="mb-6">
                <p className="text-xs font-semibold uppercase text-indigo-500 dark:text-indigo-300">
                    Activity
                </p>
                <h1 className="mt-1 text-2xl font-bold text-gray-900 dark:text-zinc-100">
                    Activity Feed
                </h1>
                <p className="text-sm text-gray-500 dark:text-zinc-400">
                    Recent events across all your connected sources.
                </p>
            </div>
            <div className="rounded-2xl border border-gray-100 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-8 text-center">
                <p className="text-sm text-gray-500 dark:text-zinc-400">
                    Activity feed coming soon.
                </p>
            </div>
        </div>
    );
}
