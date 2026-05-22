'use client';

import type { ReactNode } from 'react';
import { ShieldAlert } from 'lucide-react';
import { useIsAdmin } from '@/features/admin/hooks/useIsAdmin';

interface AdminGateProps {
    children: ReactNode;
    /** When true, renders a visible "Admin only" card instead of null for non-admins. */
    showForbidden?: boolean;
}

export function AdminGate({ children, showForbidden = false }: AdminGateProps) {
    const { isAdmin, loading } = useIsAdmin();

    if (loading) return null;

    if (!isAdmin) {
        if (!showForbidden) return null;
        return (
            <div className="flex flex-col items-center justify-center gap-2 h-full py-6 text-stone-400 dark:text-zinc-600">
                <ShieldAlert size={22} className="opacity-50" />
                <p className="text-xs font-medium">Admin only</p>
            </div>
        );
    }

    return <>{children}</>;
}
