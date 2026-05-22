'use client';

import { Move, Grid3X3, Magnet, Crosshair } from 'lucide-react';
import { cn } from '@/lib/utils/utils';
import type { SnapRule } from '@/features/dashboard/types/dashboard';

const RULES: {
    value: SnapRule;
    label: string;
    Icon: React.ComponentType<{ size?: number }>;
}[] = [
    { value: 'free', label: 'Free', Icon: Move },
    { value: 'grid', label: 'Grid', Icon: Grid3X3 },
    { value: 'edges', label: 'Edges', Icon: Magnet },
    { value: 'guides', label: 'Guides', Icon: Crosshair },
];

export function SnapRuleBar({
    snapRule,
    onChange,
}: {
    snapRule: SnapRule;
    onChange: (r: SnapRule) => void;
}) {
    return (
        <div className="flex items-center gap-0.5 bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-2xl p-1 shadow-sm">
            <span className="text-[10px] font-bold text-zinc-400 dark:text-zinc-600 uppercase tracking-widest px-2 select-none">
                Snap
            </span>
            {RULES.map(({ value, label, Icon }) => (
                <button
                    key={value}
                    onClick={() => onChange(value)}
                    className={cn(
                        'flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all',
                        snapRule === value
                            ? 'bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900'
                            : 'text-zinc-500 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800',
                    )}
                >
                    <Icon size={11} />
                    {label}
                </button>
            ))}
        </div>
    );
}
