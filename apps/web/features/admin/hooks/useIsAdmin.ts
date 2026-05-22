'use client';

import { useAuth } from '@/features/auth/hooks/useAuth';

const OWNER_EMAIL = 'prestonparis2005@gmail.com';

export function useIsAdmin(): { isAdmin: boolean; loading: boolean } {
    const { isAdmin, loading, user } = useAuth();
    const isOwner = user?.email === OWNER_EMAIL;
    return { isAdmin: isAdmin || isOwner, loading };
}
