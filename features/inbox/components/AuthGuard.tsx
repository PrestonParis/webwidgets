'use client';

import { useAuth } from '@/hooks/auth/useAuth';
import { useEffect } from 'react';

export function AuthGuard({ children }: { children: React.ReactNode }) {
    const { user, status, signInWithGoogle } = useAuth();

    useEffect(() => {
        if (status !== 'loading' && !user) {
            signInWithGoogle();
        }
    });

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
