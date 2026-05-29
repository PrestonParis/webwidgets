'use client';

import { useState } from 'react';
import {
    Check,
    Circle,
    CircleAlert,
    CircleDashed,
    CircleOff,
    Filter,
    GitBranch,
    Plus,
    RefreshCcw,
    Search,
    ShieldCheck,
    Trash2,
    Users,
} from 'lucide-react';
import { Button } from '@/features/ui/components/Button';
import { useToastContext } from '@/features/ui/components/ToastProvider';
import { cn } from '@/lib/utils/utils';
import { scopeIcons } from '../constants';
import { useCollaborationWorkspace } from '../hooks/useCollaborationWorkspace';
import type {
    HandoffRecord,
    WorkspaceRecord,
} from '../hooks/useCollaborationWorkspace';
import { MembersPanel } from './MembersPanel';
import { ActivityFeed } from './ActivityFeed';
import { ApprovalsPanel } from './ApprovalsPanel';
import { CommentsPanel } from './CommentsPanel';

const statusStyles: Record<string, string> = {
    live: 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950/30 dark:text-emerald-300',
    idle: 'border-sky-200 bg-sky-50 text-sky-700 dark:border-sky-900 dark:bg-sky-950/30 dark:text-sky-300',
    blocked:
        'border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-900 dark:bg-rose-950/30 dark:text-rose-300',
    offline:
        'border-zinc-200 bg-zinc-50 text-zinc-600 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-300',
};

const statusIcons: Record<string, typeof Circle> = {
    live: Circle,
    idle: CircleDashed,
    blocked: CircleAlert,
    offline: CircleOff,
};

const priorityStyles: Record<string, string> = {
    critical: 'bg-rose-600 text-white',
    high: 'bg-amber-500 text-white',
    medium: 'bg-blue-600 text-white',
    low: 'bg-zinc-200 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-200',
};

type RightTab = 'members' | 'activity' | 'approvals';

function ProgressBar({ value }: { value: number }) {
    return (
        <div className="h-2 rounded-full bg-zinc-100 dark:bg-zinc-800">
            <div
                className={cn(
                    'h-full rounded-full',
                    value >= 95
                        ? 'bg-emerald-500'
                        : value >= 85
                          ? 'bg-blue-500'
                          : 'bg-amber-500',
                )}
                style={{ width: `${value}%` }}
            />
        </div>
    );
}

function StatusBadge({ status }: { status: string }) {
    const Icon = statusIcons[status] ?? Circle;
    const style = statusStyles[status] ?? statusStyles.offline;
    return (
        <span
            className={cn(
                'inline-flex h-6 items-center gap-1.5 rounded-full border px-2 text-xs font-medium',
                style,
            )}
        >
            <Icon size={10} fill="currentColor" />
            {status.charAt(0).toUpperCase() + status.slice(1)}
        </span>
    );
}

function ScopeMark({ scope }: { scope: string }) {
    const Icon = scopeIcons[scope] ?? scopeIcons.General!;
    return (
        <span className="inline-flex items-center gap-2 text-sm font-medium text-zinc-800 dark:text-zinc-100">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300">
                <Icon size={14} />
            </span>
            {scope}
        </span>
    );
}

function WorkspaceCard({
    workspace,
    active,
    onSelect,
}: {
    workspace: WorkspaceRecord;
    active: boolean;
    onSelect: (id: string) => void;
}) {
    return (
        <button
            type="button"
            onClick={() => onSelect(workspace.id)}
            className={cn(
                'w-full rounded-lg border p-4 text-left transition',
                active
                    ? 'border-blue-400 bg-blue-50 dark:border-blue-800 dark:bg-blue-950/25'
                    : 'border-zinc-200 bg-white hover:border-zinc-300 dark:border-zinc-800 dark:bg-zinc-900 dark:hover:border-zinc-700',
            )}
        >
            <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                    <h3 className="truncate text-sm font-semibold text-zinc-950 dark:text-zinc-50">
                        {workspace.name}
                    </h3>
                    <div className="mt-2">
                        <ScopeMark scope={workspace.scope} />
                    </div>
                </div>
                <StatusBadge status={workspace.status} />
            </div>
            {workspace.description && (
                <p className="mt-3 line-clamp-2 text-sm leading-6 text-zinc-600 dark:text-zinc-300">
                    {workspace.description}
                </p>
            )}
        </button>
    );
}

