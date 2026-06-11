'use client';

import { useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import {
    CheckCircle2,
    KeyRound,
    RotateCcw,
    Search,
    ShieldAlert,
    ShieldCheck,
    Tags,
    Workflow,
} from 'lucide-react';
import { cn } from '@/lib/utils/utils';
import { EmptyState } from '@/features/ui/components/EmptyState';
import { useActionMetadataSearch } from '@/features/actions/hooks/useActionMutation';
import type { ActionDefinitionMetadata } from '@/features/actions/lib/schemas/definitionSchemas';

const ALL = 'all';

function pretty(value: string) {
    return value.replace(/[-_.]/g, ' ');
}

function Badge({
    children,
    tone = 'neutral',
}: {
    children: ReactNode;
    tone?: 'neutral' | 'green' | 'amber' | 'red' | 'blue';
}) {
    return (
        <span
            className={cn(
                'inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold capitalize',
                tone === 'green' &&
                    'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300',
                tone === 'amber' &&
                    'bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300',
                tone === 'red' &&
                    'bg-red-50 text-red-700 dark:bg-red-950/40 dark:text-red-300',
                tone === 'blue' &&
                    'bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300',
                tone === 'neutral' &&
                    'bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300',
            )}
        >
            {children}
        </span>
    );
}

function safetyTone(
    level: ActionDefinitionMetadata['destructiveLevel'],
): 'green' | 'amber' | 'red' {
    if (level === 'critical') return 'red';
    if (level === 'warning') return 'amber';
    return 'green';
}

function ActionRow({ action }: { action: ActionDefinitionMetadata }) {
    const SafetyIcon =
        action.destructiveLevel === 'safe' ? ShieldCheck : ShieldAlert;

    return (
        <div className="rounded-2xl border border-zinc-100 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                        <p className="text-sm font-semibold text-zinc-950 dark:text-zinc-50">
                            {action.label}
                        </p>
                        <Badge tone="blue">{pretty(action.category)}</Badge>
                        <Badge>{pretty(action.providerScope)}</Badge>
                    </div>
                    <p className="mt-1 text-xs font-mono text-zinc-400">
                        {action.id}
                    </p>
                    <p className="mt-2 max-w-3xl text-sm leading-6 text-zinc-600 dark:text-zinc-300">
                        {action.description}
                    </p>
                </div>

                <div className="flex shrink-0 flex-wrap gap-1.5">
                    <Badge tone={safetyTone(action.destructiveLevel)}>
                        <SafetyIcon size={11} className="mr-1" />
                        {pretty(action.destructiveLevel)}
                    </Badge>
                    <Badge
                        tone={
                            action.mutability === 'read-only'
                                ? 'green'
                                : 'amber'
                        }
                    >
                        {pretty(action.mutability)}
                    </Badge>
                    <Badge
                        tone={
                            action.queueability === 'required'
                                ? 'amber'
                                : 'neutral'
                        }
                    >
                        {pretty(action.queueability)}
                    </Badge>
                </div>
            </div>

            <div className="mt-3 grid gap-2 text-[11px] text-zinc-500 dark:text-zinc-400 md:grid-cols-2">
                <div className="flex min-w-0 items-center gap-2">
                    <KeyRound size={13} className="shrink-0 text-zinc-400" />
                    <span className="font-medium text-zinc-700 dark:text-zinc-200">
                        Permissions
                    </span>
                    <span className="truncate">
                        {action.requiredPermissions.length > 0
                            ? action.requiredPermissions.join(', ')
                            : 'None'}
                    </span>
                </div>
                <div className="flex min-w-0 items-center gap-2">
                    <CheckCircle2
                        size={13}
                        className="shrink-0 text-zinc-400"
                    />
                    <span className="font-medium text-zinc-700 dark:text-zinc-200">
                        Consents
                    </span>
                    <span className="truncate">
                        {action.requiredConsents.length > 0
                            ? action.requiredConsents.join(', ')
                            : 'None'}
                    </span>
                </div>
                <div className="flex min-w-0 items-center gap-2">
                    <RotateCcw size={13} className="shrink-0 text-zinc-400" />
                    <span className="font-medium text-zinc-700 dark:text-zinc-200">
                        Undo
                    </span>
                    <span>
                        {action.canUndo ? 'Supported' : 'Not supported'}
                    </span>
                </div>
                <div className="flex min-w-0 items-center gap-2">
                    <Tags size={13} className="shrink-0 text-zinc-400" />
                    <span className="font-medium text-zinc-700 dark:text-zinc-200">
                        Handler
                    </span>
                    <span className="truncate font-mono">
                        {action.handlerId}
                    </span>
                </div>
            </div>
        </div>
    );
}

export function AutomationActionCatalog() {
    const [query, setQuery] = useState('');
    const [category, setCategory] = useState(ALL);
    const {
        data: actions = [],
        isLoading,
        isError,
    } = useActionMetadataSearch('');

    const categories = useMemo(
        () => [ALL, ...Array.from(new Set(actions.map((a) => a.category)))],
        [actions],
    );

    const filteredActions = useMemo(() => {
        const needle = query.trim().toLowerCase();
        return actions.filter((action) => {
            const categoryMatch =
                category === ALL || action.category === category;
            if (!categoryMatch) return false;
            if (!needle) return true;
            return [
                action.id,
                action.label,
                action.description,
                action.category,
                action.providerScope,
                action.handlerId,
                action.requiredPermissions.join(' '),
                action.requiredConsents.join(' '),
            ]
                .join(' ')
                .toLowerCase()
                .includes(needle);
        });
    }, [actions, category, query]);

    if (isLoading) {
        return (
            <div className="flex items-center justify-center py-20 text-sm text-zinc-400">
                <Workflow size={16} className="mr-2 animate-pulse" />
                Loading actions…
            </div>
        );
    }

    if (isError) {
        return (
            <EmptyState
                icon={Workflow}
                title="Actions could not load"
                description="The platform action registry is unavailable right now."
            />
        );
    }

    return (
        <div className="space-y-4">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                <div>
                    <h2 className="text-lg font-semibold text-zinc-950 dark:text-zinc-50">
                        Platform actions
                    </h2>
                    <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
                        {actions.length} registered actions available to
                        widgets, agents, and automations.
                    </p>
                </div>
                <label className="flex h-9 w-full max-w-sm items-center gap-2 rounded-lg border border-zinc-200 bg-white px-3 dark:border-zinc-800 dark:bg-zinc-950">
                    <Search size={15} className="text-zinc-400" />
                    <input
                        value={query}
                        onChange={(event) => setQuery(event.target.value)}
                        placeholder="Search actions"
                        className="min-w-0 flex-1 bg-transparent text-sm text-zinc-900 outline-none placeholder:text-zinc-400 dark:text-zinc-100"
                    />
                </label>
            </div>

            <div className="flex flex-wrap gap-1.5">
                {categories.map((option) => (
                    <button
                        key={option}
                        type="button"
                        onClick={() => setCategory(option)}
                        className={cn(
                            'rounded-full px-3 py-1 text-xs font-medium capitalize transition-colors',
                            category === option
                                ? 'bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900'
                                : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700',
                        )}
                    >
                        {option === ALL ? 'All' : pretty(option)}
                    </button>
                ))}
            </div>

            {filteredActions.length === 0 ? (
                <EmptyState
                    icon={Workflow}
                    title="No actions match"
                    description="Try a different search term or category."
                    action={{
                        label: 'Clear filters',
                        onClick: () => {
                            setQuery('');
                            setCategory(ALL);
                        },
                    }}
                />
            ) : (
                <div className="grid gap-3">
                    {filteredActions.map((action) => (
                        <ActionRow key={action.id} action={action} />
                    ))}
                </div>
            )}
        </div>
    );
}
