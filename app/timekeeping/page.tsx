import Header from '@/features/ui/components/Header';
import { TimekeepingPage } from '@/features/timekeeping/components/TimekeepingPage';

export const metadata = { title: 'Timekeeping' };

export default function Page() {
    return (
        <>
            <Header />
            <TimekeepingPage />
        </>
    );
}
