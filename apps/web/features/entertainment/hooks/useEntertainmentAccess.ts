'use client';

import { useEffect, useState } from 'react';
import { useIsAdmin } from '@/features/admin/hooks/useIsAdmin';

/**
 * Entertainment (chess, memorization, news, reading, creative) is in beta.
 * Admins always have access; everyone else depends on the `entertainment_beta`
 * feature flag, checked via /api/entertainment/access.
 */
export function useEntertainmentAccess(): {
    hasAccess: boolean;
    loading: boolean;
} {
    const { isAdmin, loading: adminLoading } = useIsAdmin();
    const [flagEnabled, setFlagEnabled] = useState(false);
    const [flagLoading, setFlagLoading] = useState(true);

    useEffect(() => {
        if (adminLoading || isAdmin) return;
        let cancelled = false;
        fetch('/api/entertainment/access')
            .then((res) => (res.ok ? res.json() : { hasAccess: false }))
            .then((data: { hasAccess?: boolean }) => {
                if (!cancelled) setFlagEnabled(!!data.hasAccess);
            })
            .catch(() => {
                if (!cancelled) setFlagEnabled(false);
            })
            .finally(() => {
                if (!cancelled) setFlagLoading(false);
            });
        return () => {
            cancelled = true;
        };
    }, [isAdmin, adminLoading]);

    return {
        hasAccess: isAdmin || flagEnabled,
        loading: adminLoading || (!isAdmin && flagLoading),
    };
}
