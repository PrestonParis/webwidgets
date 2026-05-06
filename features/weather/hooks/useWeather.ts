'use client';

import { useState, useEffect, useCallback } from 'react';
import { WMO, CACHE_KEY, CACHE_TTL } from '../constants';
import { WeatherData, WeatherState } from '@/features/weather/types/weather';
import { z } from 'zod';

const weatherApiSchema = z.object({
    current: z.object({
        temperature_2m: z.number(),
        apparent_temperature: z.number(),
        weather_code: z.number(),
        wind_speed_10m: z.number(),
        relative_humidity_2m: z.number(),
    }),
});

const reverseGeoSchema = z.object({
    city: z.string().optional(),
    locality: z.string().optional(),
    principalSubdivision: z.string().optional(),
});

const weatherCacheSchema = z.object({
    data: z.object({
        temp: z.number(),
        feelsLike: z.number(),
        weatherCode: z.number(),
        description: z.string(),
        emoji: z.string(),
        windSpeed: z.number(),
        humidity: z.number(),
        city: z.string().optional(),
    }),
    timestamp: z.number(),
});

function readWeatherCache(): WeatherData | null {
    try {
        const cached = localStorage.getItem(CACHE_KEY);
        if (!cached) return null;
        const parsed = weatherCacheSchema.safeParse(
            JSON.parse(cached) as unknown,
        );
        if (!parsed.success) return null;
        const { data, timestamp } = parsed.data;
        if (Date.now() - timestamp >= CACHE_TTL) return null;
        // Convert cached data to WeatherData, handling optional city properly
        const weatherData: WeatherData = {
            temp: data.temp,
            feelsLike: data.feelsLike,
            weatherCode: data.weatherCode,
            description: data.description,
            emoji: data.emoji,
            windSpeed: data.windSpeed,
            humidity: data.humidity,
            ...(data.city !== undefined ? { city: data.city } : {}),
        };
        return weatherData;
    } catch {
        return null;
    }
}

async function fetchCityName(
    lat: number,
    lon: number,
): Promise<string | undefined> {
    try {
        const res = await fetch(
            `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lon}&localityLanguage=en`,
        );
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

async function fetchWeatherData(
    lat: number,
    lon: number,
): Promise<WeatherData> {
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,apparent_temperature,weather_code,wind_speed_10m,relative_humidity_2m&temperature_unit=fahrenheit&wind_speed_unit=mph`;
    const parsed = weatherApiSchema.safeParse(
        (await (await fetch(url)).json()) as unknown,
    );
    if (!parsed.success) throw new Error('Invalid weather API payload');
    const c = parsed.data.current;
    const wmo = WMO[c.weather_code] ?? { description: 'Unknown', emoji: '🌡️' };
    const cityName = await fetchCityName(lat, lon);
    const weatherData: WeatherData = {
        temp: Math.round(c.temperature_2m),
        feelsLike: Math.round(c.apparent_temperature),
        weatherCode: c.weather_code,
        description: wmo.description,
        emoji: wmo.emoji,
        windSpeed: Math.round(c.wind_speed_10m),
        humidity: Math.round(c.relative_humidity_2m),
        ...(cityName !== undefined ? { city: cityName } : {}),
    };
    return weatherData;
}

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
            ({ coords }) => {
                void fetchWeatherData(coords.latitude, coords.longitude)
                    .then((data) => {
                        localStorage.setItem(
                            CACHE_KEY,
                            JSON.stringify({ data, timestamp: Date.now() }),
                        );
                        setWeather(data);
                        setState('ready');
                    })
                    .catch(() => setState('error'));
            },
            () => setState('denied'),
            { timeout: 10_000 },
        );
    }, []);

    useEffect(() => {
        let isMounted = true;
        void Promise.resolve().then(() => {
            const cached = readWeatherCache();
            if (cached && isMounted) {
                setWeather(cached);
                setState('ready');
            } else if (isMounted) {
                fetchWeather();
            }
        });
        return () => {
            isMounted = false;
        };
    }, [fetchWeather]);

    return { weather, state, retry: fetchWeather };
}
