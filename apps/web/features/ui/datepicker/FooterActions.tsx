import { FooterActionsProps } from '../types/datepicker';

export function FooterActions({
    onCancel,
    onSave,
    saveLabel = 'Save date',
}: FooterActionsProps) {
    return (
        <div className="flex gap-2 px-3 pb-3 pt-2 border-t border-gray-100 dark:border-zinc-800">
            <button
                onClick={onCancel}
                className="flex-1 py-2 text-xs rounded-xl border border-gray-200 dark:border-zinc-700 text-gray-500 dark:text-zinc-400 hover:bg-gray-50 dark:hover:bg-zinc-800 transition-colors"
            >
                Cancel
            </button>
            <button
                onClick={onSave}
                className="flex-1 py-2 text-xs rounded-xl bg-purple-600 text-white hover:bg-purple-700 font-bold transition-colors"
            >
                {saveLabel}
            </button>
        </div>
    );
}
