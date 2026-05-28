'use client';

import type { ContextGraph } from '@/features/context/types/context';

export interface ContextFilterState {
    type: string;
    relationship: string;
    activity: 'all' | 'active' | 'quiet';
    connectedOnly: boolean;
}

interface ContextFiltersProps {
    graph: ContextGraph;
    filters: ContextFilterState;
    onChange: (filters: ContextFilterState) => void;
}

export function ContextFilters({
    graph,
    filters,
    onChange,
}: ContextFiltersProps) {
    const types = [
        ...new Set(graph.nodes.map((node) => node.entryType)),
    ].sort();
    const relationships = [
        ...new Set(graph.edges.map((edge) => edge.kind ?? 'explicit')),
    ].sort();

    return (
        <div className="flex flex-wrap items-center gap-2">
            <select
                value={filters.type}
                onChange={(event) =>
                    onChange({ ...filters, type: event.target.value })
                }
                className="h-9 rounded-lg border border-zinc-200 bg-white px-2 text-sm dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-100"
            >
                <option value="all">All types</option>
                {types.map((type) => (
                    <option key={type} value={type}>
                        {type.replace('_', ' ')}
                    </option>
                ))}
            </select>
            <select
                value={filters.relationship}
                onChange={(event) =>
                    onChange({ ...filters, relationship: event.target.value })
                }
                className="h-9 rounded-lg border border-zinc-200 bg-white px-2 text-sm dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-100"
            >
                <option value="all">All links</option>
                {relationships.map((relationship) => (
                    <option key={relationship} value={relationship}>
                        {relationship}
                    </option>
                ))}
            </select>
            <select
                value={filters.activity}
                onChange={(event) =>
                    onChange({
                        ...filters,
                        activity: event.target
                            .value as ContextFilterState['activity'],
                    })
                }
                className="h-9 rounded-lg border border-zinc-200 bg-white px-2 text-sm dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-100"
            >
                <option value="all">All activity</option>
                <option value="active">Recently active</option>
                <option value="quiet">Quiet systems</option>
            </select>
            <label className="inline-flex h-9 items-center gap-2 rounded-lg border border-zinc-200 bg-white px-3 text-sm text-zinc-600 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-300">
                <input
                    type="checkbox"
                    checked={filters.connectedOnly}
                    onChange={(event) =>
                        onChange({
                            ...filters,
                            connectedOnly: event.target.checked,
                        })
                    }
                    className="h-3.5 w-3.5"
                />
                Connected only
            </label>
        </div>
    );
}
