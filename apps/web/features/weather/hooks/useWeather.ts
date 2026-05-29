'use client';

import { useState, useEffect, useCallback } from 'react';
import { z } from 'zod';
import { WMO, CACHE_KEY, CACHE_TTL } from '../constants';
import type {
    WeatherData,
    WeatherState,
    ForecastDay,
} from '@/features/weather/types/weather';
import {
    readSavedCoords,
    saveCoords,
    requestCurrentCoords,
    fetchCityName,
    type WeatherCoords,
} from '@/features/weather/lib/geocoding';

const CUSTOM_LOCATION_KEY = 'weather_custom_location_v1';

const weatherApiSchema = z.object({
    current: z.object({
        temperature_2m: z.number(),
        apparent_temperature: z.number(),
        weather_code: z.number(),
        wind_speed_10m: z.number(),
        relative_humidity_2m: z.number(),
    }),
    daily: z
        .object({
            time: z.array(z.string()),
            temperature_2m_max: z.array(z.number()),
            temperature_2m_min: z.array(z.number()),
            precipitation_probability_max: z.array(z.number()),
            weather_code: z.array(z.number()),
        })
        .optional(),
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

const customLocationSchema = z.object({
    name: z.string(),
    lat: z.number(),
    lon: z.number(),
});

function readCustomLocation(): {
    name: string;
    lat: number;
    lon: number;
} | null {
    try {
        const raw = localStorage.getItem(CUSTOM_LOCATION_KEY);
        if (!raw) return null;
        const parsed = customLocationSchema.safeParse(
            JSON.parse(raw) as unknown,
        );
        return parsed.success ? parsed.data : null;
    } catch {
        return null;
    }
}

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
        return {
            temp: data.temp,
            feelsLike: data.feelsLike,
            weatherCode: data.weatherCode,
            description: data.description,
            emoji: data.emoji,
            windSpeed: data.windSpeed,
            humidity: data.humidity,
            ...(data.city !== undefined ? { city: data.city } : {}),
        };
    } catch {
        return null;
    }
}

function parseForecast(
    daily: z.infer<typeof weatherApiSchema>['daily'],
): ForecastDay[] {
    if (!daily) return [];
    const today = new Date().toISOString().slice(0, 10);
    return daily.time.map((date, i) => {
        const code = daily.weather_code[i] ?? 0;
        const wmo = WMO[code] ?? { description: 'Unknown', emoji: '🌡️' };
        return {
            date,
            weatherCode: code,
            emoji: wmo.emoji,
            description: wmo.description,
            tempMax: Math.round(daily.temperature_2m_max[i] ?? 0),
            tempMin: Math.round(daily.temperature_2m_min[i] ?? 0),
            precipProbability: Math.round(
                daily.precipitation_probability_max[i] ?? 0,
            ),
            isToday: date === today,
            isPast: date < today,
        };
    });
}

async function fetchWeatherData(
    lat: number,
    lon: number,
): Promise<{ weather: WeatherData; forecast: ForecastDay[] }> {
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,apparent_temperature,weather_code,wind_speed_10m,relative_humidity_2m&daily=temperature_2m_max,temperature_2m_min,precipitation_probability_max,weather_code&temperature_unit=fahrenheit&wind_speed_unit=mph&past_days=2&forecast_days=7`;
    const res = await fetch(url);
    if (!res.ok) throw new Error(`Weather API HTTP ${res.status}`);
    const parsed = weatherApiSchema.safeParse((await res.json()) as unknown);
    if (!parsed.success) throw new Error('Invalid weather API payload');
    const c = parsed.data.current;
    const wmo = WMO[c.weather_code] ?? { description: 'Unknown', emoji: '🌡️' };
    const cityName = await fetchCityName(lat, lon);
    const weather: WeatherData = {
        temp: Math.round(c.temperature_2m),
        feelsLike: Math.round(c.apparent_temperature),
        weatherCode: c.weather_code,
        description: wmo.description,
        emoji: wmo.emoji,
        windSpeed: Math.round(c.wind_speed_10m),
        humidity: Math.round(c.relative_humidity_2m),
        ...(cityName !== undefined ? { city: cityName } : {}),
    };
    return { weather, forecast: parseForecast(parsed.data.daily) };
}

function loadAndSet(
    lat: number,
    lon: number,
    setWeather: (d: WeatherData) => void,
    setForecast: (f: ForecastDay[]) => void,
    setState: (s: WeatherState) => void,
) {
    void fetchWeatherData(lat, lon)
        .then(({ weather, forecast }) => {
            try {
                localStorage.setItem(
                    CACHE_KEY,
                    JSON.stringify({ data: weather, timestamp: Date.now() }),
                );
            } catch {
                /* non-fatal */
            }
            setWeather(weather);
            setForecast(forecast);
            setState('ready');
        })
        .catch(() => setState('error'));
}

export function useWeather() {
    const [weather, setWeather] = useState<WeatherData | null>(null);
    const [forecast, setForecast] = useState<ForecastDay[]>([]);
    const [state, setState] = useState<WeatherState>('idle');
    const [customLocation, setCustomLocationState] = useState<{
        name: string;
        lat: number;
        lon: number;
    } | null>(null);

    const fetchWeather = useCallback((coords?: WeatherCoords) => {
        setState('loading');
        const custom = readCustomLocation();
        if (custom) {
            setCustomLocationState(custom);
            loadAndSet(
                custom.lat,
                custom.lon,
                setWeather,
                setForecast,
                setState,
            );
            return;
        }
        if (coords) {
            loadAndSet(
                coords.lat,
                coords.lon,
                setWeather,
                setForecast,
                setState,
            );
            return;
        }
        const saved = readSavedCoords();
        if (saved) {
            loadAndSet(saved.lat, saved.lon, setWeather, setForecast, setState);
            return;
        }
        if (!navigator.geolocation) {
            setState('unsupported');
            return;
        }
        void requestCurrentCoords()
            .then((c) =>
                loadAndSet(c.lat, c.lon, setWeather, setForecast, setState),
            )
            .catch(() => setState('denied'));
    }, []);

    const setCustomLocation = useCallback(
        (name: string, lat: number, lon: number) => {
            try {
                localStorage.setItem(
                    CUSTOM_LOCATION_KEY,
                    JSON.stringify({ name, lat, lon }),
                );
                saveCoords(lat, lon);
            } catch {
                /* non-fatal */
            }
            setCustomLocationState({ name, lat, lon });
            loadAndSet(lat, lon, setWeather, setForecast, setState);
        },
        [],
    );

    const clearCustomLocation = useCallback(() => {
        try {
            localStorage.removeItem(CUSTOM_LOCATION_KEY);
        } catch {
            /* non-fatal */
        }
        setCustomLocationState(null);
        fetchWeather();
    }, [fetchWeather]);

    useEffect(() => {
        let isMounted = true;
        void Promise.resolve().then(() => {
            const cached = readWeatherCache();
            if (cached && isMounted) {
                setWeather(cached);
                setState('ready');
                const custom = readCustomLocation();
                if (custom) setCustomLocationState(custom);
            } else if (isMounted) {
                fetchWeather();
            }
        });
        return () => {
            isMounted = false;
        };
    }, [fetchWeather]);

    const locationName = customLocation?.name ?? weather?.city;

    return {
        weather,
        forecast,
        state,
        retry: fetchWeather,
        locationName,
        setCustomLocation,
        clearCustomLocation,
    };
}
