import { WeatherDisplayProps } from '@/types/weather';

export function WeatherDisplay({ weather }: WeatherDisplayProps) {
    return (
        <div className="space-y-4">
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

            <div className="grid grid-cols-3 gap-2 text-center">
                {[
                    { label: 'Feels like', value: `${weather.feelsLike}°` },
                    { label: 'Wind', value: `${weather.windSpeed} mph` },
                    { label: 'Humidity', value: `${weather.humidity}%` },
                ].map(({ label, value }) => (
                    <div
                        key={label}
                        className="bg-stone-50 dark:bg-zinc-800/60 rounded-xl py-2 px-1"
                    >
                        <p className="text-xs text-stone-400 dark:text-zinc-500 mb-0.5">
                            {label}
                        </p>
                        <p className="text-sm font-semibold text-stone-700 dark:text-zinc-300">
                            {value}
                        </p>
                    </div>
                ))}
            </div>
        </div>
    );
}
