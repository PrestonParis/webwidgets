import type {
    HealthProviderAdapter,
    ProviderConnection,
} from '@/features/tracking/types/providers';
import type { HealthProvider } from '@/features/tracking/types/providers';
import type { TrackingEntry } from '@/features/tracking/types/trackingEntries';

export class GoogleFitProvider implements HealthProviderAdapter {
    readonly provider: HealthProvider = 'google_fit';

    isAvailable(): boolean {
        return false;
    }

    connect(): Promise<void> {
        return Promise.reject(
            new Error('Google Fit integration not yet available'),
        );
    }

    disconnect(): Promise<void> {
        return Promise.resolve();
    }

    fetchEntries(): Promise<TrackingEntry[]> {
        return Promise.resolve([]);
    }

    getConnection(): ProviderConnection {
        return { provider: this.provider, connected: false, dataTypes: [] };
    }
}
