'use client';

import { Download } from 'lucide-react';
import { Button } from '@/features/ui/components/Button';
import { useToastContext } from '@/features/ui/components/ToastProvider';
import { cn } from '@/lib/utils/utils';
import type { ProjectRecord } from '../hooks/useCreativeStudio';

interface CreativeExport {
    id: string;
    label: string;
    description: string;
    ready: boolean;
}

interface CreativeExportPanelProps {
    exports: CreativeExport[];
    selectedProject: ProjectRecord | undefined;
}

export function CreativeExportPanel({
    exports,
    selectedProject,
}: CreativeExportPanelProps) {
    const toast = useToastContext();

    return (
        <aside className="space-y-4">
            <section className="rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
                <h2 className="text-base font-semibold text-zinc-950 dark:text-zinc-50">
                    Export targets
                </h2>
                <div className="mt-4 grid gap-2">
                    {exports.map((target) => (
                        <button
                            key={target.id}
                            type="button"
                            onClick={() =>
                                toast.info(`${target.label} export staged.`)
                            }
                            className="rounded-lg border border-zinc-200 p-3 text-left transition hover:border-zinc-300 dark:border-zinc-800 dark:hover:border-zinc-700"
                        >
                            <div className="flex items-center justify-between gap-3">
                                <h3 className="text-sm font-semibold text-zinc-950 dark:text-zinc-50">
                                    {target.label}
                                </h3>
                                <span
                                    className={cn(
                                        'rounded px-1.5 py-0.5 text-[11px] font-semibold uppercase',
                                        target.ready
                                            ? 'bg-emerald-600 text-white'
                                            : 'bg-zinc-100 text-zinc-400 dark:bg-zinc-950',
                                    )}
                                >
                                    {target.ready ? 'ready' : 'draft'}
                                </span>
                            </div>
                            <p className="mt-2 text-xs leading-5 text-zinc-500 dark:text-zinc-400">
                                {target.description}
                            </p>
                        </button>
                    ))}
                </div>
                <Button
                    className="mt-4"
                    fullWidth
                    icon={Download}
                    onClick={() => toast.success('Export packet prepared.')}
                >
                    Export
                </Button>
            </section>

            {selectedProject && (
                <section className="rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
                    <h2 className="mb-3 text-base font-semibold text-zinc-950 dark:text-zinc-50">
                        Project info
                    </h2>
                    <dl className="grid gap-2">
                        <div className="rounded-lg bg-zinc-50 p-3 dark:bg-zinc-950">
                            <dt className="text-xs text-zinc-500">Format</dt>
                            <dd className="mt-1 text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                                {selectedProject.format}
                            </dd>
                        </div>
                        {selectedProject.description && (
                            <div className="rounded-lg bg-zinc-50 p-3 dark:bg-zinc-950">
                                <dt className="text-xs text-zinc-500">
                                    Description
                                </dt>
                                <dd className="mt-1 text-sm text-zinc-700 dark:text-zinc-300">
                                    {selectedProject.description}
                                </dd>
                            </div>
                        )}
                    </dl>
                </section>
            )}
        </aside>
    );
}
