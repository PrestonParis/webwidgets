import { WeatherErrorProps } from '@/features/weather/types/weather';

export function WeatherError({ state, onRetry }: WeatherErrorProps) {
    if (state === 'denied') {
        return (
            <div className="flex flex-col items-center justify-center py-6 gap-3 text-center">
                <span className="text-3xl">📍</span>
                <p className="text-sm text-stone-600 dark:text-zinc-400">
                    Location access is blocked.
                </p>
                <p className="text-xs text-stone-400 dark:text-zinc-600">
                    Enable location in your browser settings, then reload.
                </p>
            </div>
        );
    }

    if (state === 'unsupported') {
        return (
            <p className="text-sm text-center text-stone-400 dark:text-zinc-600 py-6">
                Geolocation not supported by your browser.
            </p>
        );
    }

    return (
        <div className="flex flex-col items-center gap-3 py-6">
            <p className="text-sm text-stone-500 dark:text-zinc-500">
                Failed to load weather.
            </p>
            <button
                onClick={onRetry}
                className="text-xs text-blue-500 hover:text-blue-600 underline"
            >
                Try again
            </button>
        </div>
    );
}
