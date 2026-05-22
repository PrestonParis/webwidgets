'use client';

import {
    useReactTable,
    getCoreRowModel,
    getSortedRowModel,
    getPaginationRowModel,
    flexRender,
    type ColumnDef,
    type SortingState,
} from '@tanstack/react-table';
import { useState } from 'react';
import { ChevronUp, ChevronDown, ChevronsUpDown } from 'lucide-react';

interface MetricsDataTableProps<T> {
    columns: ColumnDef<T>[];
    data: T[];
    pageSize?: number;
}

function SortIcon({ sorted }: { sorted: false | 'asc' | 'desc' }) {
    if (sorted === 'asc') return <ChevronUp size={12} />;
    if (sorted === 'desc') return <ChevronDown size={12} />;
    return <ChevronsUpDown size={12} className="opacity-40" />;
}

export function MetricsDataTable<T>({
    columns,
    data,
    pageSize = 20,
}: MetricsDataTableProps<T>) {
    const [sorting, setSorting] = useState<SortingState>([]);

    const table = useReactTable({
        data,
        columns,
        state: { sorting },
        onSortingChange: setSorting,
        getCoreRowModel: getCoreRowModel(),
        getSortedRowModel: getSortedRowModel(),
        getPaginationRowModel: getPaginationRowModel(),
        initialState: { pagination: { pageSize } },
    });

    return (
        <div className="space-y-2">
            <div className="w-full overflow-x-auto rounded-xl border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-900">
                <table className="min-w-full text-sm">
                    <thead>
                        {table.getHeaderGroups().map((hg) => (
                            <tr
                                key={hg.id}
                                className="border-b border-gray-200 dark:border-zinc-800 bg-gray-50 dark:bg-zinc-800/50"
                            >
                                {hg.headers.map((header) => (
                                    <th
                                        key={header.id}
                                        onClick={header.column.getToggleSortingHandler()}
                                        className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-zinc-400 uppercase tracking-wider cursor-pointer select-none"
                                    >
                                        <div className="flex items-center gap-1">
                                            {flexRender(
                                                header.column.columnDef.header,
                                                header.getContext(),
                                            )}
                                            <SortIcon
                                                sorted={header.column.getIsSorted()}
                                            />
                                        </div>
                                    </th>
                                ))}
                            </tr>
                        ))}
                    </thead>
                    <tbody>
                        {table.getRowModel().rows.map((row) => (
                            <tr
                                key={row.id}
                                className="border-b border-gray-100 dark:border-zinc-800 last:border-0 hover:bg-gray-50 dark:hover:bg-zinc-800/50"
                            >
                                {row.getVisibleCells().map((cell) => (
                                    <td
                                        key={cell.id}
                                        className="px-4 py-3 text-gray-700 dark:text-zinc-300"
                                    >
                                        {flexRender(
                                            cell.column.columnDef.cell,
                                            cell.getContext(),
                                        )}
                                    </td>
                                ))}
                            </tr>
                        ))}
                        {table.getRowModel().rows.length === 0 && (
                            <tr>
                                <td
                                    colSpan={columns.length}
                                    className="px-4 py-10 text-center text-sm text-gray-400 dark:text-zinc-600"
                                >
                                    No data.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
            {table.getPageCount() > 1 && (
                <div className="flex items-center justify-between text-xs text-gray-500 dark:text-zinc-500">
                    <span>
                        Page {table.getState().pagination.pageIndex + 1} of{' '}
                        {table.getPageCount()}
                    </span>
                    <div className="flex gap-1">
                        <button
                            onClick={() => table.previousPage()}
                            disabled={!table.getCanPreviousPage()}
                            className="px-2 py-1 rounded border border-gray-200 dark:border-zinc-700 disabled:opacity-40 hover:bg-gray-100 dark:hover:bg-zinc-800"
                        >
                            ‹
                        </button>
                        <button
                            onClick={() => table.nextPage()}
                            disabled={!table.getCanNextPage()}
                            className="px-2 py-1 rounded border border-gray-200 dark:border-zinc-700 disabled:opacity-40 hover:bg-gray-100 dark:hover:bg-zinc-800"
                        >
                            ›
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
