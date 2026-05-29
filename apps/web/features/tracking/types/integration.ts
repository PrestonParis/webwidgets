export type {
    HealthProviderAdapter,
    ProviderConnection,
} from '@/features/tracking/types/providers';
import type { HealthProvider } from '@/features/tracking/types/providers';

export type ProviderConnectionStatus =
    | 'disconnected'
    | 'connecting'
    | 'connected'
    | 'error';

export interface ProviderStatus {
    provider: HealthProvider;
    status: ProviderConnectionStatus;
    lastSync?: string;
    error?: string;
}
