'use client';

import { useState, useCallback, useMemo } from 'react';
import type { ColumnDef } from '@tanstack/react-table';
import { MetricsDataTable } from '../MetricsDataTable';
import { MetricsDetailDrawer, MetricsJsonViewer } from '../MetricsDetailDrawer';
import { ExportCsvButton } from '../ExportCsvButton';
import { MetricsErrorState } from '../MetricsErrorState';
import { MetricsEmptyState } from '../MetricsEmptyState';
import { useMetricsFilter } from '../../hooks/useMetricsFilter';
import { useMetricsFetch } from '../../hooks/useMetricsFetch';
import { fetchEvents } from '../../lib/metricsApi';
import type { AnalyticsEventRow } from '../../types/metrics';
import { ANALYTICS_EVENTS } from '@/features/analytics/lib/eventNames';

interface EventsData {
    events: AnalyticsEventRow[];
    total: number;
}

const EVENT_TYPES = ['', ...Object.values(ANALYTICS_EVENTS)];

function formatDateTime(iso: string): string {
    return new Date(iso).toLocaleString('en-US', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
    });
}

function buildColumns(
    onOpen: (row: AnalyticsEventRow) => void,
): ColumnDef<AnalyticsEventRow>[] {
    return [
        {
            accessorKey: 'createdAt',
            header: 'Time',
            cell: ({ getValue }) => (
                <span className="text-xs">
                    {formatDateTime(getValue<string>())}
                </span>
            ),
        },
        {
            accessorKey: 'type',
            header: 'Event',
            cell: ({ getValue }) => (
                <code className="text-xs font-mono">{getValue<string>()}</code>
            ),
        },
        {
            accessorKey: 'source',
            header: 'Source',
            cell: ({ getValue }) => (
                <span className="text-xs text-gray-400">
                    {getValue<string | null>() ?? '—'}
                </span>
            ),
        },
        {
            accessorKey: 'userId',
            header: 'User',
            cell: ({ getValue }) => (
                <span className="text-xs font-mono text-gray-400">
                    {getValue<string | null>() ?? '—'}
                </span>
            ),
        },
        {
            id: 'detail',
            header: '',
            cell: ({ row }) => (
                <button
                    onClick={() => onOpen(row.original)}
                    className="text-xs text-violet-500 hover:text-violet-600 transition-colors"
                >
                    Details
                </button>
            ),
        },
    ];
}

export function MetricsEventsPage() {
    const { dateRange } = useMetricsFilter();
    const [typeFilter, setTypeFilter] = useState('');
    const [selected, setSelected] = useState<AnalyticsEventRow | null>(null);

    const { data, loading, error, refetch } = useMetricsFetch<EventsData>(
        () =>
            fetchEvents(dateRange.from, dateRange.to, {
                ...(typeFilter ? { type: typeFilter } : {}),
                limit: 100,
            }),
        [dateRange.from, dateRange.to, typeFilter],
    );

    const handleOpen = useCallback(
        (row: AnalyticsEventRow) => setSelected(row),
        [],
    );
    const columns = useMemo(() => buildColumns(handleOpen), [handleOpen]);

    const exportRows = useMemo(
        () => (data?.events ?? []) as unknown as Record<string, unknown>[],
        [data],
    );

    if (error) return <MetricsErrorState message={error} onRetry={refetch} />;

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between flex-wrap gap-2">
                <h1 className="text-xl font-bold text-gray-900 dark:text-zinc-100">
                    Events Explorer
                </h1>
                <div className="flex items-center gap-2">
                    <select
                        value={typeFilter}
                        onChange={(e) => setTypeFilter(e.target.value)}
                        className="text-xs rounded-lg border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-violet-500"
                    >
                        {EVENT_TYPES.map((t) => (
                            <option key={t} value={t}>
                                {t || 'All events'}
                            </option>
                        ))}
                    </select>
                    <ExportCsvButton rows={exportRows} filename="events.csv" />
                </div>
            </div>

            {loading ? (
                <div className="h-48 rounded-xl bg-gray-100 dark:bg-zinc-800 animate-pulse" />
            ) : (data?.events.length ?? 0) === 0 ? (
                <MetricsEmptyState message="No events in selected range" />
            ) : (
                <MetricsDataTable<AnalyticsEventRow>
                    columns={columns}
                    data={data?.events ?? []}
                    pageSize={25}
                />
            )}

            <MetricsDetailDrawer
                title="Event Details"
                open={selected !== null}
                onClose={() => setSelected(null)}
            >
                {selected && (
                    <>
                        <div className="space-y-1 text-sm">
                            <p>
                                <span className="text-gray-500">Type:</span>{' '}
                                <code className="font-mono">
                                    {selected.type}
                                </code>
                            </p>
                            <p>
                                <span className="text-gray-500">Time:</span>{' '}
                                {formatDateTime(selected.createdAt)}
                            </p>
                            <p>
                                <span className="text-gray-500">Source:</span>{' '}
                                {selected.source ?? '—'}
                            </p>
                            <p>
                                <span className="text-gray-500">User:</span>{' '}
                                {selected.userId ?? '—'}
                            </p>
                        </div>
                        {selected.metadata && (
                            <MetricsJsonViewer
                                data={selected.metadata}
                                label="Metadata"
                            />
                        )}
                    </>
                )}
            </MetricsDetailDrawer>
        </div>
    );
}
