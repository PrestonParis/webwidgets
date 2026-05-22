import Header from '@/features/ui/components/Header';
import { MoodPage } from '@/features/mood/components/MoodPage';

export const metadata = { title: 'Mood' };

export default function Page() {
    return (
        <>
            <Header />
            <MoodPage />
        </>
    );
}
