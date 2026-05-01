export interface WeatherData {
    temp: number;
    feelsLike: number;
    weatherCode: number;
    description: string;
    emoji: string;
    windSpeed: number;
    humidity: number;
    city?: string;
}

export type WeatherState =
    | 'idle'
    | 'loading'
    | 'denied'
    | 'unsupported'
    | 'error'
    | 'ready';

export interface WeatherErrorProps {
    state: 'denied' | 'unsupported' | 'error';
    onRetry?: () => void;
}

export interface WeatherDisplayProps {
    weather: WeatherData;
}
