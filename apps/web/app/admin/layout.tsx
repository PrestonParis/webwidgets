import { redirect } from 'next/navigation';
import type { ReactNode } from 'react';
import { createClients } from '@/lib/supabase/serverClient';
import { requireAdminUser } from '@/features/admin/lib/adminPermissions';
import AdminShell from '@/features/admin/components/AdminShell';

export const metadata = { title: 'Admin | Dashboard' };

export default async function AdminLayout({
    children,
}: {
    children: ReactNode;
}) {
    const { supabase } = await createClients();

    let role: string = 'viewer';
    try {
        const adminUser = await requireAdminUser(supabase);
        role = adminUser.role;
    } catch {
        redirect('/');
    }

    return <AdminShell role={role}>{children}</AdminShell>;
}
