'use client';

import { Activity, RefreshCw } from 'lucide-react';
import WidgetShell from '@/features/widgets/components/WidgetShell';
import { useWidgetSettings } from '@/features/widgets/hooks/useWidgetSettings';
import { AdminGate } from '@/features/admin/components/AdminGate';
import {
    useDataHealth,
    type ServiceCheck,
    type ServiceStatus,
} from '@/features/datahealth/hooks/useDataHealth';
import { useWidgetSnapshot } from '@/features/dashboard/lib/DashboardSnapshotContext';
import type { ServiceHealth } from '@/lib/connectors/serviceHealth';

function dot(status: ServiceStatus) {
    const base = 'w-2 h-2 rounded-full shrink-0';
    if (status === 'ok') return `${base} bg-emerald-400`;
    if (status === 'error') return `${base} bg-red-400`;
    if (status === 'checking') return `${base} bg-amber-400 animate-pulse`;
    return `${base} bg-zinc-400`;
}

function ServiceRow({ check }: { check: ServiceCheck }) {
    return (
        <div className="flex items-center justify-between py-2">
            <div className="flex items-center gap-2 min-w-0">
                <span className={dot(check.status)} />
                <span className="text-sm font-medium text-gray-800 dark:text-zinc-200 truncate">
                    {check.label}
                </span>
                {check.note && (
                    <span className="text-xs text-gray-400 dark:text-zinc-500 truncate">
                        {check.note}
                    </span>
                )}
            </div>
            {check.latencyMs !== undefined && (
                <span className="text-xs text-gray-400 dark:text-zinc-500 ml-2 shrink-0">
                    {check.latencyMs}ms
                </span>
            )}
        </div>
    );
}

function toServiceCheck(
    label: string,
    check: ServiceHealth['checks'][string] | undefined,
    note?: string,
): ServiceCheck {
    return {
        label,
        status: check?.status ?? 'unknown',
        ...(check?.latencyMs !== undefined
            ? { latencyMs: check.latencyMs }
            : {}),
        ...(note ? { note } : {}),
    };
}

function DataHealthContent({ widgetId }: { widgetId: string }) {
    const { settings, updateSettings } = useWidgetSettings(
        'datahealth',
        'datahealth',
    );
    const snapshot = useWidgetSnapshot<ServiceHealth>(widgetId);
    const { health, checking, refresh } = useDataHealth();

    const snapshotHealth =
        snapshot?.status === 'ready' ? snapshot.data : undefined;
    const services = snapshotHealth
        ? [
              toServiceCheck('Supabase', snapshotHealth.checks.database),
              toServiceCheck(
                  'ML Service',
                  snapshotHealth.checks.ml_service,
                  snapshotHealth.checks.ml_service
                      ? undefined
                      : 'Not configured',
              ),
              health.gmail,
              health.calendar,
          ]
        : [health.database, health.ml_service, health.gmail, health.calendar];
    const hasError = services.some((s) => s.status === 'error');

    return (
        <WidgetShell
            icon={<Activity size={16} />}
            title="System Health"
            settings={settings}
            onSettingsChange={updateSettings}
            widgetId={widgetId}
            widgetType="datahealth"
            badge={hasError ? 'Issue' : null}
            footerSlot={
                <button
                    onClick={() => void refresh()}
                    disabled={checking}
                    className="flex items-center gap-1 text-xs text-gray-400 dark:text-zinc-500 hover:text-gray-600 dark:hover:text-zinc-300 transition-colors disabled:opacity-40"
                >
                    <RefreshCw
                        size={11}
                        className={checking ? 'animate-spin' : ''}
                    />
                    Refresh
                </button>
            }
        >
            <div className="divide-y divide-gray-100 dark:divide-zinc-800">
                {services.map((svc) => (
                    <ServiceRow key={svc.label} check={svc} />
                ))}
            </div>
        </WidgetShell>
    );
}

export default function DataHealthWidget({
    widgetId = 'widget-datahealth',
}: {
    widgetId?: string;
}) {
    return (
        <AdminGate showForbidden>
            <DataHealthContent widgetId={widgetId} />
        </AdminGate>
    );
}
