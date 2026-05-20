import Header from '@/features/ui/components/Header';
import { WeatherPage } from '@/features/weather/components/WeatherPage';

export const metadata = { title: 'Weather' };

export default function Page() {
    return (
        <>
            <Header />
            <WeatherPage />
        </>
    );
}