function HandoffRow({
    item,
    selected,
    onToggle,
    onDelete,
    onSelect,
}: {
    item: HandoffRecord;
    selected: boolean;
    onToggle: (id: string) => void;
    onDelete: (id: string) => void;
    onSelect: (id: string) => void;
}) {
    return (
        <div
            className={cn(
                'flex w-full items-start gap-3 rounded-lg border p-3 transition',
                selected
                    ? 'border-blue-400 bg-blue-50 dark:border-blue-800 dark:bg-blue-950/20'
                    : 'border-zinc-200 bg-white hover:border-zinc-300 dark:border-zinc-800 dark:bg-zinc-900 dark:hover:border-zinc-700',
            )}
        >
            <button
                type="button"
                onClick={() => onToggle(item.id)}
                className={cn(
                    'mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded border',
                    item.complete
                        ? 'border-emerald-500 bg-emerald-500 text-white'
                        : 'border-zinc-300 text-transparent dark:border-zinc-700',
                )}
                aria-label={item.complete ? 'Mark incomplete' : 'Mark complete'}
            >
                <Check size={13} />
            </button>
            <button
                type="button"
                onClick={() => onSelect(item.id)}
                className="min-w-0 flex-1 text-left"
            >
                <span
                    className={cn(
                        'block text-sm font-medium text-zinc-900 dark:text-zinc-100',
                        item.complete && 'text-zinc-400 line-through',
                    )}
                >
                    {item.title}
                </span>
                <span className="mt-2 flex flex-wrap items-center gap-2 text-xs text-zinc-500 dark:text-zinc-400">
                    <span
                        className={cn(
                            'rounded px-1.5 py-0.5 text-[11px] font-semibold uppercase',
                            priorityStyles[item.priority],
                        )}
                    >
                        {item.priority}
                    </span>
                    <span>{item.scope}</span>
                    {item.owner && <span>{item.owner}</span>}
                    {item.due && <span>{item.due}</span>}
                </span>
            </button>
            <button
                type="button"
                onClick={() => onDelete(item.id)}
                aria-label="Delete handoff"
                className="mt-0.5 shrink-0 rounded p-1 text-zinc-400 transition hover:bg-zinc-100 hover:text-rose-600 dark:hover:bg-zinc-800 dark:hover:text-rose-400"
            >
                <Trash2 size={14} />
            </button>
        </div>
    );
}

// Placeholder user ID — in a real app this would come from a session/auth context.
// We pass it through to child panels which need it for ownership checks.
const PLACEHOLDER_USER_ID = '';

