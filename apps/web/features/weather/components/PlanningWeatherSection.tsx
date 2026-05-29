'use client';

import { useState } from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { useWeather } from '@/features/weather/hooks/useWeather';
import { WeatherForecastStrip } from './WeatherForecastStrip';
import { WeatherLocationPicker } from './WeatherLocationPicker';
import { WeatherError } from './WeatherError';

function tempColorClass(temp: number): string {
    if (temp >= 90) return 'text-orange-500 dark:text-orange-400';
    if (temp >= 78) return 'text-amber-500 dark:text-amber-400';
    if (temp >= 58) return 'text-emerald-500 dark:text-emerald-400';
    if (temp >= 38) return 'text-sky-500 dark:text-sky-400';
    return 'text-indigo-500 dark:text-indigo-400';
}

export function PlanningWeatherSection() {
    const {
        weather,
        forecast,
        state,
        retry,
        locationName,
        setCustomLocation,
        clearCustomLocation,
    } = useWeather();
    const [forecastOpen, setForecastOpen] = useState(false);

    const hasCustomLocation =
        typeof window !== 'undefined' &&
        !!localStorage.getItem('weather_custom_location_v1');

    if (state === 'loading') {
        return (
            <div className="px-4 py-3 border-b border-zinc-100 dark:border-zinc-800">
                <div className="h-4 w-24 rounded bg-zinc-100 dark:bg-zinc-800 animate-pulse mb-1" />
                <div className="h-3 w-16 rounded bg-zinc-100 dark:bg-zinc-800 animate-pulse" />
            </div>
        );
    }

    if (['denied', 'unsupported', 'error'].includes(state) || !weather) {
        return (
            <div className="px-4 py-2 border-b border-zinc-100 dark:border-zinc-800">
                <WeatherError
                    state={state as 'denied' | 'unsupported' | 'error'}
                    onRetry={retry}
                />
            </div>
        );
    }

    const tempColor = tempColorClass(weather.temp);

    return (
        <div className="border-b border-zinc-100 dark:border-zinc-800">
            <div className="px-4 py-3 space-y-2">
                {/* Current conditions row */}
                <div className="flex items-center gap-2">
                    <span
                        className="text-2xl leading-none select-none"
                        role="img"
                        aria-label={weather.description}
                    >
                        {weather.emoji}
                    </span>
                    <div className="flex-1 min-w-0">
                        <div className="flex items-baseline gap-0.5">
                            <span
                                className={`text-xl font-black tabular-nums leading-none ${tempColor}`}
                            >
                                {weather.temp}°
                            </span>
                            <span className="text-[9px] text-zinc-400 self-end mb-0.5">
                                F
                            </span>
                        </div>
                        <p className="text-[10px] text-zinc-500 dark:text-zinc-400 leading-none mt-0.5 truncate">
                            {weather.description} · {weather.feelsLike}° feels
                        </p>
                    </div>
                    <button
                        onClick={() => setForecastOpen((o) => !o)}
                        className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 transition-colors"
                        aria-label={
                            forecastOpen ? 'Hide forecast' : 'Show forecast'
                        }
                    >
                        {forecastOpen ? (
                            <ChevronDown size={12} />
                        ) : (
                            <ChevronRight size={12} />
                        )}
                    </button>
                </div>

                {/* Location picker */}
                <WeatherLocationPicker
                    locationName={locationName}
                    onSelect={setCustomLocation}
                    onClear={clearCustomLocation}
                    hasCustom={hasCustomLocation}
                />

                {/* Forecast strip */}
                {forecastOpen && forecast.length > 0 && (
                    <WeatherForecastStrip days={forecast} />
                )}
            </div>
        </div>
    );
}
