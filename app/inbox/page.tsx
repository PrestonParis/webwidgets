'use client';
import Header from '@/components/global/Header';
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
