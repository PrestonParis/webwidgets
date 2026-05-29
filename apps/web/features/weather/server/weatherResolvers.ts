import type { DataResolver } from '@/features/widgets/types/snapshot';

// Weather requires client-side geolocation (open-meteo.com + bigdatacloud.net).
// This resolver returns a stable no-op so the manifest can declare weather.current
// without snapshot failures. The widget's own useWeather hook handles live data
// including: GPS geolocation, localStorage coordinate caching (24h TTL), and
// reverse geocoding via bigdatacloud.net. Server-side pre-fetch is blocked on
// snapshot resolvers gaining access to per-widget settings (lat/lon) from DB.

export const weatherResolvers: DataResolver[] = [
    {
        key: 'weather.current',
        cachePolicy: { ttlSeconds: 300 },
        resolve() {
            return Promise.resolve({ requiresGeolocation: true });
        },
    },
];
