import type { ReactNode } from 'react';

export interface AdminColumn<T> {
    key: string;
    header: string;
    render: (row: T) => ReactNode;
    width?: string;
}

interface AdminDataTableProps<T> {
    columns: AdminColumn<T>[];
    rows: T[];
    getRowKey: (row: T) => string;
    loading?: boolean;
    emptyMessage?: string;
    onRowClick?: (row: T) => void;
}

function LoadingSkeleton({ cols }: { cols: number }) {
    return (
        <>
            {Array.from({ length: 5 }).map((_, i) => (
                <tr
                    key={i}
                    className="border-b border-gray-100 dark:border-zinc-800"
                >
                    {Array.from({ length: cols }).map((__, j) => (
                        <td key={j} className="px-4 py-3">
                            <div className="h-4 rounded bg-gray-100 dark:bg-zinc-800 animate-pulse" />
                        </td>
                    ))}
                </tr>
            ))}
        </>
    );
}

export function AdminDataTable<T>({
    columns,
    rows,
    getRowKey,
    loading = false,
    emptyMessage = 'No data.',
    onRowClick,
}: AdminDataTableProps<T>) {
    return (
        <div className="w-full overflow-x-auto rounded-xl border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-900">
            <table className="min-w-full text-sm">
                <thead>
                    <tr className="border-b border-gray-200 dark:border-zinc-800 bg-gray-50 dark:bg-zinc-800/50">
                        {columns.map((col) => (
                            <th
                                key={col.key}
                                className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-zinc-400 uppercase tracking-wider"
                                style={
                                    col.width ? { width: col.width } : undefined
                                }
                            >
                                {col.header}
                            </th>
                        ))}
                    </tr>
                </thead>
                <tbody>
                    {loading ? (
                        <LoadingSkeleton cols={columns.length} />
                    ) : rows.length === 0 ? (
                        <tr>
                            <td
                                colSpan={columns.length}
                                className="px-4 py-10 text-center text-sm text-gray-400 dark:text-zinc-600"
                            >
                                {emptyMessage}
                            </td>
                        </tr>
                    ) : (
                        rows.map((row) => (
                            <tr
                                key={getRowKey(row)}
                                onClick={
                                    onRowClick
                                        ? () => onRowClick(row)
                                        : undefined
                                }
                                className={`border-b border-gray-100 dark:border-zinc-800 last:border-0 transition-colors ${
                                    onRowClick
                                        ? 'cursor-pointer hover:bg-gray-50 dark:hover:bg-zinc-800/50'
                                        : ''
                                }`}
                            >
                                {columns.map((col) => (
                                    <td
                                        key={col.key}
                                        className="px-4 py-3 text-gray-700 dark:text-zinc-300"
                                    >
                                        {col.render(row)}
                                    </td>
                                ))}
                            </tr>
                        ))
                    )}
                </tbody>
            </table>
        </div>
    );
}
