'use client';

import { useState, useCallback } from 'react';
import { Shield, Save } from 'lucide-react';
import { AdminPageHeader } from '../AdminPageHeader';

interface SettingRow {
    key: string;
    label: string;
    description: string;
    envVar: string;
    value: string;
}

const SETTINGS: SettingRow[] = [
    {
        key: 'METRICS_SECRET',
        label: 'Metrics Scrape Secret',
        description:
            'Bearer token required to access /api/metrics. Leave blank to allow unauthenticated scraping.',
        envVar: 'METRICS_SECRET',
        value: '',
    },
    {
        key: 'NEXT_PUBLIC_SENTRY_DSN',
        label: 'Sentry DSN',
        description: 'Sentry data source name for error reporting.',
        envVar: 'NEXT_PUBLIC_SENTRY_DSN',
        value: '',
    },
];

function SettingCard({ setting }: { setting: SettingRow }) {
    const [val, setVal] = useState(setting.value);
    const [saved, setSaved] = useState(false);

    const handleSave = useCallback(() => {
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
    }, []);

    return (
        <div className="bg-white dark:bg-zinc-900 rounded-xl border border-gray-200 dark:border-zinc-800 p-4 space-y-2">
            <div>
                <p className="text-sm font-semibold text-gray-800 dark:text-zinc-200">
                    {setting.label}
                </p>
                <p className="text-xs text-gray-500 dark:text-zinc-500 mt-0.5">
                    {setting.description}
                </p>
                <code className="text-[10px] font-mono text-gray-400 dark:text-zinc-600">
                    {setting.envVar}
                </code>
            </div>
            <div className="flex items-center gap-2">
                <input
                    type="password"
                    value={val}
                    onChange={(e) => setVal(e.target.value)}
                    placeholder="Set via environment variable"
                    className="flex-1 text-sm font-mono rounded-lg border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3 py-1.5 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
                <button
                    onClick={handleSave}
                    className="flex items-center gap-1 text-sm px-3 py-1.5 rounded-lg bg-indigo-500 text-white hover:bg-indigo-600 transition-colors"
                >
                    <Save size={13} />
                    {saved ? 'Saved!' : 'Save'}
                </button>
            </div>
        </div>
    );
}

export function AdminSettingsPage() {
    return (
        <div className="space-y-6">
            <AdminPageHeader
                title="Admin Settings"
                description="System configuration — owner access only"
                actions={<Shield size={18} className="text-purple-500" />}
            />

            <div className="rounded-xl bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 p-4 text-sm text-yellow-800 dark:text-yellow-300">
                These settings are informational. Runtime configuration must be
                set as environment variables in your deployment. Changes here
                are not persisted.
            </div>

            <div className="space-y-3">
                {SETTINGS.map((s) => (
                    <SettingCard key={s.key} setting={s} />
                ))}
            </div>
        </div>
    );
}
