import { EntryCardActionsProps } from '@/features/journal/types/journal';

export function EntryCardActions({
    entry,
    isTrash,
    isConfirming,
    onEdit,
    onDelete,
    onRestore,
    onConfirmStart,
    onConfirmCancel,
}: EntryCardActionsProps) {
    if (isTrash) {
        return (
            <button
                onClick={() => onRestore?.(entry.id)}
                className="text-[11px] font-semibold text-emerald-600 hover:text-emerald-500 transition-colors"
            >
                Restore
            </button>
        );
    }

    return (
        <>
            <button
                onClick={() => onEdit?.(entry)}
                className="opacity-0 group-hover:opacity-100 transition-opacity p-1.5 rounded-lg text-stone-300 hover:text-amber-500 dark:text-zinc-600 dark:hover:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-900/20 text-base"
                title="Edit entry"
            >
                ✎
            </button>

            {isConfirming ? (
                <div className="flex gap-1 items-center bg-red-50 dark:bg-red-900/20 px-2 py-0.5 rounded-lg">
                    <span className="text-[10px] font-bold text-red-500 uppercase">
                        Trash?
                    </span>
                    <button
                        onClick={() => onDelete(entry.id)}
                        className="text-red-500 font-bold text-xs hover:text-red-700"
                    >
                        Yes
                    </button>
                    <button
                        onClick={onConfirmCancel}
                        className="text-stone-400 text-xs hover:text-stone-600"
                    >
                        No
                    </button>
                </div>
            ) : (
                <button
                    onClick={onConfirmStart}
                    className="opacity-0 group-hover:opacity-100 transition-opacity p-1.5 rounded-lg text-stone-300 hover:text-red-400 dark:text-zinc-600 dark:hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 text-base leading-none"
                    title="Move to trash"
                >
                    ×
                </button>
            )}
        </>
    );
}
