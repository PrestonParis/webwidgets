import type {
    WeatherData,
    WeatherDisplayProps,
} from '@/features/weather/types/weather';

function getContextHint(w: WeatherData): string {
    const { temp, feelsLike, weatherCode, windSpeed } = w;
    if (weatherCode >= 95) return 'Thunderstorm — stay indoors if possible';
    if (weatherCode >= 80) return 'Showers expected — umbrella recommended';
    if (weatherCode >= 71) return 'Snow — layer up and drive carefully';
    if (weatherCode >= 61) return 'Rain today — bring an umbrella';
    if (weatherCode >= 51) return 'Light drizzle — jacket recommended';
    if (temp >= 95) return 'Extreme heat — stay hydrated and cool';
    if (temp >= 85) return 'Hot out — light clothing and water';
    if (temp < 32) return 'Below freezing — heavy coat and gloves';
    if (temp < 45) return 'Cold — dress in layers';
    if (feelsLike <= temp - 8)
        return `Feels ${temp - feelsLike}° colder — wind chill`;
    if (windSpeed > 25) return 'Windy — hold on to your hat';
    if (temp >= 65 && temp <= 80 && weatherCode <= 3)
        return 'Great day for outdoor activity';
    if (weatherCode <= 1) return 'Clear skies — enjoy the sunshine';
    return 'Comfortable conditions outside';
}

function tempColorClass(temp: number): string {
    if (temp >= 90) return 'text-orange-500 dark:text-orange-400';
    if (temp >= 78) return 'text-amber-500 dark:text-amber-400';
    if (temp >= 58) return 'text-emerald-500 dark:text-emerald-400';
    if (temp >= 38) return 'text-sky-500 dark:text-sky-400';
    return 'text-indigo-500 dark:text-indigo-400';
}

export function WeatherDisplay({ weather }: WeatherDisplayProps) {
    const hint = getContextHint(weather);
    const tempColor = tempColorClass(weather.temp);

    return (
        <div className="space-y-3">
            {/* Hero cluster — emoji + temp + condition + city unified */}
            <div className="flex items-start gap-3">
                <span
                    className="text-[40px] leading-none mt-0.5 select-none"
                    role="img"
                    aria-label={weather.description}
                >
                    {weather.emoji}
                </span>
                <div className="min-w-0 flex-1">
                    <div className="flex items-baseline gap-1">
                        <span
                            className={`text-[40px] font-black tabular-nums leading-none ${tempColor}`}
                        >
                            {weather.temp}°
                        </span>
                        <span className="text-xs font-semibold text-zinc-400 dark:text-zinc-500 mb-1 self-end">
                            F
                        </span>
                    </div>
                    <p className="text-xs font-semibold text-zinc-600 dark:text-zinc-300 leading-snug mt-0.5">
                        {weather.description}
                    </p>
                    {weather.city && (
                        <p className="text-[10px] text-zinc-400 dark:text-zinc-500 mt-0.5 truncate">
                            {weather.city}
                        </p>
                    )}
                </div>
            </div>

            {/* Context hint — environmental callout */}
            <div className="px-2.5 py-2 rounded-lg bg-zinc-50 dark:bg-zinc-800/70 border border-zinc-100 dark:border-zinc-700/60">
                <p className="text-[11px] font-medium text-zinc-600 dark:text-zinc-300 leading-snug">
                    {hint}
                </p>
            </div>

            {/* Stats — thin separator row, no individual boxes */}
            <div className="flex items-stretch border-t border-zinc-100 dark:border-zinc-800 pt-2.5">
                <div className="flex-1 text-center">
                    <p className="text-sm font-bold text-zinc-700 dark:text-zinc-200 tabular-nums">
                        {weather.feelsLike}°
                    </p>
                    <p className="text-[10px] text-zinc-400 dark:text-zinc-500 mt-0.5">
                        Feels like
                    </p>
                </div>
                <div className="w-px bg-zinc-100 dark:bg-zinc-800 mx-1" />
                <div className="flex-1 text-center">
                    <p className="text-sm font-bold text-zinc-700 dark:text-zinc-200 tabular-nums">
                        {weather.windSpeed}
                        <span className="text-[10px] font-normal text-zinc-400 ml-0.5">
                            mph
                        </span>
                    </p>
                    <p className="text-[10px] text-zinc-400 dark:text-zinc-500 mt-0.5">
                        Wind
                    </p>
                </div>
                <div className="w-px bg-zinc-100 dark:bg-zinc-800 mx-1" />
                <div className="flex-1 text-center">
                    <p className="text-sm font-bold text-zinc-700 dark:text-zinc-200 tabular-nums">
                        {weather.humidity}
                        <span className="text-[10px] font-normal text-zinc-400 ml-0.5">
                            %
                        </span>
                    </p>
                    <p className="text-[10px] text-zinc-400 dark:text-zinc-500 mt-0.5">
                        Humidity
                    </p>
                </div>
            </div>
        </div>
    );
}
