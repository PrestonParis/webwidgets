import { JournalEntry } from '@/features/journal/types/journal';

interface Props {
    entry: JournalEntry;
    isTrash?: boolean;
    isConfirming: boolean;
    onEdit?: (entry: JournalEntry) => void;
    onDelete: (id: number) => void;
    onRestore?: (id: number) => void;
    onConfirmStart: () => void;
    onConfirmCancel: () => void;
}

export function EntryCardActions({
    entry,
    isTrash,
    isConfirming,
    onEdit,
    onDelete,
    onRestore,
    onConfirmStart,
    onConfirmCancel,
}: Props) {
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
                className="opacity-0 group-hover:opacity-100 transition-opacity text-stone-300 hover:text-amber-500 dark:text-zinc-600 dark:hover:text-amber-400 text-sm"
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
                    className="opacity-0 group-hover:opacity-100 transition-opacity text-stone-300 hover:text-red-400 dark:text-zinc-600 dark:hover:text-red-500 text-lg leading-none"
                    title="Move to trash"
                >
                    ×
                </button>
            )}
        </>
    );
}