export function CollaborationWorkspacePage() {
    const {
        workspaces,
        visibleWorkspaces,
        selectedWorkspaceId,
        setSelectedWorkspaceId,
        filters,
        updateFilter,
        resetFilters,
        scopes,
        handoffs,
        toggleHandoff,
        deleteHandoff,
        handoffCompletion,
        loading,
        createWorkspace,
        createHandoff,
    } = useCollaborationWorkspace();
    const toast = useToastContext();

    const [showWsForm, setShowWsForm] = useState(false);
    const [wsName, setWsName] = useState('');
    const [wsScope, setWsScope] = useState('General');
    const [wsDesc, setWsDesc] = useState('');
    const [wsSubmitting, setWsSubmitting] = useState(false);

    const [showHandoffForm, setShowHandoffForm] = useState(false);
    const [hoTitle, setHoTitle] = useState('');
    const [hoOwner, setHoOwner] = useState('');
    const [hoPriority, setHoPriority] = useState('medium');
    const [hoDue, setHoDue] = useState('');
    const [hoSubmitting, setHoSubmitting] = useState(false);

    const [rightTab, setRightTab] = useState<RightTab>('members');
    const [selectedHandoffId, setSelectedHandoffId] = useState<string | null>(
        null,
    );

    const selectedWorkspace =
        workspaces.find((w) => w.id === selectedWorkspaceId) ?? null;

    // Determine ownership/role from workspace owner_id.
    // The workspace user_id field is the owner; we use PLACEHOLDER_USER_ID which
    // should be replaced with real auth session user ID in production.
    const isOwner = selectedWorkspace?.user_id === PLACEHOLDER_USER_ID;
    const isEditor = false; // Would be derived from MemberRecord in a full auth implementation.
    const canApprove = isOwner || isEditor;

    const workspaceHandoffs = selectedWorkspaceId
        ? handoffs.filter((h) => h.workspace_id === selectedWorkspaceId)
        : handoffs;

    async function handleCreateWorkspace(e: React.FormEvent) {
        e.preventDefault();
        if (!wsName.trim()) return;
        setWsSubmitting(true);
        try {
            await createWorkspace({
                name: wsName.trim(),
                scope: wsScope,
                ...(wsDesc.trim() ? { description: wsDesc.trim() } : {}),
            });
            setWsName('');
            setWsScope('General');
            setWsDesc('');
            setShowWsForm(false);
            toast.success('Workspace created.');
        } catch {
            toast.error('Failed to create workspace.');
        } finally {
            setWsSubmitting(false);
        }
    }

    async function handleCreateHandoff(e: React.FormEvent) {
        e.preventDefault();
        if (!hoTitle.trim()) return;
        setHoSubmitting(true);
        try {
            await createHandoff({
                title: hoTitle.trim(),
                priority: hoPriority,
                ...(hoOwner.trim() ? { owner: hoOwner.trim() } : {}),
                ...(hoDue.trim() ? { due: hoDue.trim() } : {}),
                ...(selectedWorkspaceId
                    ? { workspace_id: selectedWorkspaceId }
                    : {}),
            });
            setHoTitle('');
            setHoOwner('');
            setHoPriority('medium');
            setHoDue('');
            setShowHandoffForm(false);
            toast.success('Handoff created.');
        } catch {
            toast.error('Failed to create handoff.');
        } finally {
            setHoSubmitting(false);
        }
    }

    async function handleDeleteHandoff(id: string) {
        try {
            await deleteHandoff(id);
            if (selectedHandoffId === id) setSelectedHandoffId(null);
            toast.success('Handoff deleted.');
        } catch {
            toast.error('Failed to delete handoff.');
        }
    }

    function handleSelectHandoff(id: string) {
        setSelectedHandoffId((prev) => (prev === id ? null : id));
    }

    const tabClasses = (active: boolean) =>
        cn(
            'px-3 py-1.5 text-sm font-medium rounded-lg transition',
            active
                ? 'bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900'
                : 'text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:text-zinc-100 dark:hover:bg-zinc-800',
        );

    return (
        <main
            id="main-content"
            className="min-h-screen bg-zinc-50 px-6 py-8 dark:bg-zinc-950 lg:px-12"
        >
            <section className="mx-auto flex max-w-7xl flex-col gap-6">
                {/* Header */}
                <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
                    <div className="max-w-3xl">
                        <div className="flex flex-wrap items-center gap-2">
                            <span className="inline-flex h-7 items-center gap-2 rounded-full border border-blue-200 bg-blue-50 px-3 text-xs font-semibold text-blue-700 dark:border-blue-900 dark:bg-blue-950/30 dark:text-blue-300">
                                <Users size={13} />
                                Collaboration
                            </span>
                            <span className="inline-flex h-7 items-center gap-2 rounded-full border border-zinc-200 bg-white px-3 text-xs font-medium text-zinc-600 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300">
                                <ShieldCheck size={13} />
                                Permissioned workspace sync
                            </span>
                        </div>
                        <h1 className="mt-4 text-3xl font-semibold text-zinc-950 dark:text-zinc-50 md:text-4xl">
                            Coordinate shared dashboards, agents, approvals, and
                            workspace state.
                        </h1>
                        <p className="mt-3 max-w-2xl text-sm leading-6 text-zinc-600 dark:text-zinc-300">
                            A collaboration surface for shared workspaces, human
                            handoffs, and workspace activity.
                        </p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                        <Button
                            variant="secondary"
                            icon={RefreshCcw}
                            onClick={resetFilters}
                        >
                            Reset
                        </Button>
                        <Button icon={Plus} onClick={() => setShowWsForm(true)}>
                            Create workspace
                        </Button>
                    </div>
                </div>

                {/* 2-column layout */}
                <section className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_380px]">
                    {/* LEFT: workspace list + handoffs */}
                    <div className="space-y-6">
                        {/* Filters */}
                        <div className="rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
                            <div className="flex flex-col gap-4 lg:flex-row lg:items-end">
                                <label className="min-w-0 flex-1 text-xs font-medium text-zinc-500 dark:text-zinc-400">
                                    Search shared spaces
                                    <span className="mt-1 flex h-9 items-center gap-2 rounded-lg border border-zinc-200 bg-white px-3 dark:border-zinc-800 dark:bg-zinc-950">
                                        <Search
                                            size={15}
                                            className="text-zinc-400"
                                        />
                                        <input
                                            value={filters.query}
                                            onChange={(event) =>
                                                updateFilter(
                                                    'query',
                                                    event.target.value,
                                                )
                                            }
                                            placeholder="Dashboard, files, approval, sync"
                                            className="min-w-0 flex-1 bg-transparent text-sm text-zinc-900 outline-none placeholder:text-zinc-400 dark:text-zinc-100"
                                        />
                                    </span>
                                </label>
                                <label className="grid gap-1 text-xs font-medium text-zinc-500 dark:text-zinc-400">
                                    Scope
                                    <select
                                        value={filters.scope}
                                        onChange={(event) =>
                                            updateFilter(
                                                'scope',
                                                event.target
                                                    .value as typeof filters.scope,
                                            )
                                        }
                                        className="h-9 rounded-lg border border-zinc-200 bg-white px-3 text-sm text-zinc-900 outline-none dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-100"
                                    >
                                        <option value="all">All scopes</option>
                                        {scopes.map((scope) => (
                                            <option key={scope} value={scope}>
                                                {scope}
                                            </option>
                                        ))}
                                    </select>
                                </label>
                                <label className="grid gap-1 text-xs font-medium text-zinc-500 dark:text-zinc-400">
                                    Status
                                    <select
                                        value={filters.status}
                                        onChange={(event) =>
                                            updateFilter(
                                                'status',
                                                event.target
                                                    .value as typeof filters.status,
                                            )
                                        }
                                        className="h-9 rounded-lg border border-zinc-200 bg-white px-3 text-sm text-zinc-900 outline-none dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-100"
                                    >
                                        <option value="all">
                                            All statuses
                                        </option>
                                        <option value="live">Live</option>
                                        <option value="idle">Idle</option>
                                        <option value="blocked">Blocked</option>
                                    </select>
                                </label>
                                <Button
                                    variant="secondary"
                                    icon={Filter}
                                    onClick={() =>
                                        updateFilter('status', 'live')
                                    }
                                >
                                    Live only
                                </Button>
                            </div>
                        </div>

                        {/* Workspace list */}
                        <section>
                            <div className="mb-3 flex items-center justify-between gap-3">
                                <div>
                                    <h2 className="text-base font-semibold text-zinc-950 dark:text-zinc-50">
                                        Shared workspaces
                                    </h2>
                                    <p className="text-sm text-zinc-500 dark:text-zinc-400">
                                        {visibleWorkspaces.length}{' '}
                                        {visibleWorkspaces.length === 1
                                            ? 'workspace'
                                            : 'workspaces'}
                                    </p>
                                </div>
                                <Button
                                    size="sm"
                                    variant="secondary"
                                    icon={Plus}
                                    onClick={() => setShowWsForm(true)}
                                >
                                    Add
                                </Button>
                            </div>

                            {showWsForm && (
                                <form
                                    onSubmit={(e) => {
                                        void handleCreateWorkspace(e);
                                    }}
                                    className="mb-4 rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900 space-y-3"
                                >
                                    <h3 className="text-sm font-semibold text-zinc-950 dark:text-zinc-50">
                                        Create workspace
                                    </h3>
                                    <div className="grid gap-3 sm:grid-cols-2">
                                        <div>
                                            <label className="text-xs font-medium text-zinc-500">
                                                Name *
                                            </label>
                                            <input
                                                value={wsName}
                                                onChange={(e) =>
                                                    setWsName(e.target.value)
                                                }
                                                placeholder="Workspace name"
                                                required
                                                className="mt-1 w-full rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm outline-none dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-100"
                                            />
                                        </div>
                                        <div>
                                            <label className="text-xs font-medium text-zinc-500">
                                                Scope
                                            </label>
                                            <select
                                                value={wsScope}
                                                onChange={(e) =>
                                                    setWsScope(e.target.value)
                                                }
                                                className="mt-1 w-full rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm outline-none dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-100"
                                            >
                                                <option value="General">
                                                    General
                                                </option>
                                                <option value="Dashboard">
                                                    Dashboard
                                                </option>
                                                <option value="Widgets">
                                                    Widgets
                                                </option>
                                                <option value="Files">
                                                    Files
                                                </option>
                                                <option value="Automations">
                                                    Automations
                                                </option>
                                                <option value="Knowledge">
                                                    Knowledge
                                                </option>
                                                <option value="Finance">
                                                    Finance
                                                </option>
                                            </select>
                                        </div>
                                        <div className="sm:col-span-2">
                                            <label className="text-xs font-medium text-zinc-500">
                                                Description
                                            </label>
                                            <input
                                                value={wsDesc}
                                                onChange={(e) =>
                                                    setWsDesc(e.target.value)
                                                }
                                                placeholder="What is this workspace for?"
                                                className="mt-1 w-full rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm outline-none dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-100"
                                            />
                                        </div>
                                    </div>
                                    <div className="flex gap-2">
                                        <Button
                                            type="submit"
                                            loading={wsSubmitting}
                                        >
                                            Create
                                        </Button>
                                        <Button
                                            type="button"
                                            variant="secondary"
                                            onClick={() => setShowWsForm(false)}
                                        >
                                            Cancel
                                        </Button>
                                    </div>
                                </form>
                            )}

                            {loading ? (
                                <div className="rounded-lg border border-zinc-200 bg-white p-8 text-center text-sm text-zinc-500 dark:border-zinc-800 dark:bg-zinc-900">
                                    Loading workspaces…
                                </div>
                            ) : visibleWorkspaces.length === 0 ? (
                                <div className="rounded-lg border border-dashed border-zinc-300 bg-white p-8 text-center dark:border-zinc-700 dark:bg-zinc-900">
                                    <p className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                                        No shared workspaces yet
                                    </p>
                                    <p className="mt-1 text-xs text-zinc-500">
                                        Create a workspace to start
                                        collaborating.
                                    </p>
                                    <Button
                                        className="mt-4"
                                        size="sm"
                                        icon={Plus}
                                        onClick={() => setShowWsForm(true)}
                                    >
                                        Create workspace
                                    </Button>
                                </div>
                            ) : (
                                <div className="grid gap-3 lg:grid-cols-2">
                                    {visibleWorkspaces.map((workspace) => (
                                        <WorkspaceCard
                                            key={workspace.id}
                                            workspace={workspace}
                                            active={
                                                workspace.id ===
                                                selectedWorkspaceId
                                            }
                                            onSelect={(id) => {
                                                setSelectedWorkspaceId(id);
                                                setSelectedHandoffId(null);
                                            }}
                                        />
                                    ))}
                                </div>
                            )}
                        </section>

                        {/* Handoff queue */}
                        {selectedWorkspace && (
                            <section className="rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
                                <div className="mb-4 flex items-center justify-between gap-3">
                                    <div>
                                        <h2 className="text-base font-semibold text-zinc-950 dark:text-zinc-50">
                                            Handoff queue
                                        </h2>
                                        <p className="text-sm text-zinc-500 dark:text-zinc-400">
                                            {selectedWorkspace.name}
                                            {selectedWorkspace.user_id ===
                                                PLACEHOLDER_USER_ID && (
                                                <span className="ml-2 inline-flex items-center rounded-full border border-purple-200 bg-purple-50 px-2 py-0.5 text-[11px] font-medium text-purple-700 dark:border-purple-800 dark:bg-purple-950/30 dark:text-purple-300">
                                                    Owner
                                                </span>
                                            )}
                                        </p>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <GitBranch
                                            size={18}
                                            className="text-zinc-400"
                                        />
                                        <Button
                                            size="sm"
                                            variant="secondary"
                                            icon={Plus}
                                            onClick={() =>
                                                setShowHandoffForm(true)
                                            }
                                        >
                                            Add
                                        </Button>
                                    </div>
                                </div>

                                {workspaceHandoffs.length > 0 && (
                                    <div className="mb-4">
                                        <ProgressBar
                                            value={handoffCompletion}
                                        />
                                    </div>
                                )}

                                {showHandoffForm && (
                                    <form
                                        onSubmit={(e) => {
                                            void handleCreateHandoff(e);
                                        }}
                                        className="mb-3 rounded-lg border border-zinc-200 bg-zinc-50 p-3 dark:border-zinc-800 dark:bg-zinc-950 space-y-2"
                                    >
                                        <input
                                            value={hoTitle}
                                            onChange={(e) =>
                                                setHoTitle(e.target.value)
                                            }
                                            placeholder="Handoff title *"
                                            required
                                            className="w-full rounded border border-zinc-200 bg-white px-3 py-1.5 text-sm outline-none dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-100"
                                        />
                                        <div className="grid grid-cols-2 gap-2">
                                            <input
                                                value={hoOwner}
                                                onChange={(e) =>
                                                    setHoOwner(e.target.value)
                                                }
                                                placeholder="Owner (optional)"
                                                className="rounded border border-zinc-200 bg-white px-2 py-1.5 text-sm outline-none dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-100"
                                            />
                                            <select
                                                value={hoPriority}
                                                onChange={(e) =>
                                                    setHoPriority(
                                                        e.target.value,
                                                    )
                                                }
                                                className="rounded border border-zinc-200 bg-white px-2 py-1.5 text-sm outline-none dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-100"
                                            >
                                                <option value="low">Low</option>
                                                <option value="medium">
                                                    Medium
                                                </option>
                                                <option value="high">
                                                    High
                                                </option>
                                                <option value="critical">
                                                    Critical
                                                </option>
                                            </select>
                                        </div>
                                        <input
                                            value={hoDue}
                                            onChange={(e) =>
                                                setHoDue(e.target.value)
                                            }
                                            placeholder="Due (optional)"
                                            className="w-full rounded border border-zinc-200 bg-white px-3 py-1.5 text-sm outline-none dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-100"
                                        />
                                        <div className="flex gap-2">
                                            <Button
                                                type="submit"
                                                size="sm"
                                                loading={hoSubmitting}
                                            >
                                                Add handoff
                                            </Button>
                                            <Button
                                                type="button"
                                                size="sm"
                                                variant="secondary"
                                                onClick={() =>
                                                    setShowHandoffForm(false)
                                                }
                                            >
                                                Cancel
                                            </Button>
                                        </div>
                                    </form>
                                )}

                                {workspaceHandoffs.length === 0 ? (
                                    <div className="rounded-lg bg-zinc-50 p-4 text-center text-sm text-zinc-500 dark:bg-zinc-950">
                                        No handoffs yet. Add one to track work
                                        that needs attention.
                                    </div>
                                ) : (
                                    <div className="grid gap-2">
                                        {workspaceHandoffs.map((item) => (
                                            <HandoffRow
                                                key={item.id}
                                                item={item}
                                                selected={
                                                    selectedHandoffId ===
                                                    item.id
                                                }
                                                onToggle={() =>
                                                    void toggleHandoff(item.id)
                                                }
                                                onDelete={() =>
                                                    void handleDeleteHandoff(
                                                        item.id,
                                                    )
                                                }
                                                onSelect={handleSelectHandoff}
                                            />
                                        ))}
                                    </div>
                                )}
                            </section>
                        )}

                        {/* Comments for selected handoff */}
                        {selectedWorkspaceId && (
                            <section className="rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
                                <CommentsPanel
                                    workspaceId={selectedWorkspaceId}
                                    handoffId={selectedHandoffId}
                                    currentUserId={PLACEHOLDER_USER_ID}
                                />
                            </section>
                        )}
                    </div>

                    {/* RIGHT: tabbed panel */}
                    <aside className="space-y-4">
                        {selectedWorkspaceId ? (
                            <section className="rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
                                {/* Tab bar */}
                                <div className="mb-4 flex gap-1 rounded-xl bg-zinc-100 p-1 dark:bg-zinc-800">
                                    <button
                                        type="button"
                                        onClick={() => setRightTab('members')}
                                        className={tabClasses(
                                            rightTab === 'members',
                                        )}
                                    >
                                        Members
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setRightTab('activity')}
                                        className={tabClasses(
                                            rightTab === 'activity',
                                        )}
                                    >
                                        Activity
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setRightTab('approvals')}
                                        className={tabClasses(
                                            rightTab === 'approvals',
                                        )}
                                    >
                                        Approvals
                                    </button>
                                </div>

                                {rightTab === 'members' && (
                                    <MembersPanel
                                        workspaceId={selectedWorkspaceId}
                                        currentUserId={PLACEHOLDER_USER_ID}
                                        isOwner={isOwner}
                                        isEditor={isEditor}
                                    />
                                )}
                                {rightTab === 'activity' && (
                                    <ActivityFeed
                                        workspaceId={selectedWorkspaceId}
                                    />
                                )}
                                {rightTab === 'approvals' && (
                                    <ApprovalsPanel
                                        workspaceId={selectedWorkspaceId}
                                        currentUserId={PLACEHOLDER_USER_ID}
                                        canApprove={canApprove}
                                    />
                                )}
                            </section>
                        ) : (
                            <div className="rounded-lg border border-dashed border-zinc-300 bg-white p-8 text-center dark:border-zinc-700 dark:bg-zinc-900">
                                <Users
                                    size={24}
                                    className="mx-auto mb-2 text-zinc-400"
                                />
                                <p className="text-sm text-zinc-500 dark:text-zinc-400">
                                    Select a workspace to see members, activity,
                                    and approvals.
                                </p>
                            </div>
                        )}
                    </aside>
                </section>
            </section>
        </main>
    );
}
