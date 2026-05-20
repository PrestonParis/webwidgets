import Header from '@/features/ui/components/Header';
import { PomodoroPage } from '@/features/pomodoro/components/PomodoroPage';

export const metadata = { title: 'Pomodoro Timer' };

export default function Page() {
    return (
        <>
            <Header />
            <PomodoroPage />
        </>
    );
}
