import {
    QuickActionsProps,
    QuickActionKey,
} from '@/features/recovery/types/recovery';

const items: { key: QuickActionKey; label: string }[] = [
    { key: 'now', label: 'Now' },
    { key: 'sod', label: 'Start of day' },
    { key: '1hago', label: '1 hr ago' },
    { key: 'yesterday', label: 'Yesterday' },
];

export function QuickActions({ onSelect }: QuickActionsProps) {
    return (
        <div className="flex flex-wrap gap-1.5 px-3 pb-3">
            {items.map(({ key, label }) => (
                <button key={key} onClick={() => onSelect(key)}>
                    {label}
                </button>
            ))}
        </div>
    );
}
