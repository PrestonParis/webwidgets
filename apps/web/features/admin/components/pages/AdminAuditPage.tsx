'use client';

import { useState } from 'react';
import { AdminPageHeader } from '../AdminPageHeader';
import { AdminDataTable, type AdminColumn } from '../AdminDataTable';
import { AdminStatusBadge } from '../AdminStatusBadge';
import { useAdminFetch } from '@/features/admin/hooks/useAdminData';

interface AuditLog {
    id: string;
    actor_id: string;
    action: string;
    resource_type: string;
    resource_id: string | null;
    ip: string | null;
    created_at: string;
}

interface AuditData {
    logs: AuditLog[];
}

function formatDateTime(iso: string): string {
    return new Date(iso).toLocaleString('en-US', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    });
}

const RESOURCE_TYPES = [
    '',
    'user',
    'widget',
    'feature_flag',
    'action',
    'job',
    'email',
    'note',
    'setting',
];

export function AdminAuditPage() {
    const [resourceType, setResourceType] = useState('');
    const url = `/api/admin/audit?limit=100${resourceType ? `&resource_type=${resourceType}` : ''}`;
    const { data, loading } = useAdminFetch<AuditData>(url);

    const logs = data?.logs ?? [];

    const columns: AdminColumn<AuditLog>[] = [
        {
            key: 'created_at',
            header: 'When',
            width: '140px',
            render: (r) => (
                <span className="text-xs text-gray-400">
                    {formatDateTime(r.created_at)}
                </span>
            ),
        },
        {
            key: 'resource_type',
            header: 'Resource',
            width: '120px',
            render: (r) => <AdminStatusBadge status={r.resource_type} />,
        },
        {
            key: 'action',
            header: 'Action',
            render: (r) => (
                <code className="text-xs font-mono">{r.action}</code>
            ),
        },
        {
            key: 'resource_id',
            header: 'Resource ID',
            width: '200px',
            render: (r) => (
                <span className="text-xs font-mono text-gray-400 truncate block max-w-[180px]">
                    {r.resource_id ?? '—'}
                </span>
            ),
        },
        {
            key: 'actor_id',
            header: 'Actor',
            width: '200px',
            render: (r) => (
                <span className="text-xs font-mono text-gray-400 truncate block max-w-[180px]">
                    {r.actor_id}
                </span>
            ),
        },
        {
            key: 'ip',
            header: 'IP',
            width: '120px',
            render: (r) => (
                <span className="text-xs text-gray-400">{r.ip ?? '—'}</span>
            ),
        },
    ];

    return (
        <div className="space-y-4">
            <AdminPageHeader
                title="Audit Log"
                description="Immutable record of every admin action"
                actions={
                    <select
                        value={resourceType}
                        onChange={(e) => setResourceType(e.target.value)}
                        className="text-sm rounded-lg border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3 py-1.5 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    >
                        {RESOURCE_TYPES.map((r) => (
                            <option key={r} value={r}>
                                {r || 'All resources'}
                            </option>
                        ))}
                    </select>
                }
            />
            <AdminDataTable
                columns={columns}
                rows={logs}
                getRowKey={(r) => r.id}
                loading={loading}
                emptyMessage="No audit events recorded yet."
            />
        </div>
    );
}
