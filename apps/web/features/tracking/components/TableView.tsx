'use client';

import {
    formatDate,
    formatMetadataDisplay,
} from '@/features/tracking/lib/trackingUtils';
import { getCategoryEmoji } from '@/features/tracking/constants';
import type { TrackingEntry } from '@/features/tracking/types/trackingEntries';
import type { CustomCategoryDef } from '@/features/tracking/types/customCategories';

interface TableViewProps {
    entries: TrackingEntry[];
    onDelete?: (id: string) => void;
    onEdit?: (entry: TrackingEntry) => void;
    customDefs?: CustomCategoryDef[];
}

function EntryRow({
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
        <tr className="border-b border-gray-100 dark:border-zinc-800 hover:bg-gray-50 dark:hover:bg-zinc-800/50 transition-colors">
            <td className="py-2 px-3 text-xs text-gray-500 dark:text-zinc-400 whitespace-nowrap">
                {formatDate(entry.entryDate)}
            </td>
            <td className="py-2 px-3 text-xs whitespace-nowrap">
                <span className="mr-1">
                    {getCategoryEmoji(entry.category, customDefs)}
                </span>
                <span className="text-gray-500 dark:text-zinc-400">
                    {entry.category}
                </span>
            </td>
            <td className="py-2 px-3 text-xs font-medium text-gray-800 dark:text-zinc-200 max-w-[200px] truncate">
                {formatMetadataDisplay(entry.category, entry.metadata)}
            </td>
            <td className="py-2 px-3 text-xs text-gray-500 dark:text-zinc-400 max-w-[120px] truncate">
                {entry.notes ?? 'N/A'}
            </td>
            <td className="py-2 px-3 text-right whitespace-nowrap space-x-2">
                {onEdit && (
                    <button
                        onClick={() => onEdit(entry)}
                        className="text-xs text-indigo-400 hover:text-indigo-600 transition-colors"
                    >
                        Edit
                    </button>
                )}
                {onDelete && (
                    <button
                        onClick={() => onDelete(entry.id)}
                        className="text-xs text-red-400 hover:text-red-600 transition-colors"
                    >
                        Delete
                    </button>
                )}
            </td>
        </tr>
    );
}

export function TableView({
    entries,
    onDelete,
    onEdit,
    customDefs,
}: TableViewProps) {
    if (entries.length === 0) {
        return (
            <p className="text-sm text-center text-gray-400 dark:text-zinc-500 py-8">
                No entries yet.
            </p>
        );
    }

    return (
        <div className="overflow-x-auto">
            <table className="w-full text-left">
                <thead>
                    <tr className="border-b border-gray-200 dark:border-zinc-700">
                        <th className="pb-2 px-3 text-xs font-semibold text-gray-500 dark:text-zinc-400">
                            Date
                        </th>
                        <th className="pb-2 px-3 text-xs font-semibold text-gray-500 dark:text-zinc-400">
                            Category
                        </th>
                        <th className="pb-2 px-3 text-xs font-semibold text-gray-500 dark:text-zinc-400">
                            Summary
                        </th>
                        <th className="pb-2 px-3 text-xs font-semibold text-gray-500 dark:text-zinc-400">
                            Notes
                        </th>
                        <th className="pb-2 px-3" />
                    </tr>
                </thead>
                <tbody>
                    {entries.map((e) => (
                        <EntryRow
                            key={e.id}
                            entry={e}
                            {...(onDelete !== undefined && { onDelete })}
                            {...(onEdit !== undefined && { onEdit })}
                            {...(customDefs !== undefined && { customDefs })}
                        />
                    ))}
                </tbody>
            </table>
        </div>
    );
}
