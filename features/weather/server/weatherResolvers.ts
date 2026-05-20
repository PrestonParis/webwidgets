import type { DataResolver } from '@/features/widgets/types/snapshot';

// Weather requires client-side geolocation (open-meteo.com + bigdatacloud.net).
// This resolver returns a stable no-op so the manifest can declare weather.current
// without snapshot failures. The widget's own useWeather hook handles live data.
// TODO: Accept user's saved city preference from settings and resolve server-side.

export const weatherResolvers: DataResolver[] = [
    {
        key: 'weather.current',
        cachePolicy: { ttlSeconds: 300 },
        async resolve() {
            return { requiresGeolocation: true };
        },
    },
];
