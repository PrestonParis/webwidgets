import { QuickActionsProps, QuickActionKey } from '../types/datepicker';

const ITEMS: { key: QuickActionKey; label: string }[] = [
    { key: 'now', label: 'Now' },
    { key: 'sod', label: 'Start of day' },
    { key: '1hago', label: '1 hr ago' },
    { key: 'yesterday', label: 'Yesterday' },
];

export function QuickActions({ onSelect }: QuickActionsProps) {
    return (
        <div className="flex flex-wrap gap-1.5 px-3 pb-3">
            {ITEMS.map(({ key, label }) => (
                <button
                    key={key}
                    onClick={() => onSelect(key)}
                    className="px-2 py-1 text-xs rounded-lg bg-gray-50 dark:bg-zinc-800 text-gray-600 dark:text-zinc-400 hover:bg-purple-50 dark:hover:bg-purple-900/20 hover:text-purple-600 dark:hover:text-purple-400 transition-colors border border-gray-100 dark:border-zinc-700"
                >
                    {label}
                </button>
            ))}
        </div>
    );
}
