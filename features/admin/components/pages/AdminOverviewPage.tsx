'use client';

import { Users, ScrollText, Flag, Server } from 'lucide-react';
import { AdminMetricCard } from '../AdminMetricCard';
import { AdminPageHeader } from '../AdminPageHeader';
import { AdminStatusBadge } from '../AdminStatusBadge';
import { useAdminFetch } from '@/features/admin/hooks/useAdminData';

interface OverviewData {
    stats: { users: number; auditLogs: number; flags: number; jobs: number };
    recentAudit: Array<{
        id: string;
        action: string;
        resource_type: string;
        created_at: string;
    }>;
    activeFlags: Array<{ id: string; key: string; enabled: boolean }>;
}

function timeAgo(iso: string): string {
    const secs = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
    if (secs < 60) return 'just now';
    if (secs < 3600) return `${Math.floor(secs / 60)}m ago`;
    if (secs < 86400) return `${Math.floor(secs / 3600)}h ago`;
    return `${Math.floor(secs / 86400)}d ago`;
}

export function AdminOverviewPage() {
    const { data, loading } = useAdminFetch<OverviewData>(
        '/api/admin/overview',
    );

    const stats = data?.stats;
    const recentAudit = data?.recentAudit ?? [];
    const activeFlags = data?.activeFlags ?? [];

    return (
        <div className="space-y-6">
            <AdminPageHeader
                title="Overview"
                description="System health and key metrics at a glance"
            />

            <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
                <AdminMetricCard
                    label="Total Users"
                    value={loading ? '…' : (stats?.users ?? 0)}
                    icon={Users}
                    color="indigo"
                />
                <AdminMetricCard
                    label="Audit Events"
                    value={loading ? '…' : (stats?.auditLogs ?? 0)}
                    icon={ScrollText}
                    color="blue"
                />
                <AdminMetricCard
                    label="Feature Flags"
                    value={loading ? '…' : (stats?.flags ?? 0)}
                    icon={Flag}
                    color="purple"
                />
                <AdminMetricCard
                    label="Jobs"
                    value={loading ? '…' : (stats?.jobs ?? 0)}
                    icon={Server}
                    color="green"
                />
            </div>

            <div className="grid xl:grid-cols-2 gap-6">
                <div className="bg-white dark:bg-zinc-900 rounded-xl border border-gray-200 dark:border-zinc-800 p-4">
                    <h2 className="text-sm font-semibold text-gray-700 dark:text-zinc-300 mb-3">
                        Recent Audit Events
                    </h2>
                    {recentAudit.length === 0 ? (
                        <p className="text-sm text-gray-400 dark:text-zinc-600">
                            No events yet.
                        </p>
                    ) : (
                        <div className="space-y-2">
                            {recentAudit.map((log) => (
                                <div
                                    key={log.id}
                                    className="flex items-center justify-between gap-2 text-sm"
                                >
                                    <div className="flex items-center gap-2 min-w-0">
                                        <AdminStatusBadge
                                            status={log.resource_type}
                                        />
                                        <span className="truncate text-gray-700 dark:text-zinc-300">
                                            {log.action.replace(/_/g, ' ')}
                                        </span>
                                    </div>
                                    <span className="text-xs text-gray-400 dark:text-zinc-600 shrink-0">
                                        {timeAgo(log.created_at)}
                                    </span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                <div className="bg-white dark:bg-zinc-900 rounded-xl border border-gray-200 dark:border-zinc-800 p-4">
                    <h2 className="text-sm font-semibold text-gray-700 dark:text-zinc-300 mb-3">
                        Active Feature Flags
                    </h2>
                    {activeFlags.length === 0 ? (
                        <p className="text-sm text-gray-400 dark:text-zinc-600">
                            No flags enabled.
                        </p>
                    ) : (
                        <div className="space-y-2">
                            {activeFlags.map((flag) => (
                                <div
                                    key={flag.id}
                                    className="flex items-center justify-between text-sm"
                                >
                                    <code className="text-xs font-mono text-gray-700 dark:text-zinc-300">
                                        {flag.key}
                                    </code>
                                    <AdminStatusBadge status="enabled" />
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
