'use client';

import { useAuth } from '@/features/auth/hooks/useAuth';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export function AuthGuard({ children }: { children: React.ReactNode }) {
    const { user, status } = useAuth();
    const router = useRouter();

    useEffect(() => {
        if (status !== 'loading' && !user) {
            router.replace('/');
        }
    }, [router, status, user]);

    if (status === 'loading') {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="animate-pulse text-gray-400">
                    Loading session...
                </div>
            </div>
        );
    }

    if (!user) return null;

    return <>{children}</>;
}
