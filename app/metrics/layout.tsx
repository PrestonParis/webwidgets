import { redirect } from 'next/navigation';
import type { ReactNode } from 'react';
import { createClients } from '@/lib/supabase/serverClient';
import { requireAdminUser } from '@/features/admin/lib/adminPermissions';
import MetricsShell from '@/features/metrics/components/MetricsShell';

export const metadata = { title: 'Metrics — Dashboard' };

export default async function MetricsLayout({
    children,
}: {
    children: ReactNode;
}) {
    const { supabase } = await createClients();
    try {
        await requireAdminUser(supabase);
    } catch {
        redirect('/');
    }
    return <MetricsShell>{children}</MetricsShell>;
}
