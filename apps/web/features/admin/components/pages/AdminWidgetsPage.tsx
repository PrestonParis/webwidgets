'use client';

import { useAdminFetch } from '@/features/admin/hooks/useAdminData';
import { AdminPageHeader } from '../AdminPageHeader';
import { AdminDataTable, type AdminColumn } from '../AdminDataTable';

interface WidgetRow {
    id: string;
    type: string;
    user_id: string;
    visible: boolean;
    created_at: string;
}

interface WidgetsData {
    widgets: WidgetRow[];
}

export function AdminWidgetsPage() {
    const { data, loading } = useAdminFetch<WidgetsData>('/api/admin/widgets');
    const widgets = data?.widgets ?? [];

    const columns: AdminColumn<WidgetRow>[] = [
        {
            key: 'type',
            header: 'Type',
            render: (r) => <code className="text-xs font-mono">{r.type}</code>,
        },
        {
            key: 'user_id',
            header: 'User',
            render: (r) => (
                <span className="text-xs font-mono text-gray-400 truncate block max-w-[200px]">
                    {r.user_id}
                </span>
            ),
        },
        {
            key: 'visible',
            header: 'Visible',
            render: (r) => (
                <span
                    className={`text-xs ${r.visible ? 'text-green-600' : 'text-gray-400'}`}
                >
                    {r.visible ? 'Yes' : 'No'}
                </span>
            ),
            width: '80px',
        },
        {
            key: 'created_at',
            header: 'Created',
            render: (r) => (
                <span className="text-xs text-gray-400">
                    {new Date(r.created_at).toLocaleDateString()}
                </span>
            ),
            width: '120px',
        },
    ];

    return (
        <div className="space-y-4">
            <AdminPageHeader
                title="Widgets"
                description="All widget instances across users"
            />
            {data === null && !loading ? (
                <div className="text-sm text-gray-400 p-4">
                    Widget data not available — add an /api/admin/widgets route
                    to enable this view.
                </div>
            ) : (
                <AdminDataTable
                    columns={columns}
                    rows={widgets}
                    getRowKey={(r) => r.id}
                    loading={loading}
                    emptyMessage="No widgets found."
                />
            )}
        </div>
    );
}
