import Header from '@/features/ui/components/Header';
import { HabitPage } from '@/features/habit/components/HabitPage';

export const metadata = { title: 'All Logging' };

export default function Page() {
    return (
        <>
            <Header />
            <HabitPage />
        </>
    );
}
