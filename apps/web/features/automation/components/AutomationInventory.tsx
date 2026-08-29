'use client';

import { useState } from 'react';
import {
    FlaskConical,
    History,
    Play,
    Search,
    Settings2,
    Workflow,
} from 'lucide-react';
import { cn } from '@/lib/utils/utils';
import { EmptyState } from '@/features/ui/components/EmptyState';
import type {
    AutomationFilter,
    AutomationCenterController,
} from '@/features/automation/hooks/useAutomationCenter';
import type { AutomationInstance } from '@/features/automation/types/automation';
import {
    relativeTime,
    widgetEmoji,
} from '@/features/automation/lib/automationDisplay';
import { SafetyBadge, StatusBadge, Toggle } from './AutomationBadges';
import {
    deleteAutomation,
    triggerAutomation,
} from '@/features/automation/services/automationCenterService';

const FILTERS: { value: AutomationFilter; label: string }[] = [
    { value: 'all', label: 'All' },
    { value: 'active', label: 'Active' },
    { value: 'paused', label: 'Paused' },
    { value: 'needs_approval', label: 'Needs approval' },
    { value: 'needs_setup', label: 'Needs setup' },
    { value: 'scheduled', label: 'Scheduled' },
    { value: 'errors', label: 'Errors' },
];

