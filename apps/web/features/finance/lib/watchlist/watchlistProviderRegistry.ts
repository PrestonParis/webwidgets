import { fetchStock } from './stockProvider';
import { fetchCrypto } from './cryptoProvider';
import { fetchRealEstate } from './realEstateProvider';
import type {
    WatchlistItem,
    FetchResult,
} from '@/features/finance/types/watchlist';

export async function fetchLatestValue(
    item: WatchlistItem,
): Promise<FetchResult> {
    if (
        item.assetType === 'stock' ||
        item.assetType === 'etf' ||
        item.assetType === 'index'
    )
        return fetchStock(item);
    if (item.assetType === 'crypto') return fetchCrypto(item);
    if (item.assetType === 'real_estate') return fetchRealEstate(item);
    return { value: null, source: 'manual', metadata: {}, needsManual: true };
}
