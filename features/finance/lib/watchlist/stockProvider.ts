import type {
    WatchlistItem,
    FetchResult,
} from '@/features/finance/types/watchlist';

export async function fetchStock(item: WatchlistItem): Promise<FetchResult> {
    const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(item.symbol)}?interval=1d&range=2d`;
    const res = await fetch(url, {
        headers: { 'User-Agent': 'Mozilla/5.0' },
        next: { revalidate: 0 },
    });
    if (!res.ok) throw new Error(`Yahoo Finance returned ${res.status}`);
    const json = (await res.json()) as {
        chart?: {
            result?: Array<{
                meta?: {
                    regularMarketPrice?: number;
                    previousClose?: number;
                    currency?: string;
                };
            }>;
        };
    };
    const meta = json.chart?.result?.[0]?.meta;
    if (!meta?.regularMarketPrice) throw new Error('No price in response');
    return {
        value: meta.regularMarketPrice,
        source: 'yahoo',
        metadata: {
            previousClose: meta.previousClose ?? null,
            currency: meta.currency ?? item.currency,
        },
    };
}
