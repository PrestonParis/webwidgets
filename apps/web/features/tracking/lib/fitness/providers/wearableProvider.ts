import type { WearableProvider } from './types';

function unavailable(id: string, label: string): WearableProvider {
    return {
        id,
        label,
        configured: false,
        async syncStatus() {
            return {
                ok: false,
                error: `${label} is not configured. Add provider credentials before syncing workouts.`,
            };
        },
        async fetchWorkouts() {
            return [];
        },
    };
}

export const wearableProviders: WearableProvider[] = [
    unavailable('apple-health', 'Apple Health'),
    unavailable('google-fit', 'Google Fit / Health Connect'),
    unavailable('fitbit', 'Fitbit'),
    unavailable('garmin', 'Garmin Connect'),
    unavailable('strava', 'Strava'),
    unavailable('whoop', 'WHOOP'),
    unavailable('oura', 'Oura'),
];
