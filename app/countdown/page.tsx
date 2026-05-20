import Header from '@/features/ui/components/Header';
import { CountdownPage } from '@/features/countdown/components/CountdownPage';

export const metadata = { title: 'Countdowns' };

export default function Page() {
    return (
        <>
            <Header />
            <CountdownPage />
        </>
    );
}
