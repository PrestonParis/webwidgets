'use client';

import {
    ChartNoAxesCombined,
    Grid3X3,
    ListTree,
    Table2,
    Timer,
} from 'lucide-react';

export type ViewMode = 'timeline' | 'graph' | 'stats' | 'heatmap' | 'table';

const MODES = [
    { value: 'timeline', label: 'Timeline', icon: Timer },
    { value: 'graph', label: 'Graph', icon: ChartNoAxesCombined },
    { value: 'stats', label: 'Stats', icon: ListTree },
    { value: 'heatmap', label: 'Heatmap', icon: Grid3X3 },
    { value: 'table', label: 'Table', icon: Table2 },
] satisfies { value: ViewMode; label: string; icon: typeof Timer }[];

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
                    <m.icon className="h-3.5 w-3.5" aria-hidden="true" />
                    <span>{m.label}</span>
                </button>
            ))}
        </div>
    );
}
