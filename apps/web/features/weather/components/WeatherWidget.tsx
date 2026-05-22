'use client';

import { Cloud } from 'lucide-react';
import WidgetShell from '@/features/widgets/components/WidgetShell';
import { useWidgetSettings } from '@/features/widgets/hooks/useWidgetSettings';
import { useWeather } from '@/features/weather/hooks/useWeather';
import { WeatherSkeleton } from '@/features/weather/components/WeatherSkeleton';
import { WeatherError } from '@/features/weather/components/WeatherError';
import { WeatherDisplay } from '@/features/weather/components/WeatherDisplay';

export default function WeatherWidget({
    widgetId = 'weather',
}: {
    widgetId?: string;
}) {
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
            widgetId={widgetId}
            widgetType="weather"
            footerHref="/weather"
            footerLabel="Open weather →"
        >
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
        </WidgetShell>
    );
}
