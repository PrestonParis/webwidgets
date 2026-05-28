import { z } from 'zod';

const reverseGeoSchema = z.object({
    city: z.string().optional(),
    locality: z.string().optional(),
    principalSubdivision: z.string().optional(),
});

export const coordsCacheSchema = z.object({
    lat: z.number(),
    lon: z.number(),
    savedAt: z.number().optional(),
});

export const COORDS_KEY = 'weather_coords_v1';
export type WeatherCoords = { lat: number; lon: number };

let lastKnownCoords: WeatherCoords | null = null;
let pendingCoordsRequest: Promise<WeatherCoords> | null = null;

export function readSavedCoords(): WeatherCoords | null {
    if (lastKnownCoords) return lastKnownCoords;
    try {
        const raw = localStorage.getItem(COORDS_KEY);
        if (!raw) return null;
        const parsed = coordsCacheSchema.safeParse(JSON.parse(raw) as unknown);
        if (!parsed.success) return null;
        lastKnownCoords = { lat: parsed.data.lat, lon: parsed.data.lon };
        return lastKnownCoords;
    } catch {
        return null;
    }
}

export function saveCoords(lat: number, lon: number) {
    lastKnownCoords = { lat, lon };
    try {
        localStorage.setItem(
            COORDS_KEY,
            JSON.stringify({ lat, lon, savedAt: Date.now() }),
        );
    } catch {
        /* non-fatal */
    }
}

export function requestCurrentCoords(): Promise<WeatherCoords> {
    if (pendingCoordsRequest) return pendingCoordsRequest;
    pendingCoordsRequest = new Promise<WeatherCoords>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(
            ({ coords }) => {
                const current = { lat: coords.latitude, lon: coords.longitude };
                saveCoords(current.lat, current.lon);
                resolve(current);
            },
            reject,
            { timeout: 10_000 },
        );
    }).finally(() => {
        pendingCoordsRequest = null;
    });
    return pendingCoordsRequest;
}

export async function fetchCityName(
    lat: number,
    lon: number,
): Promise<string | undefined> {
    try {
        const res = await fetch(
            `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lon}&localityLanguage=en`,
        );
        if (!res.ok) return undefined;
        const parsed = reverseGeoSchema.safeParse(
            (await res.json()) as unknown,
        );
        if (!parsed.success) return undefined;
        const { city, locality, principalSubdivision } = parsed.data;
        return city ?? locality ?? principalSubdivision;
    } catch {
        return undefined;
    }
}

const nominatimSchema = z.array(
    z.object({
        display_name: z.string(),
        lat: z.string(),
        lon: z.string(),
    }),
);

export interface LocationResult {
    name: string;
    lat: number;
    lon: number;
}

export async function searchLocation(query: string): Promise<LocationResult[]> {
    try {
        const res = await fetch(
            `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=5`,
            { headers: { 'User-Agent': 'DashboardApp/1.0' } },
        );
        if (!res.ok) return [];
        const parsed = nominatimSchema.safeParse((await res.json()) as unknown);
        if (!parsed.success) return [];
        return parsed.data.map((r) => ({
            name: r.display_name.split(',').slice(0, 3).join(', '),
            lat: parseFloat(r.lat),
            lon: parseFloat(r.lon),
        }));
    } catch {
        return [];
    }
}
