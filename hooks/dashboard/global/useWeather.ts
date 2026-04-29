'use client';

import { useState, useEffect } from 'react';

export interface WeatherData {
    temp: number;
    feelsLike: number;
    weatherCode: number;
    description: string;
    emoji: string;
    windSpeed: number;
    humidity: number;
    city?: string;
}

const WMO: Record<number, { description: string; emoji: string }> = {
    0: { description: 'Clear sky', emoji: '☀️' },
    1: { description: 'Mainly clear', emoji: '🌤️' },
    2: { description: 'Partly cloudy', emoji: '⛅' },
    3: { description: 'Overcast', emoji: '☁️' },
    45: { description: 'Foggy', emoji: '🌫️' },
    48: { description: 'Icy fog', emoji: '🌫️' },
    51: { description: 'Light drizzle', emoji: '🌦️' },
    53: { description: 'Drizzle', emoji: '🌦️' },
    55: { description: 'Heavy drizzle', emoji: '🌧️' },
    61: { description: 'Light rain', emoji: '🌧️' },
    63: { description: 'Rain', emoji: '🌧️' },
    65: { description: 'Heavy rain', emoji: '🌧️' },
    71: { description: 'Light snow', emoji: '🌨️' },
    73: { description: 'Snow', emoji: '❄️' },
    75: { description: 'Heavy snow', emoji: '❄️' },
    77: { description: 'Snow grains', emoji: '🌨️' },
    80: { description: 'Showers', emoji: '🌦️' },
    81: { description: 'Showers', emoji: '🌦️' },
    82: { description: 'Heavy showers', emoji: '⛈️' },
    85: { description: 'Snow showers', emoji: '🌨️' },
    86: { description: 'Heavy snow showers', emoji: '❄️' },
    95: { description: 'Thunderstorm', emoji: '⛈️' },
    96: { description: 'Thunderstorm', emoji: '⛈️' },
    99: { description: 'Thunderstorm', emoji: '⛈️' },
};

const CACHE_KEY = 'weather_cache_v1';
const CACHE_TTL = 3_600_000; // 1 hour

export type WeatherState =
    | 'idle'
    | 'loading'
    | 'denied'
    | 'unsupported'
    | 'error'
    | 'ready';

export function useWeather() {
    const [weather, setWeather] = useState<WeatherData | null>(null);
    const [state, setState] = useState<WeatherState>('idle');

    const fetchWeather = () => {
        if (!navigator.geolocation) {
            setState('unsupported');
            return;
        }
        setState('loading');
        navigator.geolocation.getCurrentPosition(
            async ({ coords }) => {
                try {
                    const { latitude: lat, longitude: lon } = coords;

                    const weatherUrl = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,apparent_temperature,weather_code,wind_speed_10m,relative_humidity_2m&temperature_unit=fahrenheit&wind_speed_unit=mph`;
                    const res = await fetch(weatherUrl);
                    const json = await res.json();
                    const c = json.current;

                    let city: string | undefined;
                    try {
                        const geoRes = await fetch(
                            `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lon}&localityLanguage=en`,
                        );
                        const geo = await geoRes.json();
                        city =
                            geo.city ||
                            geo.locality ||
                            geo.principalSubdivision;
                    } catch {
                        /* city is optional */
                    }

                    const wmo = WMO[c.weather_code] ?? {
                        description: 'Unknown',
                        emoji: '🌡️',
                    };
                    const data: WeatherData = {
                        temp: Math.round(c.temperature_2m),
                        feelsLike: Math.round(c.apparent_temperature),
                        weatherCode: c.weather_code,
                        description: wmo.description,
                        emoji: wmo.emoji,
                        windSpeed: Math.round(c.wind_speed_10m),
                        humidity: Math.round(c.relative_humidity_2m),
                        city,
                    };

                    localStorage.setItem(
                        CACHE_KEY,
                        JSON.stringify({ data, timestamp: Date.now() }),
                    );
                    setWeather(data);
                    setState('ready');
                } catch {
                    setState('error');
                }
            },
            () => setState('denied'),
            { timeout: 10_000 },
        );
    };

    useEffect(() => {
        try {
            const cached = localStorage.getItem(CACHE_KEY);
            if (cached) {
                const { data, timestamp } = JSON.parse(cached);
                if (Date.now() - timestamp < CACHE_TTL) {
                    setWeather(data);
                    setState('ready');
                    return;
                }
            }
        } catch {
            /* stale cache */
        }

        fetchWeather();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    return { weather, state, retry: fetchWeather };
}
