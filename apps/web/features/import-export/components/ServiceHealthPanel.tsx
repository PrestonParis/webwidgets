'use client';

import { CheckCircle2, XCircle, AlertTriangle } from 'lucide-react';
import { Button } from '@/features/ui/components/Button';
import type { ServiceHealth } from '@/features/import-export/types/importExport';

interface Props {
    health: ServiceHealth | null;
    loading: boolean;
    onRefresh: () => void;
}

const statusIcon = {
    ok: <CheckCircle2 size={14} className="text-emerald-500" />,
    error: <XCircle size={14} className="text-red-500" />,
    unconfigured: <AlertTriangle size={14} className="text-amber-500" />,
};

export function ServiceHealthPanel({ health, loading, onRefresh }: Props) {
    return (
        <div className="rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 p-5">
            <div className="flex items-center justify-between mb-4">
                <div>
                    <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                        Service Health
                    </h3>
                    {health && (
                        <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                            Checked{' '}
                            {new Date(health.checkedAt).toLocaleTimeString()}
                        </p>
                    )}
                </div>
                <Button
                    variant="ghost"
                    size="sm"
                    loading={loading}
                    onClick={onRefresh}
                >
                    Refresh
                </Button>
            </div>

            {!health && !loading && (
                <p className="text-sm text-zinc-500 dark:text-zinc-400">
                    Health data unavailable
                </p>
            )}

            {health && (
                <div className="space-y-2">
                    {health.services.map((svc) => (
                        <div
                            key={svc.name}
                            className="flex items-center gap-2 rounded-lg px-3 py-2 bg-zinc-50 dark:bg-zinc-800"
                        >
                            {statusIcon[
                                svc.status as keyof typeof statusIcon
                            ] ?? statusIcon.unconfigured}
                            <span className="text-xs font-medium text-zinc-700 dark:text-zinc-300 capitalize">
                                {svc.name}
                            </span>
                            {svc.message && (
                                <span className="text-xs text-zinc-400 dark:text-zinc-500 ml-auto truncate max-w-[200px]">
                                    {svc.message}
                                </span>
                            )}
                        </div>
                    ))}

                    <div className="mt-3 pt-3 border-t border-zinc-100 dark:border-zinc-800 flex gap-4">
                        <span className="text-xs text-zinc-500">
                            DB:{' '}
                            <strong
                                className={
                                    health.db === 'ok'
                                        ? 'text-emerald-600'
                                        : 'text-red-600'
                                }
                            >
                                {health.db}
                            </strong>
                        </span>
                        <span className="text-xs text-zinc-500">
                            Storage:{' '}
                            <strong
                                className={
                                    health.storage === 'ok'
                                        ? 'text-emerald-600'
                                        : 'text-amber-600'
                                }
                            >
                                {health.storage}
                            </strong>
                        </span>
                        <span className="text-xs text-zinc-500">
                            Adapters:{' '}
                            <strong className="text-zinc-700 dark:text-zinc-300">
                                {health.adapters}
                            </strong>
                        </span>
                    </div>
                </div>
            )}
        </div>
    );
}
