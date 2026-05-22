'use client';

import { useEffect, useState } from 'react';
import { Zap } from 'lucide-react';
import WidgetShell from '@/features/widgets/components/WidgetShell';
import type { WorkstreamRecord } from '../hooks/useCommandCenter';

export default function CommandCenterWidget({ widgetId = 'command-center' }: { widgetId?: string }) {
    const [workstreams, setWorkstreams] = useState<WorkstreamRecord[] | null>(null);

    useEffect(() => {
        void fetch('/api/command/workstreams')
            .then((r) => r.ok ? r.json() as Promise<WorkstreamRecord[]> : Promise.resolve([]))
            .then(setWorkstreams)
            .catch(() => setWorkstreams([]));
    }, []);

    const attention = workstreams?.filter((w) => w.status === 'attention' || w.status === 'blocked').length ?? 0;

    const badge = attention > 0
        ? <span className="text-[10px] font-bold text-amber-500">{attention} NEEDS ATTENTION</span>
        : workstreams !== null
        ? <span className="text-[10px] font-bold text-emerald-500">ALL CLEAR</span>
        : undefined;

    return (
        <WidgetShell
            icon={<Zap size={16} />}
            title="Command Center"
            badge={badge}
            widgetId={widgetId}
            widgetType="command-center"
            footerHref="/command-center"
            footerLabel="Open command center ->"
        >
            <div className="space-y-2.5">
                {workstreams === null ? (
                    <p className="text-xs text-zinc-400">Loading…</p>
                ) : workstreams.length === 0 ? (
                    <p className="text-xs text-zinc-500 dark:text-zinc-400">
                        No workstreams yet. Add one to start organizing your work.
                    </p>
                ) : (
                    workstreams.slice(0, 3).map((w) => (
                        <div key={w.id} className="flex items-start gap-2">
                            <span className={`mt-1 h-2 w-2 shrink-0 rounded-full ${
                                w.status === 'blocked' ? 'bg-rose-500' :
                                w.status === 'attention' ? 'bg-amber-500' :
                                w.status === 'healthy' ? 'bg-emerald-500' : 'bg-sky-400'
                            }`} />
                            <div className="min-w-0 flex-1">
                                <p className="truncate text-xs font-semibold text-zinc-800 dark:text-zinc-200">
                                    {w.title}
                                </p>
                                <p className="text-[10px] text-zinc-400 capitalize">{w.status} · {w.priority}</p>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </WidgetShell>
    );
}
