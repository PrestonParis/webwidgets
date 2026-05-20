'use client';

import type { ReactNode } from 'react';
import { AdminSidebar } from './AdminSidebar';

interface AdminShellProps {
    children: ReactNode;
    role: string;
}

export default function AdminShell({ children, role }: AdminShellProps) {
    return (
        <div className="flex h-screen overflow-hidden bg-gray-50 dark:bg-zinc-950">
            <AdminSidebar role={role} />
            <div className="flex-1 flex flex-col overflow-hidden">
                <main className="flex-1 overflow-y-auto p-6">{children}</main>
            </div>
        </div>
    );
}
