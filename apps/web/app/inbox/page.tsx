'use client';
import Link from 'next/link';
import Header from '@/features/ui/components/Header';
import Emails from '@/features/inbox/components/Emails';
import { AuthGuard } from '@/features/inbox/components/AuthGuard';

export default function Page() {
    return (
        <AuthGuard>
            <Header />
            <div className="mx-auto max-w-7xl px-4 py-3">
                <Link
                    href="/inbox/compose"
                    className="text-sm font-medium text-blue-600 dark:text-blue-400"
                >
                    Compose with Gmail
                </Link>
            </div>
            <Emails />
        </AuthGuard>
    );
}
