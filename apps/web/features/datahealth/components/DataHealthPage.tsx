'use client';

import { Activity, RefreshCw } from 'lucide-react';
import { AdminGate } from '@/features/admin/components/AdminGate';
import {
    useDataHealth,
    type ServiceCheck,
    type ServiceStatus,
} from '@/features/datahealth/hooks/useDataHealth';

function statusDot(status: ServiceStatus) {
    const base = 'w-3 h-3 rounded-full shrink-0';
    if (status === 'ok') return `${base} bg-emerald-400`;
    if (status === 'error') return `${base} bg-red-400`;
    if (status === 'checking') return `${base} bg-amber-400 animate-pulse`;
    return `${base} bg-zinc-300 dark:bg-zinc-600`;
}

function statusLabel(status: ServiceStatus) {
    if (status === 'ok')
        return {
            text: 'Operational',
            cls: 'text-emerald-600 dark:text-emerald-400',
        };
    if (status === 'error')
        return { text: 'Degraded', cls: 'text-red-600 dark:text-red-400' };
    if (status === 'checking')
        return { text: 'Checking…', cls: 'text-amber-600 dark:text-amber-400' };
    return { text: 'Unknown', cls: 'text-zinc-500' };
}

function ServiceCard({ check }: { check: ServiceCheck }) {
    const lbl = statusLabel(check.status);
    return (
        <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-stone-100 dark:border-zinc-800 p-5">
            <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2.5">
                    <span className={statusDot(check.status)} />
                    <p className="text-sm font-semibold text-stone-800 dark:text-zinc-200">
                        {check.label}
                    </p>
                </div>
                {check.latencyMs !== undefined && (
                    <span className="text-xs text-stone-400 dark:text-zinc-600 font-mono">
                        {check.latencyMs}ms
                    </span>
                )}
            </div>
            <p className={`text-xs font-medium ${lbl.cls}`}>{lbl.text}</p>
            {check.note && (
                <p className="text-xs text-stone-500 dark:text-zinc-500 mt-1">
                    {check.note}
                </p>
            )}
        </div>
    );
}

function DataHealthContent() {
    const { health, checking, refresh } = useDataHealth();

    const services = [
        health.database,
        health.ml_service,
        health.gmail,
        health.calendar,
    ];
    const allOk = services.every((s) => s.status === 'ok');

    return (
        <main className="max-w-4xl mx-auto px-6 py-8 lg:px-12">
            <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-3">
                    <Activity
                        size={22}
                        className={allOk ? 'text-emerald-500' : 'text-red-500'}
                    />
                    <div>
                        <h1 className="text-2xl font-bold text-stone-900 dark:text-zinc-100">
                            System Health
                        </h1>
                        <p
                            className={`text-sm font-medium ${allOk ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}`}
                        >
                            {allOk
                                ? 'All systems operational'
                                : 'Some systems degraded'}
                        </p>
                    </div>
                </div>
                <button
                    onClick={refresh}
                    disabled={checking}
                    className="flex items-center gap-2 text-sm text-stone-500 dark:text-zinc-400 hover:text-stone-700 dark:hover:text-zinc-200 transition-colors disabled:opacity-50"
                >
                    <RefreshCw
                        size={15}
                        className={checking ? 'animate-spin' : ''}
                    />
                    Refresh
                </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {services.map((s) => (
                    <ServiceCard key={s.label} check={s} />
                ))}
            </div>
        </main>
    );
}

export function DataHealthPage() {
    return (
        <AdminGate>
            <DataHealthContent />
        </AdminGate>
    );
}
