'use client';

import { useAdminFetch } from '@/features/admin/hooks/useAdminData';
import { AdminPageHeader } from '../AdminPageHeader';
import { AdminDataTable, type AdminColumn } from '../AdminDataTable';
import { AdminStatusBadge } from '../AdminStatusBadge';

interface ActionLog {
    id: string;
    type: string;
    status: string;
    user_id: string;
    created_at: string;
}

interface ActionsData {
    actions: ActionLog[];
}

function formatDateTime(iso: string): string {
    return new Date(iso).toLocaleString('en-US', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    });
}

export function AdminActionsPage() {
    const { data, loading } = useAdminFetch<ActionsData>('/api/actions');
    const actions = data?.actions ?? [];

    const columns: AdminColumn<ActionLog>[] = [
        {
            key: 'type',
            header: 'Action Type',
            render: (r) => <code className="text-xs font-mono">{r.type}</code>,
        },
        {
            key: 'status',
            header: 'Status',
            render: (r) => <AdminStatusBadge status={r.status} />,
            width: '110px',
        },
        {
            key: 'user_id',
            header: 'User',
            render: (r) => (
                <span className="text-xs font-mono text-gray-400 truncate block max-w-[180px]">
                    {r.user_id}
                </span>
            ),
        },
        {
            key: 'created_at',
            header: 'Time',
            render: (r) => (
                <span className="text-xs text-gray-400">
                    {formatDateTime(r.created_at)}
                </span>
            ),
            width: '140px',
        },
    ];

    return (
        <div className="space-y-4">
            <AdminPageHeader
                title="Actions"
                description="User-triggered automation and action executions"
            />
            {data === null && !loading ? (
                <div className="text-sm text-gray-400 p-4">
                    Actions data unavailable — wire up /api/actions to expose
                    this data.
                </div>
            ) : (
                <AdminDataTable
                    columns={columns}
                    rows={actions}
                    getRowKey={(r) => r.id}
                    loading={loading}
                    emptyMessage="No actions logged."
                />
            )}
        </div>
    );
}
