import Header from '@/features/ui/components/Header';
import { PlanningPage } from '@/features/planning/components/PlanningPage';

export const metadata = { title: 'Planning' };

export default function Page() {
    return (
        <>
            <Header />
            <PlanningPage />
        </>
    );
}
