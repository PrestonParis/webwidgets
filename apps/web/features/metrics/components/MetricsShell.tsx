'use client';

import type { ReactNode } from 'react';
import { MetricsSidebar } from './MetricsSidebar';
import { MetricsFilterBar } from './MetricsFilterBar';

interface MetricsShellProps {
    children: ReactNode;
}

export default function MetricsShell({ children }: MetricsShellProps) {
    return (
        <div className="flex h-screen overflow-hidden bg-gray-50 dark:bg-zinc-950">
            <MetricsSidebar />
            <div className="flex-1 flex flex-col overflow-hidden min-w-0">
                <header className="h-14 shrink-0 border-b border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 flex items-center gap-3 px-4 overflow-x-auto">
                    <MetricsFilterBar />
                </header>
                <main className="flex-1 overflow-y-auto p-6">{children}</main>
            </div>
        </div>
    );
}
