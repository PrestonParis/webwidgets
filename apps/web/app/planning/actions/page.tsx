import { CalendarActionPage } from '@/features/calendar/components/CalendarActionPage';
import { AuthGuard } from '@/features/inbox/components/AuthGuard';
export default function Page() {
    return (
        <AuthGuard>
            <CalendarActionPage />
        </AuthGuard>
    );
}
