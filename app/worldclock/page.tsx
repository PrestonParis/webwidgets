import Header from '@/features/ui/components/Header';
import { WorldClockPage } from '@/features/worldclock/components/WorldClockPage';

export const metadata = { title: 'World Clock' };

export default function Page() {
    return (
        <>
            <Header />
            <WorldClockPage />
        </>
    );
}
