'use client';

import { useState, useEffect, useCallback } from 'react';
import { WMO, CACHE_KEY, CACHE_TTL } from '../constants';
import { WeatherData, WeatherState } from '@/types/weather';

export function useWeather() {
    const [weather, setWeather] = useState<WeatherData | null>(null);
    const [state, setState] = useState<WeatherState>('idle');

    const fetchWeather = useCallback(() => {
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
    }, []); // Empty dependency array since this function doesn't depend on any props/state

    useEffect(() => {
        let isMounted = true;

        const checkCache = () => {
            try {
                const cached = localStorage.getItem(CACHE_KEY);
                if (cached) {
                    const { data, timestamp } = JSON.parse(cached);
                    if (Date.now() - timestamp < CACHE_TTL) {
                        if (isMounted) {
                            setWeather(data);
                            setState('ready');
                        }
                        return true; // Cache hit
                    }
                }
            } catch {
                /* stale cache */
            }
            return false; // Cache miss
        };

        // Defer the cache check to avoid synchronous setState
        Promise.resolve().then(() => {
            if (!checkCache() && isMounted) {
                fetchWeather();
            }
        });

        return () => {
            isMounted = false;
        };
    }, [fetchWeather]); // Now fetchWeather is stable, effect only runs once

    return { weather, state, retry: fetchWeather };
}
