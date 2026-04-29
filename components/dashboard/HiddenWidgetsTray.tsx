// components/Dashboard/HiddenWidgetsTray.tsx
import { Eye } from 'lucide-react';
import { WidgetConfig } from '@/types/dashboard';

interface Props {
    hidden: WidgetConfig[];
    onRestore: (id: string) => void;
}

const BASE_LABELS: Record<string, string> = {
    journal: 'Journal',
    email: 'Email',
    recovery: 'Recovery',
    'recovery-empty': 'Recovery (Setup)', // Handles your missing label
    converter: 'Converter',
};

export default function HiddenWidgetsTray({ hidden, onRestore }: Props) {
    // Helper to determine the specific label for a widget instance
    const getWidgetLabel = (w: WidgetConfig) => {
        const base = BASE_LABELS[w.type] ?? w.type;

        // 1. If it's a recovery widget with a specific tracker name, use that
        if (w.type === 'recovery' && w.props?.tracker?.addiction) {
            return `${base}: ${w.props.tracker.addiction}`;
        }

        // 2. Check for duplicates of the same type in the hidden list
        const duplicates = hidden.filter((item) => item.type === w.type);
        if (duplicates.length > 1) {
            // Find the index of this specific widget among its peers
            const index = duplicates.findIndex((item) => item.id === w.id);
            return `${base} ${index + 1}`;
        }

        return base;
    };

    if (hidden.length === 0) return null;

    return (
        <div className="mt-10 p-4 rounded-xl border border-dashed border-zinc-300 dark:border-zinc-700">
            <p className="text-xs uppercase tracking-widest text-zinc-400 mb-3">
                Hidden Widgets
            </p>
            <div className="flex flex-wrap gap-2">
                {hidden.map((w) => (
                    <button
                        key={w.id}
                        onClick={() => onRestore(w.id)}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-100 dark:bg-zinc-800 text-sm text-zinc-600 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors"
                    >
                        <Eye size={13} />
                        {getWidgetLabel(w)}
                    </button>
                ))}
            </div>
        </div>
    );
}
