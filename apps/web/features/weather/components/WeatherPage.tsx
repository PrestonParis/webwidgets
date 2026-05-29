'use client';

import { Cloud } from 'lucide-react';
import { useWeather } from '@/features/weather/hooks/useWeather';
import { WeatherSkeleton } from '@/features/weather/components/WeatherSkeleton';
import { WeatherError } from '@/features/weather/components/WeatherError';
import { WeatherDisplay } from '@/features/weather/components/WeatherDisplay';

export function WeatherPage() {
    const { weather, state, retry } = useWeather();

    return (
        <main className="max-w-2xl mx-auto px-6 py-8 lg:px-12">
            <div className="flex items-center gap-3 mb-8">
                <Cloud size={22} className="text-sky-500" />
                <h1 className="text-2xl font-bold text-stone-900 dark:text-zinc-100">
                    Weather
                </h1>
            </div>

            <div className="bg-white dark:bg-zinc-900 rounded-3xl border border-stone-100 dark:border-zinc-800 p-8">
                {state === 'loading' && <WeatherSkeleton />}
                {state === 'ready' && weather && (
                    <WeatherDisplay weather={weather} />
                )}
                {['denied', 'unsupported', 'error'].includes(state) && (
                    <WeatherError
                        state={state as 'denied' | 'unsupported' | 'error'}
                        onRetry={retry}
                    />
                )}
            </div>
        </main>
    );
}
