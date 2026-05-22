import type {
    OverviewStats,
    WidgetMetricRow,
    ActionMetricRow,
    MLMetricRow,
    AnalyticsEventRow,
    CostSummary,
    DailySeries,
} from '../types/metrics';

function qs(params: Record<string, string | undefined>): string {
    const p = new URLSearchParams();
    for (const [k, v] of Object.entries(params)) {
        if (v) p.set(k, v);
    }
    const s = p.toString();
    return s ? `?${s}` : '';
}

async function get<T>(url: string): Promise<T> {
    const res = await fetch(url, { cache: 'no-store' });
    if (!res.ok) throw new Error(`Metrics API error: ${res.status}`);
    return res.json() as Promise<T>;
}

// — Overview —

export async function fetchOverview(
    from: string,
    to: string,
): Promise<OverviewStats> {
    return get<OverviewStats>(`/api/metrics-data/overview${qs({ from, to })}`);
}

// — Widgets —

export async function fetchWidgetMetrics(
    from: string,
    to: string,
): Promise<{ rows: WidgetMetricRow[]; series: DailySeries[] }> {
    return get(`/api/metrics-data/widgets${qs({ from, to })}`);
}

// — Actions —

export async function fetchActionMetrics(
    from: string,
    to: string,
    actionType?: string,
): Promise<{ rows: ActionMetricRow[]; series: DailySeries[] }> {
    return get(`/api/metrics-data/actions${qs({ from, to, actionType })}`);
}

// — ML —

export async function fetchMLMetrics(
    from: string,
    to: string,
): Promise<{ rows: MLMetricRow[]; series: DailySeries[] }> {
    return get(`/api/metrics-data/ml${qs({ from, to })}`);
}

// — Events explorer —

export async function fetchEvents(
    from: string,
    to: string,
    opts: { type?: string; limit?: number; offset?: number },
): Promise<{ events: AnalyticsEventRow[]; total: number }> {
    return get(
        `/api/metrics-data/events${qs({
            from,
            to,
            ...(opts.type ? { type: opts.type } : {}),
            ...(opts.limit ? { limit: String(opts.limit) } : {}),
            ...(opts.offset ? { offset: String(opts.offset) } : {}),
        })}`,
    );
}

// — Costs —

export async function fetchCostMetrics(
    from: string,
    to: string,
): Promise<{ summaries: CostSummary[]; series: DailySeries[] }> {
    return get(`/api/metrics-data/costs${qs({ from, to })}`);
}

// — Performance —

export async function fetchPerformanceMetrics(
    from: string,
    to: string,
): Promise<{ p50: number; p95: number; p99: number; series: DailySeries[] }> {
    return get(`/api/metrics-data/performance${qs({ from, to })}`);
}

// — CSV export —

export function buildCsvFromRows<T extends Record<string, unknown>>(
    rows: T[],
): string {
    if (rows.length === 0) return '';
    const headers = Object.keys(rows[0]!);
    const lines = [
        headers.join(','),
        ...rows.map((r) =>
            headers
                .map((h) => {
                    const v = r[h];
                    const s = v === null || v === undefined ? '' : String(v);
                    return s.includes(',') ? `"${s}"` : s;
                })
                .join(','),
        ),
    ];
    return lines.join('\n');
}

export function downloadCsv(content: string, filename: string): void {
    const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
}
