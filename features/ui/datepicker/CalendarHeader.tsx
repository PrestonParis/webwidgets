export function CalendarHeader({
    label,
    onPrev,
    onNext,
}: {
    label: string;
    onPrev: () => void;
    onNext: () => void;
}) {
    return (
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 dark:border-zinc-800">
            <button
                onClick={onPrev}
                className="w-7 h-7 flex items-center justify-center rounded-lg text-gray-400 dark:text-zinc-500 hover:bg-gray-100 dark:hover:bg-zinc-800 transition-colors text-lg leading-none"
            >
                ‹
            </button>
            <span className="text-sm font-bold text-gray-900 dark:text-zinc-100">
                {label}
            </span>
            <button
                onClick={onNext}
                className="w-7 h-7 flex items-center justify-center rounded-lg text-gray-400 dark:text-zinc-500 hover:bg-gray-100 dark:hover:bg-zinc-800 transition-colors text-lg leading-none"
            >
                ›
            </button>
        </div>
    );
}
