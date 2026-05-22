import type {
    WatchlistItem,
    FetchResult,
} from '@/features/finance/types/watchlist';

export async function fetchRealEstate(
    item: WatchlistItem,
): Promise<FetchResult> {
    const apiKey = process.env.RAPIDAPI_KEY;
    if (!apiKey) {
        return {
            value: null,
            source: 'manual',
            metadata: {},
            needsManual: true,
        };
    }

    const zpid = item.config.zpid as string | undefined;
    if (!zpid) {
        return {
            value: null,
            source: 'manual',
            metadata: {},
            needsManual: true,
        };
    }

    const res = await fetch(
        `https://zillow-com1.p.rapidapi.com/property?zpid=${encodeURIComponent(zpid)}`,
        {
            headers: {
                'X-RapidAPI-Key': apiKey,
                'X-RapidAPI-Host': 'zillow-com1.p.rapidapi.com',
            },
            next: { revalidate: 0 },
        },
    );

    if (!res.ok)
        return {
            value: null,
            source: 'manual',
            metadata: {},
            needsManual: true,
        };

    const json = (await res.json()) as {
        zestimate?: number;
        price?: number;
        address?: string;
    };
    const value = json.zestimate ?? json.price;
    if (!value)
        return {
            value: null,
            source: 'manual',
            metadata: {},
            needsManual: true,
        };

    return {
        value,
        source: 'rapidapi_zillow',
        metadata: { address: json.address ?? item.displayName, zpid },
    };
}
