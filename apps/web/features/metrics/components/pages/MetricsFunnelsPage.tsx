'use client';

import { Filter } from 'lucide-react';

interface FunnelStep {
    label: string;
    count: number;
    pct: number;
}

interface Funnel {
    title: string;
    steps: FunnelStep[];
}

const PLACEHOLDER_FUNNELS: Funnel[] = [
    {
        title: 'Onboarding',
        steps: [
            { label: 'Signup', count: 1000, pct: 100 },
            { label: 'Onboarding Started', count: 780, pct: 78 },
            { label: 'Widget Selected', count: 620, pct: 62 },
            { label: 'API Connected', count: 410, pct: 41 },
            { label: 'First Widget Used', count: 330, pct: 33 },
        ],
    },
    {
        title: 'Action Execution',
        steps: [
            { label: 'Action Suggested', count: 500, pct: 100 },
            { label: 'Action Accepted', count: 310, pct: 62 },
            { label: 'Action Executed', count: 280, pct: 56 },
            { label: 'Action Succeeded', count: 250, pct: 50 },
        ],
    },
];

function FunnelChart({ funnel }: { funnel: Funnel }) {
    return (
        <div className="bg-white dark:bg-zinc-900 rounded-xl border border-gray-200 dark:border-zinc-800 p-4">
            <p className="text-sm font-semibold text-gray-700 dark:text-zinc-300 mb-4">
                {funnel.title} Funnel
            </p>
            <div className="space-y-2">
                {funnel.steps.map((step, i) => (
                    <div key={step.label} className="space-y-1">
                        <div className="flex items-center justify-between text-xs text-gray-600 dark:text-zinc-400">
                            <span>
                                {i + 1}. {step.label}
                            </span>
                            <span className="font-medium">
                                {step.count.toLocaleString()} ({step.pct}%)
                            </span>
                        </div>
                        <div className="h-2 rounded-full bg-gray-100 dark:bg-zinc-800 overflow-hidden">
                            <div
                                className="h-full rounded-full bg-violet-500 transition-all"
                                style={{ width: `${step.pct}%` }}
                            />
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

export function MetricsFunnelsPage() {
    return (
        <div className="space-y-6">
            <div className="flex items-center gap-2">
                <Filter size={18} className="text-violet-500" />
                <h1 className="text-xl font-bold text-gray-900 dark:text-zinc-100">
                    Funnels
                </h1>
            </div>
            <p className="text-sm text-gray-500 dark:text-zinc-500">
                Placeholder cohorts shown. Wire{' '}
                <code className="font-mono text-xs">trackEvent()</code> through
                onboarding, action, and widget flows to populate live conversion
                data.
            </p>
            <div className="grid xl:grid-cols-2 gap-4">
                {PLACEHOLDER_FUNNELS.map((f) => (
                    <FunnelChart key={f.title} funnel={f} />
                ))}
            </div>
        </div>
    );
}
