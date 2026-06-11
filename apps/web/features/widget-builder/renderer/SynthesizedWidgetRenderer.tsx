'use client';

import type { ReactNode } from 'react';
import type { SynthesizedWidgetDefinition } from '@/features/widgets/synthesis/widgetDefinitionInterfaces';
import {
    BarChartComponent,
    LineChartComponent,
    AreaChartComponent,
    PieChartComponent,
    ScatterChartComponent,
} from './charts/ChartComponents';

interface SynthesizedWidgetRendererProps {
    definition: SynthesizedWidgetDefinition;
    widgetId?: string;
    liveData?: Record<string, unknown[]>;
}

function getSampleData(
    schema: Record<string, string>,
    count = 7,
): Record<string, unknown>[] {
    return Array.from({ length: count }, (_, i) => {
        const row: Record<string, unknown> = {};
        for (const [k, t] of Object.entries(schema)) {
            if (t === 'number') row[k] = Math.round(Math.random() * 100 + 10);
            else if (t === 'boolean') row[k] = Math.random() > 0.5;
            else row[k] = `${k}-${i + 1}`;
        }
        return row;
    });
}

function renderComponent(
    registryId: string,
    data: Record<string, unknown>[],
    props: Record<string, unknown>,
): ReactNode {
    const chartData = data.map((row, i) => ({
        name: (row['date'] ??
            row['name'] ??
            row['label'] ??
            `Item ${i + 1}`) as string,
        value: (row['value'] ??
            row['amount'] ??
            row['count'] ??
            row['score'] ??
            0) as number,
        ...row,
    }));

    switch (registryId) {
        case 'bar-chart':
            return <BarChartComponent data={chartData} />;
        case 'line-chart':
            return <LineChartComponent data={chartData} />;
        case 'area-chart':
            return <AreaChartComponent data={chartData} />;
        case 'pie-chart':
        case 'donut-chart':
            return <PieChartComponent data={chartData} />;
        case 'scatter-plot':
            return <ScatterChartComponent data={chartData} />;
        case 'stat-row':
        case 'metric-display': {
            const latest = data[0] ?? {};
            const numericKeys = Object.entries(latest).filter(
                ([, v]) => typeof v === 'number',
            );
            return (
                <div className="grid grid-cols-2 gap-3">
                    {numericKeys.slice(0, 4).map(([k, v]) => (
                        <div key={k} className="rounded-xl bg-zinc-800/50 p-3">
                            <p className="text-[10px] uppercase text-zinc-500 mb-1">
                                {k}
                            </p>
                            <p className="text-lg font-bold text-zinc-100">
                                {String(v)}
                            </p>
                        </div>
                    ))}
                </div>
            );
        }
        case 'list':
        case 'timeline-item':
            return (
                <div className="space-y-1.5 max-h-48 overflow-y-auto">
                    {data.slice(0, 10).map((row, i) => {
                        const label = String(
                            row['name'] ??
                                row['title'] ??
                                row['text'] ??
                                row['label'] ??
                                `Row ${i + 1}`,
                        );
                        const sub = String(
                            row['date'] ??
                                row['created_at'] ??
                                row['description'] ??
                                '',
                        );
                        return (
                            <div
                                key={i}
                                className="flex items-center gap-3 rounded-xl bg-zinc-800/40 px-3 py-2"
                            >
                                <div className="h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-500" />
                                <div className="min-w-0 flex-1">
                                    <p className="text-xs text-zinc-200 truncate">
                                        {label}
                                    </p>
                                    {sub && (
                                        <p className="text-[10px] text-zinc-500 truncate">
                                            {sub}
                                        </p>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            );
        case 'table': {
            if (data.length === 0)
                return <p className="text-xs text-zinc-500">No data</p>;
            const firstRow = data[0] ?? {};
            const cols = Object.keys(firstRow).slice(0, 4);
            return (
                <div className="overflow-x-auto">
                    <table className="w-full text-xs">
                        <thead>
                            <tr className="border-b border-zinc-700">
                                {cols.map((c) => (
                                    <th
                                        key={c}
                                        className="pb-1.5 pr-3 text-left text-zinc-500 font-medium capitalize"
                                    >
                                        {c}
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {data.slice(0, 6).map((row, i) => (
                                <tr
                                    key={i}
                                    className="border-b border-zinc-800"
                                >
                                    {cols.map((c) => (
                                        <td
                                            key={c}
                                            className="py-1.5 pr-3 text-zinc-300 truncate max-w-[80px]"
                                        >
                                            {String(row[c] ?? '')}
                                        </td>
                                    ))}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            );
        }
        case 'progress-bar': {
            const pct = Math.min(
                100,
                Math.max(
                    0,
                    Number(data[0]?.['value'] ?? data[0]?.['percent'] ?? 50),
                ),
            );
            return (
                <div className="space-y-1">
                    <div className="flex justify-between text-[10px] text-zinc-500">
                        <span>{(props['label'] as string) ?? 'Progress'}</span>
                        <span>{pct}%</span>
                    </div>
                    <div className="h-2 w-full rounded-full bg-zinc-700">
                        <div
                            className="h-full rounded-full bg-emerald-500 transition-all"
                            style={{ width: `${pct}%` }}
                        />
                    </div>
                </div>
            );
        }
        case 'badge':
        case 'status-badge':
            return (
                <div className="flex flex-wrap gap-1.5">
                    {data.slice(0, 8).map((row, i) => (
                        <span
                            key={i}
                            className="rounded-full bg-emerald-900/40 border border-emerald-700 px-2.5 py-1 text-[10px] text-emerald-300"
                        >
                            {String(
                                row['name'] ??
                                    row['label'] ??
                                    row['status'] ??
                                    `Item ${i + 1}`,
                            )}
                        </span>
                    ))}
                </div>
            );
        case 'text':
        case 'heading':
            return (
                <p className="text-sm text-zinc-300">
                    {String(
                        props['content'] ??
                            data[0]?.['content'] ??
                            'Widget content',
                    )}
                </p>
            );
        default:
            return (
                <div className="rounded-xl border border-dashed border-zinc-700 p-4 text-center">
                    <p className="text-[10px] text-zinc-500 font-mono">
                        {registryId}
                    </p>
                </div>
            );
    }
}

export function SynthesizedWidgetRenderer({
    definition,
    liveData,
}: SynthesizedWidgetRendererProps) {
    const primarySource = definition.dataSources[0];
    const liveRows = primarySource ? liveData?.[primarySource.id] : undefined;
    const data: Record<string, unknown>[] =
        (liveRows as Record<string, unknown>[] | undefined) ??
        (primarySource ? getSampleData(primarySource.schema) : []);

    if (definition.components.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center h-full gap-2 text-zinc-600">
                <span className="text-2xl">🔧</span>
                <p className="text-xs">No components configured</p>
            </div>
        );
    }

    return (
        <div className="space-y-3 p-1">
            {definition.components
                .sort((a, b) => a.order - b.order)
                .map((comp) => (
                    <div key={`${comp.registryId}-${comp.order}`}>
                        {renderComponent(comp.registryId, data, comp.props)}
                    </div>
                ))}
        </div>
    );
}
