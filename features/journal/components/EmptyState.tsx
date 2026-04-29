interface EmptyStateProps {
    view: 'all' | 'trash';
    hasSearchQuery: boolean;
}

export function EmptyState({ view, hasSearchQuery }: EmptyStateProps) {
    const getMessage = () => {
        if (view === 'trash') return 'Trash is empty.';
        if (hasSearchQuery) return 'No entries found.';
        return 'The page is blank.';
    };

    const getSubtext = () => {
        if (view === 'trash') return 'Deleted entries will appear here.';
        if (hasSearchQuery) return 'Try a different search term.';
        return 'Your first entry is waiting to be written.';
    };

    return (
        <div className="bg-white dark:bg-zinc-900/50 p-16 rounded-2xl border-2 border-dashed border-stone-200 dark:border-zinc-800 text-center">
            <p className="font-serif text-2xl text-stone-300 dark:text-zinc-600 mb-2">
                {getMessage()}
            </p>
            <p className="text-sm text-stone-400 dark:text-zinc-600">
                {getSubtext()}
            </p>
        </div>
    );
}
