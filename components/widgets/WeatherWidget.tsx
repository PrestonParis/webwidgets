'use client';

import { Cloud } from 'lucide-react';
import WidgetShell from '@/components/widgets/WidgetShell';
import { useWidgetSettings } from '@/hooks/dashboard/useWidgetSettings';
import { useWeather } from '@/hooks/dashboard/global/useWeather';

export default function WeatherWidget() {
    const { settings, updateSettings } = useWidgetSettings(
        'weather',
        'weather',
    );
    const { weather, state, retry } = useWeather();

    return (
        <WidgetShell
            icon={<Cloud size={16} />}
            title="Weather"
            settings={settings}
            onSettingsChange={updateSettings}
        >
            {state === 'loading' && (
                <div className="space-y-3 animate-pulse">
                    <div className="h-16 bg-stone-100 dark:bg-zinc-800 rounded-xl" />
                    <div className="h-8 bg-stone-100 dark:bg-zinc-800 rounded-xl" />
                </div>
            )}

            {state === 'denied' && (
                <div className="flex flex-col items-center justify-center py-6 gap-3 text-center">
                    <span className="text-3xl">📍</span>
                    <p className="text-sm text-stone-600 dark:text-zinc-400">
                        Location access is blocked.
                    </p>
                    <p className="text-xs text-stone-400 dark:text-zinc-600">
                        Enable location in your browser settings, then reload.
                    </p>
                </div>
            )}

            {state === 'unsupported' && (
                <p className="text-sm text-center text-stone-400 dark:text-zinc-600 py-6">
                    Geolocation not supported by your browser.
                </p>
            )}

            {state === 'error' && (
                <div className="flex flex-col items-center gap-3 py-6">
                    <p className="text-sm text-stone-500 dark:text-zinc-500">
                        Failed to load weather.
                    </p>
                    <button
                        onClick={retry}
                        className="text-xs text-blue-500 hover:text-blue-600 underline"
                    >
                        Try again
                    </button>
                </div>
            )}

            {state === 'ready' && weather && (
                <div className="space-y-4">
                    {/* Main temp + condition */}
                    <div className="flex items-center justify-between">
                        <div>
                            <div className="flex items-end gap-2">
                                <span className="text-5xl font-bold text-stone-800 dark:text-zinc-100 tabular-nums leading-none">
                                    {weather.temp}°
                                </span>
                                <span className="text-sm text-stone-500 dark:text-zinc-400 mb-1">
                                    F
                                </span>
                            </div>
                            <p className="text-sm text-stone-500 dark:text-zinc-400 mt-1">
                                {weather.description}
                            </p>
                            {weather.city && (
                                <p className="text-xs text-stone-400 dark:text-zinc-600 mt-0.5">
                                    {weather.city}
                                </p>
                            )}
                        </div>
                        <span
                            className="text-5xl"
                            role="img"
                            aria-label={weather.description}
                        >
                            {weather.emoji}
                        </span>
                    </div>

                    {/* Detail row */}
                    <div className="grid grid-cols-3 gap-2 text-center">
                        <div className="bg-stone-50 dark:bg-zinc-800/60 rounded-xl py-2 px-1">
                            <p className="text-xs text-stone-400 dark:text-zinc-500 mb-0.5">
                                Feels like
                            </p>
                            <p className="text-sm font-semibold text-stone-700 dark:text-zinc-300">
                                {weather.feelsLike}°
                            </p>
                        </div>
                        <div className="bg-stone-50 dark:bg-zinc-800/60 rounded-xl py-2 px-1">
                            <p className="text-xs text-stone-400 dark:text-zinc-500 mb-0.5">
                                Wind
                            </p>
                            <p className="text-sm font-semibold text-stone-700 dark:text-zinc-300">
                                {weather.windSpeed} mph
                            </p>
                        </div>
                        <div className="bg-stone-50 dark:bg-zinc-800/60 rounded-xl py-2 px-1">
                            <p className="text-xs text-stone-400 dark:text-zinc-500 mb-0.5">
                                Humidity
                            </p>
                            <p className="text-sm font-semibold text-stone-700 dark:text-zinc-300">
                                {weather.humidity}%
                            </p>
                        </div>
                    </div>
                </div>
            )}
        </WidgetShell>
    );
}
