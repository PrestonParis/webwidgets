'use client';

export type ViewMode = 'timeline' | 'graph' | 'stats' | 'heatmap' | 'table';

const MODES: { value: ViewMode; label: string; icon: string }[] = [
    { value: 'timeline', label: 'Timeline', icon: '⏱' },
    { value: 'graph', label: 'Graph', icon: '📈' },
    { value: 'stats', label: 'Stats', icon: '📊' },
    { value: 'heatmap', label: 'Heatmap', icon: '🟩' },
    { value: 'table', label: 'Table', icon: '⊞' },
];

interface ViewModeSwitcherProps {
    active: ViewMode;
    onChange: (mode: ViewMode) => void;
}

export function ViewModeSwitcher({ active, onChange }: ViewModeSwitcherProps) {
    return (
        <div className="flex gap-1 p-1 bg-gray-100 dark:bg-zinc-800 rounded-lg">
            {MODES.map((m) => (
                <button
                    key={m.value}
                    onClick={() => onChange(m.value)}
                    className={`flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${
                        active === m.value
                            ? 'bg-white dark:bg-zinc-700 text-gray-800 dark:text-zinc-200 shadow-sm'
                            : 'text-gray-500 dark:text-zinc-500 hover:text-gray-700 dark:hover:text-zinc-300'
                    }`}
                >
                    <span>{m.icon}</span>
                    <span>{m.label}</span>
                </button>
            ))}
        </div>
    );
}
