import type { TrackingCategory } from './trackingCategoryTypes';
import type { TrackingEntry } from './trackingEntryTypes';

export type HealthProvider =
    | 'apple_health'
    | 'google_fit'
    | 'fitbit'
    | 'garmin'
    | 'oura';

export interface ProviderConnection {
    provider: HealthProvider;
    connected: boolean;
    lastSync?: string;
    dataTypes: TrackingCategory[];
}

export interface HealthProviderAdapter {
    readonly provider: HealthProvider;
    isAvailable(): boolean;
    connect(): Promise<void>;
    disconnect(): Promise<void>;
    fetchEntries(from: string, to: string): Promise<TrackingEntry[]>;
    getConnection(): ProviderConnection;
}
