export interface ChartSeries {
    label: string;
    data: Array<{ x: string | number; y: number }>;
    color: string;
}

export interface TooltipPayload {
    label: string;
    value: number | string;
    color?: string | undefined;
    format?: string | undefined;
}

const DEFAULT_COLORS = [
    '#10b981',
    '#3b82f6',
    '#f59e0b',
    '#ef4444',
    '#8b5cf6',
    '#ec4899',
    '#14b8a6',
    '#f97316',
    '#6366f1',
    '#84cc16',
];

export function generateColorTokens(
    count: number,
    palette?: string[] | undefined,
): string[] {
    const source = palette ?? DEFAULT_COLORS;
    return Array.from(
        { length: count },
        (_, i) => source[i % source.length] ?? '#71717a',
    );
}

export function mapToChartSeries(
    rows: Record<string, unknown>[],
    xField: string,
    yField: string,
    label: string,
    color?: string | undefined,
): ChartSeries {
    return {
        label,
        color: color ?? DEFAULT_COLORS[0] ?? '#10b981',
        data: rows.map((row) => ({
            x: String(row[xField] ?? ''),
            y: Number(row[yField] ?? 0),
        })),
    };
}

export function normalizeChartDomain(
    values: number[],
    padPercent = 0.1,
): [number, number] {
    if (values.length === 0) return [0, 1];
    const min = Math.min(...values);
    const max = Math.max(...values);
    const range = max - min || 1;
    const pad = range * padPercent;
    return [min - pad, max + pad];
}

export function aggregateChartData(
    rows: Record<string, unknown>[],
    groupField: string,
    valueField: string,
): Array<{ label: string; value: number }> {
    const agg = new Map<string, number>();
    for (const row of rows) {
        const key = String(row[groupField] ?? 'other');
        agg.set(key, (agg.get(key) ?? 0) + Number(row[valueField] ?? 0));
    }
    return [...agg.entries()]
        .sort(([, a], [, b]) => b - a)
        .map(([label, value]) => ({ label, value }));
}

export function buildTooltipPayload(
    row: Record<string, unknown>,
    fields: Array<{
        key: string;
        label: string;
        format?: string | undefined;
        color?: string | undefined;
    }>,
): TooltipPayload[] {
    return fields.map(({ key, label, format, color }) => ({
        label,
        value: Number(row[key] ?? 0),
        ...(color !== undefined && { color }),
        ...(format !== undefined && { format }),
    }));
}

export function computeSparklinePoints(
    rows: Record<string, unknown>[],
    dateField: string,
    valueField: string,
    n = 7,
): Array<{ date: string; value: number }> {
    const sorted = [...rows].sort((a, b) =>
        String(a[dateField] ?? '').localeCompare(String(b[dateField] ?? '')),
    );
    return sorted
        .slice(-n)
        .map((row) => ({
            date: String(row[dateField] ?? ''),
            value: Number(row[valueField] ?? 0),
        }));
}

export function computeDonutSlices(
    rows: Record<string, unknown>[],
    labelField: string,
    valueField: string,
): Array<{ label: string; value: number; percent: number; color: string }> {
    const total = rows.reduce((s, r) => s + Number(r[valueField] ?? 0), 0);
    return rows.map((row, i) => ({
        label: String(row[labelField] ?? ''),
        value: Number(row[valueField] ?? 0),
        percent: total > 0 ? (Number(row[valueField] ?? 0) / total) * 100 : 0,
        color: DEFAULT_COLORS[i % DEFAULT_COLORS.length] ?? '#71717a',
    }));
}

export function computeHeatmapMatrix(
    rows: Record<string, unknown>[],
    rowField: string,
    colField: string,
    valueField: string,
): { rowLabels: string[]; colLabels: string[]; matrix: number[][] } {
    const rowLabels = [...new Set(rows.map((r) => String(r[rowField] ?? '')))];
    const colLabels = [...new Set(rows.map((r) => String(r[colField] ?? '')))];
    const matrix: number[][] = rowLabels.map(() => colLabels.map(() => 0));
    for (const row of rows) {
        const ri = rowLabels.indexOf(String(row[rowField] ?? ''));
        const ci = colLabels.indexOf(String(row[colField] ?? ''));
        if (ri >= 0 && ci >= 0) {
            const cell = matrix[ri];
            if (cell) cell[ci] = Number(row[valueField] ?? 0);
        }
    }
    return { rowLabels, colLabels, matrix };
}

export function computeRadarAxes(
    scores: Record<string, number>,
): Array<{ axis: string; value: number }> {
    return Object.entries(scores).map(([axis, value]) => ({
        axis,
        value: Math.max(0, Math.min(1, value)),
    }));
}

export function trendLabel(
    change: number,
    threshold = 0.02,
): 'up' | 'down' | 'flat' {
    if (change > threshold) return 'up';
    if (change < -threshold) return 'down';
    return 'flat';
}
