import EmailComposerPage from '@/features/inbox/components/EmailComposerPage';
import { AuthGuard } from '@/features/inbox/components/AuthGuard';

export default function Page() {
    return (
        <AuthGuard>
            <EmailComposerPage />
        </AuthGuard>
    );
}
