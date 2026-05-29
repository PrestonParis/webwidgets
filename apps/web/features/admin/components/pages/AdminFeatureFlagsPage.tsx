'use client';

import { useState, useCallback } from 'react';
import { Plus } from 'lucide-react';
import { AdminPageHeader } from '../AdminPageHeader';
import { AdminDataTable, type AdminColumn } from '../AdminDataTable';
import { AdminStatusBadge } from '../AdminStatusBadge';
import { useAdminFetch } from '@/features/admin/hooks/useAdminData';

interface FeatureFlag {
    id: string;
    key: string;
    description: string;
    enabled: boolean;
    rollout_pct: number;
    updated_at: string;
}

interface FlagsData {
    flags: FeatureFlag[];
}

function ToggleCell({
    flag,
    onChanged,
}: {
    flag: FeatureFlag;
    onChanged: () => void;
}) {
    const [loading, setLoading] = useState(false);

    const toggle = useCallback(async () => {
        setLoading(true);
        await fetch('/api/admin/feature-flags', {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id: flag.id, enabled: !flag.enabled }),
        });
        setLoading(false);
        onChanged();
    }, [flag.id, flag.enabled, onChanged]);

    return (
        <button
            onClick={() => {
                void toggle();
            }}
            disabled={loading}
            className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors focus:outline-none disabled:opacity-50 ${
                flag.enabled ? 'bg-indigo-500' : 'bg-gray-200 dark:bg-zinc-700'
            }`}
        >
            <span
                className={`pointer-events-none inline-block h-4 w-4 rounded-full bg-white shadow transform transition-transform ${
                    flag.enabled ? 'translate-x-4' : 'translate-x-0'
                }`}
            />
        </button>
    );
}

function CreateFlagForm({ onCreated }: { onCreated: () => void }) {
    const [key, setKey] = useState('');
    const [desc, setDesc] = useState('');
    const [saving, setSaving] = useState(false);

    const handleSubmit = useCallback(async () => {
        if (!key) return;
        setSaving(true);
        await fetch('/api/admin/feature-flags', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ key, description: desc }),
        });
        setSaving(false);
        setKey('');
        setDesc('');
        onCreated();
    }, [key, desc, onCreated]);

    return (
        <div className="flex items-center gap-2 flex-wrap">
            <input
                value={key}
                onChange={(e) =>
                    setKey(
                        e.target.value
                            .toLowerCase()
                            .replace(/[^a-z0-9_]/g, '_'),
                    )
                }
                placeholder="flag_key"
                className="font-mono text-sm rounded-lg border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3 py-1.5 w-44 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
            <input
                value={desc}
                onChange={(e) => setDesc(e.target.value)}
                placeholder="Description (optional)"
                className="text-sm rounded-lg border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3 py-1.5 flex-1 min-w-40 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
            <button
                onClick={() => {
                    void handleSubmit();
                }}
                disabled={!key || saving}
                className="flex items-center gap-1 text-sm px-3 py-1.5 rounded-lg bg-indigo-500 text-white hover:bg-indigo-600 transition-colors disabled:opacity-50"
            >
                <Plus size={14} />
                Add flag
            </button>
        </div>
    );
}

export function AdminFeatureFlagsPage() {
    const { data, loading, refetch } = useAdminFetch<FlagsData>(
        '/api/admin/feature-flags',
    );

    const flags = data?.flags ?? [];

    const columns: AdminColumn<FeatureFlag>[] = [
        {
            key: 'key',
            header: 'Key',
            render: (r) => (
                <code className="text-xs font-mono text-gray-800 dark:text-zinc-200">
                    {r.key}
                </code>
            ),
        },
        {
            key: 'description',
            header: 'Description',
            render: (r) => (
                <span className="text-sm text-gray-500">
                    {r.description || '—'}
                </span>
            ),
        },
        {
            key: 'status',
            header: 'Status',
            width: '100px',
            render: (r) => (
                <AdminStatusBadge status={r.enabled ? 'enabled' : 'disabled'} />
            ),
        },
        {
            key: 'rollout',
            header: 'Rollout',
            width: '80px',
            render: (r) => <span className="text-sm">{r.rollout_pct}%</span>,
        },
        {
            key: 'toggle',
            header: 'Toggle',
            width: '80px',
            render: (r) => <ToggleCell flag={r} onChanged={refetch} />,
        },
    ];

    return (
        <div className="space-y-4">
            <AdminPageHeader
                title="Feature Flags"
                description="Toggle features without deployments"
            />
            <CreateFlagForm onCreated={refetch} />
            <AdminDataTable
                columns={columns}
                rows={flags}
                getRowKey={(r) => r.id}
                loading={loading}
                emptyMessage="No feature flags created yet."
            />
        </div>
    );
}
