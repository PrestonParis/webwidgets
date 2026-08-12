'use client';

import { type ReactNode, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useEntertainmentAccess } from '@/features/entertainment/hooks/useEntertainmentAccess';

/** Blocks direct navigation to entertainment pages while they're in beta. */
export function EntertainmentGate({ children }: { children: ReactNode }) {
    const { hasAccess, loading } = useEntertainmentAccess();
    const router = useRouter();

    useEffect(() => {
        if (!loading && !hasAccess) router.replace('/');
    }, [loading, hasAccess, router]);

    if (loading || !hasAccess) return null;
    return <>{children}</>;
}
