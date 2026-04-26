interface JournalHeaderProps {
    entryCount: number;
}

// Simple header component displaying the current date and entry count
export function JournalHeader({ entryCount }: JournalHeaderProps) {
    return (
        <header className="lg:col-span-12 flex items-end justify-between">
            <div>
                <p className="text-[11px] uppercase tracking-[0.2em] text-stone-400 dark:text-zinc-500 mb-1">
                    {new Date().toLocaleDateString('en-US', {
                        weekday: 'long',
                        month: 'long',
                        day: 'numeric',
                    })}
                </p>
                <h1 className="font-serif text-4xl font-bold text-stone-900 dark:text-zinc-100 tracking-tight">
                    Journal
                </h1>
            </div>
            <span className="text-sm text-stone-400 dark:text-zinc-500">
                {entryCount} {entryCount === 1 ? 'entry' : 'entries'}
            </span>
        </header>
    );
}
