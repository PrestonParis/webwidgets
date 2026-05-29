import type {
    WatchlistItem,
    FetchResult,
} from '@/features/finance/types/watchlist';

export async function fetchCrypto(item: WatchlistItem): Promise<FetchResult> {
    const coinId =
        (item.config.coinId as string | undefined) ?? item.symbol.toLowerCase();
    const url = `https://api.coingecko.com/api/v3/simple/price?ids=${encodeURIComponent(coinId)}&vs_currencies=usd&include_24hr_change=true`;
    const res = await fetch(url, { next: { revalidate: 0 } });
    if (!res.ok) throw new Error(`CoinGecko returned ${res.status}`);
    const json = (await res.json()) as Record<
        string,
        { usd?: number; usd_24h_change?: number }
    >;
    const data = json[coinId];
    if (!data?.usd) throw new Error(`No price for ${coinId}`);
    return {
        value: data.usd,
        source: 'coingecko',
        metadata: { change24h: data.usd_24h_change ?? null },
    };
}