function InstanceRow({
    instance,
    onToggle,
    onConfigure,
    onHistory,
    configureOpen,
}: {
    instance: AutomationInstance;
    onToggle: (id: string) => void;
    onConfigure: () => void;
    onHistory: () => void;
    configureOpen: boolean;
}) {
    const { definition } = instance;
    const setupRequired =
        instance.status === 'needs_setup' ||
        instance.status === 'provider_missing';

    return (
        <div className="rounded-2xl border border-zinc-100 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
            <div className="flex items-start justify-between gap-3">
                <div className="flex min-w-0 items-start gap-3">
                    <span className="text-xl leading-none">
                        {widgetEmoji(definition.widgetId)}
                    </span>
                    <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                            <p className="text-sm font-semibold text-zinc-950 dark:text-zinc-50">
                                {definition.name}
                            </p>
                            <StatusBadge status={instance.status} />
                        </div>
                        <p className="mt-0.5 text-xs text-zinc-500 dark:text-zinc-400">
                            {definition.widgetName} · {definition.category}
                        </p>
                    </div>
                </div>
                <Toggle
                    enabled={instance.enabled}
                    disabled={setupRequired}
                    onClick={() => onToggle(instance.id)}
                    label={`Toggle ${definition.name}`}
                />
            </div>

            <div className="mt-3 flex flex-wrap items-center gap-2">
                <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-[10px] font-medium text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300">
                    {definition.trigger.label}
                </span>
                <SafetyBadge level={definition.safetyLevel} />
                {instance.lastRunAt && (
                    <span className="text-[11px] text-zinc-400 dark:text-zinc-500">
                        Last run {relativeTime(instance.lastRunAt)}
                    </span>
                )}
            </div>

            {instance.errorMessage && (
                <p className="mt-2 rounded-lg bg-red-50 px-2.5 py-1.5 text-[11px] text-red-700 dark:bg-red-950/40 dark:text-red-300">
                    {instance.errorMessage}
                </p>
            )}

            {definition.consent.affectsExternal && (
                <p className="mt-2 text-[11px] text-amber-600 dark:text-amber-400">
                    Touches external services. Actions require your approval.
                </p>
            )}

            <div className="mt-3 flex items-center gap-2">
                <button
                    type="button"
                    onClick={onConfigure}
                    className={cn(
                        'inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs font-medium transition-colors',
                        configureOpen
                            ? 'border-zinc-400 bg-zinc-100 text-zinc-900 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100'
                            : 'border-zinc-200 text-zinc-600 hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800',
                    )}
                >
                    <Settings2 size={13} />
                    Configure
                </button>
                <button
                    type="button"
                    onClick={onHistory}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-200 px-2.5 py-1.5 text-xs font-medium text-zinc-600 transition-colors hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
                >
                    <History size={13} />
                    History
                </button>
            </div>

            {configureOpen && (
                <div className="mt-3 border-t border-zinc-100 pt-3 space-y-2 dark:border-zinc-800">
                    <div>
                        <label className="text-[10px] font-medium uppercase text-zinc-400">
                            Trigger
                        </label>
                        <p className="text-xs text-zinc-600 dark:text-zinc-300">
                            {definition.trigger.label}
                        </p>
                    </div>
                    {definition.approvalPolicy.required && (
                        <p className="text-[11px] text-amber-600 dark:text-amber-400">
                            This automation requires your approval before
                            executing actions.
                        </p>
                    )}
                    <button
                        type="button"
                        onClick={() =>
                            void deleteAutomation(instance.id).then(() =>
                                window.location.reload(),
                            )
                        }
                        className="text-xs text-red-500 hover:text-red-700"
                    >
                        Remove automation
                    </button>
                    <div className="flex gap-2">
                        <button
                            type="button"
                            disabled={!instance.enabled}
                            onClick={() =>
                                void triggerAutomation(instance.id).then(() =>
                                    window.location.reload(),
                                )
                            }
                            className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 disabled:text-zinc-400"
                        >
                            <Play size={12} /> Run now
                        </button>
                        <button
                            type="button"
                            onClick={() =>
                                void triggerAutomation(instance.id, true).then(
                                    () => window.location.reload(),
                                )
                            }
                            className="inline-flex items-center gap-1 text-xs font-semibold text-zinc-600 dark:text-zinc-300"
                        >
                            <FlaskConical size={12} /> Dry run
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}

export function AutomationInventory({
    controller,
}: {
    controller: AutomationCenterController;
}) {
    const {
        filteredInstances,
        instances,
        search,
        setSearch,
        filter,
        setFilter,
        toggleAutomation,
        setActiveTab,
    } = controller;
    const [configureId, setConfigureId] = useState<string | null>(null);

    return (
        <div className="space-y-4">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                <label className="flex h-9 w-full max-w-sm items-center gap-2 rounded-lg border border-zinc-200 bg-white px-3 dark:border-zinc-800 dark:bg-zinc-950">
                    <Search size={15} className="text-zinc-400" />
                    <input
                        value={search}
                        onChange={(event) => setSearch(event.target.value)}
                        placeholder="Search automations"
                        className="min-w-0 flex-1 bg-transparent text-sm text-zinc-900 outline-none placeholder:text-zinc-400 dark:text-zinc-100"
                    />
                </label>
                <div className="flex flex-wrap gap-1.5">
                    {FILTERS.map((option) => (
                        <button
                            key={option.value}
                            type="button"
                            onClick={() => setFilter(option.value)}
                            className={cn(
                                'rounded-full px-3 py-1 text-xs font-medium transition-colors',
                                filter === option.value
                                    ? 'bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900'
                                    : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700',
                            )}
                        >
                            {option.label}
                        </button>
                    ))}
                </div>
            </div>

            {filteredInstances.length === 0 ? (
                <EmptyState
                    icon={Workflow}
                    title={
                        instances.length === 0
                            ? 'No automations yet'
                            : 'No automations match your filters'
                    }
                    description={
                        instances.length === 0
                            ? 'Set up an automation from a suggestion to get started.'
                            : 'Try a different filter or clear your search.'
                    }
                    action={
                        instances.length === 0
                            ? {
                                  label: 'Browse suggestions',
                                  onClick: () => setActiveTab('suggestions'),
                              }
                            : {
                                  label: 'Clear filters',
                                  onClick: () => {
                                      setFilter('all');
                                      setSearch('');
                                  },
                              }
                    }
                />
            ) : (
                <div className="grid gap-3">
                    {filteredInstances.map((instance) => (
                        <InstanceRow
                            key={instance.id}
                            instance={instance}
                            onToggle={toggleAutomation}
                            onConfigure={() =>
                                setConfigureId((id) =>
                                    id === instance.id ? null : instance.id,
                                )
                            }
                            onHistory={() => setActiveTab('history')}
                            configureOpen={configureId === instance.id}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}
