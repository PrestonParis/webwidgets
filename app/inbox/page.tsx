'use client';
import Header from '@/features/ui/components/Header';
import Emails from '@/features/inbox/components/Emails';
import { AuthGuard } from '@/features/inbox/components/AuthGuard';

export default function Page() {
    return (
        <AuthGuard>
            <Header />
            <Emails />
        </AuthGuard>
    );
}
