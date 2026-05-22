'use client';

import { useState, useCallback } from 'react';
import { AdminPageHeader } from '../AdminPageHeader';
import { AdminDataTable, type AdminColumn } from '../AdminDataTable';
import { AdminStatusBadge } from '../AdminStatusBadge';
import { useAdminFetch } from '@/features/admin/hooks/useAdminData';

interface AdminUserRow {
    id: string;
    email: string;
    full_name: string;
    role: string;
    created_at: string;
}

interface UsersData {
    users: AdminUserRow[];
}

const ROLES = ['user', 'viewer', 'support', 'moderator', 'admin', 'owner'];

function formatDate(iso: string): string {
    return new Date(iso).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
    });
}

function RoleSelect({
    userId,
    currentRole,
    onChanged,
}: {
    userId: string;
    currentRole: string;
    onChanged: () => void;
}) {
    const [saving, setSaving] = useState(false);

    const handleChange = useCallback(
        async (role: string) => {
            setSaving(true);
            await fetch('/api/admin/users', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id: userId, role }),
            });
            setSaving(false);
            onChanged();
        },
        [userId, onChanged],
    );

    return (
        <select
            value={currentRole}
            disabled={saving}
            onChange={(e) => {
                void handleChange(e.target.value);
            }}
            className="text-xs rounded-md border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-2 py-1 focus:outline-none focus:ring-1 focus:ring-indigo-500 disabled:opacity-50"
        >
            {ROLES.map((r) => (
                <option key={r} value={r}>
                    {r}
                </option>
            ))}
        </select>
    );
}

export function AdminUsersPage() {
    const { data, loading, refetch } =
        useAdminFetch<UsersData>('/api/admin/users');
    const [search, setSearch] = useState('');

    const users = (data?.users ?? []).filter((u) => {
        const q = search.toLowerCase();
        return (
            !q || u.email.includes(q) || u.full_name.toLowerCase().includes(q)
        );
    });

    const columns: AdminColumn<AdminUserRow>[] = [
        {
            key: 'email',
            header: 'Email',
            render: (r) => <span className="font-mono text-xs">{r.email}</span>,
        },
        {
            key: 'full_name',
            header: 'Name',
            render: (r) =>
                r.full_name || <span className="text-gray-400">—</span>,
        },
        {
            key: 'role',
            header: 'Role',
            render: (r) => <AdminStatusBadge status={r.role} />,
            width: '120px',
        },
        {
            key: 'created_at',
            header: 'Joined',
            render: (r) => (
                <span className="text-xs text-gray-400">
                    {formatDate(r.created_at)}
                </span>
            ),
            width: '130px',
        },
        {
            key: 'actions',
            header: 'Change Role',
            render: (r) => (
                <RoleSelect
                    userId={r.id}
                    currentRole={r.role}
                    onChanged={refetch}
                />
            ),
            width: '160px',
        },
    ];

    return (
        <div className="space-y-4">
            <AdminPageHeader
                title="Users"
                description={`${data?.users.length ?? 0} registered accounts`}
                actions={
                    <input
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Search users…"
                        className="text-sm rounded-lg border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3 py-1.5 focus:outline-none focus:ring-1 focus:ring-indigo-500 w-56"
                    />
                }
            />
            <AdminDataTable
                columns={columns}
                rows={users}
                getRowKey={(r) => r.id}
                loading={loading}
                emptyMessage="No users found."
            />
        </div>
    );
}
