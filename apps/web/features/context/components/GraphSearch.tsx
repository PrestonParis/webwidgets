'use client';

import { Search } from 'lucide-react';

interface GraphSearchProps {
    value: string;
    onChange: (value: string) => void;
}

export function GraphSearch({ value, onChange }: GraphSearchProps) {
    return (
        <label className="flex h-9 min-w-56 items-center gap-2 rounded-lg border border-zinc-200 bg-white px-3 dark:border-zinc-800 dark:bg-zinc-950">
            <Search size={14} className="text-zinc-400" />
            <input
                value={value}
                onChange={(event) => onChange(event.target.value)}
                placeholder="Search nodes, tags, relationships"
                className="min-w-0 flex-1 bg-transparent text-sm text-zinc-900 outline-none placeholder:text-zinc-400 dark:text-zinc-100"
            />
        </label>
    );
}
