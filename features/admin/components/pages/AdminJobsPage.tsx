'use client';

import { AdminPageHeader } from '../AdminPageHeader';
import { AdminDataTable, type AdminColumn } from '../AdminDataTable';
import { AdminStatusBadge } from '../AdminStatusBadge';
import { useAdminFetch } from '@/features/admin/hooks/useAdminData';

interface Job {
    id: string;
    type: string;
    status: string;
    user_id: string;
    metadata: Record<string, unknown> | null;
    created_at: string;
    updated_at: string;
}

interface JobsData {
    jobs: Job[];
}

function formatDateTime(iso: string): string {
    return new Date(iso).toLocaleString('en-US', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    });
}

export function AdminJobsPage() {
    const { data, loading } = useAdminFetch<JobsData>('/api/jobs');

    const jobs = data?.jobs ?? [];

    const columns: AdminColumn<Job>[] = [
        {
            key: 'type',
            header: 'Type',
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
            header: 'User ID',
            render: (r) => (
                <span className="text-xs font-mono text-gray-400 truncate block max-w-[180px]">
                    {r.user_id}
                </span>
            ),
        },
        {
            key: 'created_at',
            header: 'Created',
            render: (r) => (
                <span className="text-xs text-gray-400">
                    {formatDateTime(r.created_at)}
                </span>
            ),
            width: '140px',
        },
        {
            key: 'updated_at',
            header: 'Updated',
            render: (r) => (
                <span className="text-xs text-gray-400">
                    {formatDateTime(r.updated_at)}
                </span>
            ),
            width: '140px',
        },
    ];

    return (
        <div className="space-y-4">
            <AdminPageHeader
                title="Jobs"
                description="Background job queue and execution history"
            />
            <AdminDataTable
                columns={columns}
                rows={jobs}
                getRowKey={(r) => r.id}
                loading={loading}
                emptyMessage="No jobs found."
            />
        </div>
    );
}
