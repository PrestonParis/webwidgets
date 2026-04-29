import Link from 'next/link';

interface WidgetFooterProps {
    showUrgeForm: boolean;
    trigger: string;
    isSaving: boolean;
    onTriggerChange: (value: string) => void;
    onLogUrge: () => void;
    onCancelUrge: () => void;
    onShowUrgeForm: () => void;
    onReset: () => void;
}

export default function SoberWidgetFooter({
    showUrgeForm,
    trigger,
    isSaving,
    onTriggerChange,
    onLogUrge,
    onCancelUrge,
    onShowUrgeForm,
    onReset,
}: WidgetFooterProps) {
    if (showUrgeForm) {
        return (
            <div className="space-y-2">
                <textarea
                    placeholder="What triggered it?"
                    value={trigger}
                    onChange={(e) => onTriggerChange(e.target.value)}
                    className="w-full bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-xl p-2 text-sm outline-none focus:ring-2 focus:ring-purple-200 dark:focus:ring-purple-900/50 text-gray-900 dark:text-zinc-100 resize-none h-16"
                />
                <div className="flex gap-2">
                    <button
                        onClick={onLogUrge}
                        disabled={isSaving || !trigger.trim()}
                        className="flex-1 py-2 bg-purple-600 text-white rounded-xl text-xs font-bold hover:bg-purple-700 disabled:bg-gray-300 dark:disabled:bg-zinc-800 dark:disabled:text-zinc-600 transition-colors"
                    >
                        {isSaving ? 'Saving...' : 'Save'}
                    </button>
                    <button
                        onClick={onCancelUrge}
                        className="flex-1 py-2 border border-gray-200 dark:border-zinc-800 rounded-xl text-xs font-bold text-gray-500 dark:text-zinc-400 hover:bg-gray-50 dark:hover:bg-zinc-900 transition-colors"
                    >
                        Cancel
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="flex flex-col gap-2">
            <div className="flex gap-2">
                <button
                    onClick={onShowUrgeForm}
                    className="flex-1 py-2 bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400 rounded-xl text-xs font-bold hover:bg-purple-100 dark:hover:bg-purple-900/40 transition-colors"
                >
                    Log urge
                </button>
                <button
                    onClick={onReset}
                    className="flex-1 py-2 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-xl text-xs font-bold hover:bg-red-100 dark:hover:bg-red-900/40 transition-colors"
                >
                    Reset Streak
                </button>
            </div>
            <Link
                href="/recovery"
                className="block text-center text-xs text-gray-400 hover:text-purple-600 dark:hover:text-purple-400 transition-colors pt-1"
            >
                View full page →
            </Link>
        </div>
    );
}
