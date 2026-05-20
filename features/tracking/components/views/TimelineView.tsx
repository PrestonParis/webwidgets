'use client';

import { useMemo } from 'react';
import {
    formatDate,
    formatMetadataDisplay,
} from '@/features/tracking/lib/trackingUtils';
import { getCategoryEmoji } from '@/features/tracking/constants';
import type { TrackingEntry } from '@/features/tracking/types/tracking';
import type { CustomCategoryDef } from '@/features/tracking/types/customCategories';

interface TimelineViewProps {
    entries: TrackingEntry[];
    onDelete?: (id: string) => void;
    onEdit?: (entry: TrackingEntry) => void;
    customDefs?: CustomCategoryDef[];
}

interface DateGroup {
    date: string;
    entries: TrackingEntry[];
}

function TimelineEntry({
    entry,
    onDelete,
    onEdit,
    customDefs,
}: {
    entry: TrackingEntry;
    onDelete?: (id: string) => void;
    onEdit?: (entry: TrackingEntry) => void;
    customDefs?: CustomCategoryDef[];
}) {
    return (
        <div className="flex items-start gap-3 py-2">
            <span className="text-base mt-0.5 shrink-0">
                {getCategoryEmoji(entry.category, customDefs)}
            </span>
            <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-gray-800 dark:text-zinc-200 truncate">
                    {formatMetadataDisplay(entry.category, entry.metadata)}
                </p>
                {entry.notes && (
                    <p className="text-[11px] text-gray-500 dark:text-zinc-400 mt-0.5 truncate">
                        {entry.notes}
                    </p>
                )}
            </div>
            {onEdit && (
                <button
                    onClick={() => onEdit(entry)}
                    className="text-[10px] text-indigo-400 hover:text-indigo-600 transition-colors shrink-0"
                >
                    Edit
                </button>
            )}
            {onDelete && (
                <button
                    onClick={() => onDelete(entry.id)}
                    className="text-[10px] text-red-400 hover:text-red-600 transition-colors shrink-0"
                >
                    ✕
                </button>
            )}
        </div>
    );
}

export function TimelineView({
    entries,
    onDelete,
    onEdit,
    customDefs,
}: TimelineViewProps) {
    const groups: DateGroup[] = useMemo(() => {
        const map = new Map<string, TrackingEntry[]>();
        for (const e of [...entries].sort((a, b) =>
            b.entryDate.localeCompare(a.entryDate),
        )) {
            const list = map.get(e.entryDate) ?? [];
            list.push(e);
            map.set(e.entryDate, list);
        }
        return Array.from(map.entries()).map(([date, ents]) => ({
            date,
            entries: ents,
        }));
    }, [entries]);

    if (groups.length === 0) {
        return (
            <p className="text-sm text-center text-gray-400 dark:text-zinc-500 py-8">
                No entries yet.
            </p>
        );
    }

    return (
        <div className="space-y-4">
            {groups.map(({ date, entries: dayEntries }) => (
                <div key={date}>
                    <p className="text-[11px] font-semibold text-gray-500 dark:text-zinc-400 uppercase tracking-wide mb-1">
                        {formatDate(date)}
                    </p>
                    <div className="border-l-2 border-gray-100 dark:border-zinc-800 pl-3 divide-y divide-gray-50 dark:divide-zinc-800/50">
                        {dayEntries.map((e) => (
                            <TimelineEntry
                                key={e.id}
                                entry={e}
                                {...(onDelete !== undefined && { onDelete })}
                                {...(onEdit !== undefined && { onEdit })}
                                {...(customDefs !== undefined && {
                                    customDefs,
                                })}
                            />
                        ))}
                    </div>
                </div>
            ))}
        </div>
    );
}
