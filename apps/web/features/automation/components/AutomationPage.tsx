'use client';

import {
    CalendarClock,
    ListChecks,
    FileOutput,
    History,
    LayoutGrid,
    PanelsTopLeft,
    ShieldCheck,
    Sparkles,
    Workflow,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import Link from 'next/link';
import Header from '@/features/ui/components/Header';
import { cn } from '@/lib/utils/utils';
import {
    useAutomationCenter,
    type AutomationTab,
} from '@/features/automation/hooks/useAutomationCenter';
import { AutomationOverview } from './AutomationOverview';
import { AutomationInventory } from './AutomationInventory';
import { AutomationSuggestions } from './AutomationSuggestions';
import { AutomationDeliverables } from './AutomationDeliverables';
import { AutomationRunHistory } from './AutomationRunHistory';
import { AutomationApprovals } from './AutomationApprovals';
import { AutomationActionCatalog } from './AutomationActionCatalog';
import { Toggle } from './AutomationBadges';

const TABS: { id: AutomationTab; label: string; icon: LucideIcon }[] = [
    { id: 'overview', label: 'Overview', icon: LayoutGrid },
    { id: 'automations', label: 'Automations', icon: Workflow },
    { id: 'actions', label: 'Actions', icon: ListChecks },
    { id: 'workstreams', label: 'Workstreams', icon: PanelsTopLeft },
    { id: 'suggestions', label: 'Suggestions', icon: Sparkles },
    { id: 'deliverables', label: 'Deliverables', icon: FileOutput },
    { id: 'history', label: 'Run history', icon: History },
    { id: 'approvals', label: 'Approvals', icon: ShieldCheck },
];

export function AutomationPage() {
    const controller = useAutomationCenter();
    const {
        activeTab,
        setActiveTab,
        globalEnabled,
        toggleGlobal,
        approvals,
        loading,
    } = controller;

    return (
        <>
            <Header />
            <main
                id="main-content"
                className="mx-auto max-w-7xl px-6 py-8 lg:px-12"
            >
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                    <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#4f6ef7]">
                            Safe automation
                        </p>
                        <h1 className="mt-2 text-3xl font-semibold text-zinc-950 dark:text-zinc-50">
                            Automation Center
                        </h1>
                        <p className="mt-2 max-w-2xl text-sm leading-6 text-zinc-600 dark:text-zinc-300">
                            Triggers, conditions, actions, schedules, and
                            approvals across your widgets, with consent gates
                            and no unsafe autonomous execution.
                        </p>
                    </div>
                    <div className="flex items-center gap-3 rounded-2xl border border-zinc-100 bg-white px-4 py-3 dark:border-zinc-800 dark:bg-zinc-900">
                        <Link
                            href="/automation/workflows"
                            className="text-xs font-semibold text-blue-600 dark:text-blue-400"
                        >
                            Run workflow
                        </Link>
                        <div className="text-right">
                            <p className="text-xs font-semibold text-zinc-900 dark:text-zinc-100">
                                Automations {globalEnabled ? 'on' : 'paused'}
                            </p>
                            <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
                                {globalEnabled
                                    ? 'Running with safety controls'
                                    : 'All automations are paused'}
                            </p>
                        </div>
                        <Toggle
                            enabled={globalEnabled}
                            onClick={toggleGlobal}
                            label="Master automation toggle"
                        />
                    </div>
                </div>

                <div className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-medium text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300">
                    <ShieldCheck size={12} />
                    Approval-gated · consent-aware · local-first
                </div>

                <nav
                    className="mt-6 flex gap-1 overflow-x-auto border-b border-zinc-100 dark:border-zinc-800"
                    aria-label="Automation sections"
                >
                    {TABS.map((tab) => {
                        const Icon = tab.icon;
                        const active = activeTab === tab.id;
                        const badge =
                            tab.id === 'approvals' && approvals.length > 0
                                ? approvals.length
                                : null;
                        return (
                            <button
                                key={tab.id}
                                type="button"
                                onClick={() => setActiveTab(tab.id)}
                                className={cn(
                                    'relative inline-flex shrink-0 items-center gap-1.5 border-b-2 px-3 py-2.5 text-sm font-medium transition-colors',
                                    active
                                        ? 'border-zinc-900 text-zinc-900 dark:border-zinc-100 dark:text-zinc-100'
                                        : 'border-transparent text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-200',
                                )}
                            >
                                <Icon size={15} />
                                {tab.label}
                                {badge !== null && (
                                    <span className="ml-0.5 rounded-full bg-blue-600 px-1.5 text-[10px] font-semibold text-white">
                                        {badge}
                                    </span>
                                )}
                            </button>
                        );
                    })}
                </nav>

                <div className="mt-6">
                    {loading ? (
                        <div className="flex items-center justify-center py-20 text-sm text-zinc-400">
                            <CalendarClock
                                size={16}
                                className="mr-2 animate-pulse"
                            />
                            Loading automations…
                        </div>
                    ) : (
                        <>
                            {activeTab === 'overview' && (
                                <AutomationOverview controller={controller} />
                            )}
                            {activeTab === 'automations' && (
                                <AutomationInventory controller={controller} />
                            )}
                            {activeTab === 'actions' && (
                                <AutomationActionCatalog />
                            )}
                            {activeTab === 'workstreams' && (
                                <div className="text-center py-20 text-sm text-zinc-400">
                                    Workstreams functionality - to be
                                    implemented
                                </div>
                            )}
                            {activeTab === 'suggestions' && (
                                <AutomationSuggestions
                                    controller={controller}
                                />
                            )}
                            {activeTab === 'deliverables' && (
                                <AutomationDeliverables
                                    controller={controller}
                                />
                            )}
                            {activeTab === 'history' && (
                                <AutomationRunHistory controller={controller} />
                            )}
                            {activeTab === 'approvals' && (
                                <AutomationApprovals controller={controller} />
                            )}
                        </>
                    )}
                </div>
            </main>
        </>
    );
}
