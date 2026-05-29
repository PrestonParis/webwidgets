import type { IntegrationState } from '@/features/onboarding/types/integrations';

export interface ProviderRequirement {
    kind: 'oauth' | 'api_key' | 'local_file' | 'manual';
    label: string;
}

export interface IntegrationConnection {
    id: string;
    userId: string;
    providerId: string;
    state: IntegrationState;
    scopes: string[];
    lastCheckedAt?: string;
    errorMessage?: string;
}
