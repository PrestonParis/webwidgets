import { INTEGRATION_PROVIDERS } from '@/features/onboarding/lib/integrationRegistry';

const EXTRA_PROVIDERS = [
    {
        id: 'google-sheets',
        name: 'Google Sheets',
        summary: 'Spreadsheet imports, exports, and dashboards.',
        state: 'coming-soon',
    },
    {
        id: 'apple-health',
        name: 'Apple Health',
        summary: 'Health import connector ready for provider authorization.',
        state: 'coming-soon',
    },
    {
        id: 'google-fit',
        name: 'Google Fit',
        summary: 'Fitness import connector ready for provider authorization.',
        state: 'coming-soon',
    },
    {
        id: 'fitbit',
        name: 'Fitbit',
        summary: 'Wearable import connector ready for provider authorization.',
        state: 'coming-soon',
    },
    {
        id: 'garmin',
        name: 'Garmin',
        summary: 'Training import connector ready for provider authorization.',
        state: 'coming-soon',
    },
    {
        id: 'oura',
        name: 'Oura',
        summary: 'Sleep and recovery connector ready for provider authorization.',
        state: 'coming-soon',
    },
] as const;

export function useIntegrationCatalog() {
    return { providers: [...INTEGRATION_PROVIDERS, ...EXTRA_PROVIDERS] };
}
