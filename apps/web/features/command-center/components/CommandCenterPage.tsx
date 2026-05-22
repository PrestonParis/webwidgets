'use client';

import { useState } from 'react';
import {
    ArrowDownUp,
    Clock3,
    Filter,
    Gauge,
    PanelsTopLeft,
    Plus,
    RotateCcw,
    Search,
    ShieldCheck,
    SlidersHorizontal,
    TableProperties,
    Workflow,
} from 'lucide-react';
import { Button, IconButton } from '@/features/ui/components/Button';
import { useToastContext } from '@/features/ui/components/ToastProvider';
import { cn } from '@/lib/utils/utils';
import { domainIcons } from '../data';
import { useCommandCenter } from '../hooks/useCommandCenter';
import type {
    CommandFilters,
    CommandPriority,
    CommandStatus,
    CommandWorkstream,
} from '../types';

const statusLabels: Record<CommandStatus, string> = {
    healthy: 'Healthy',
    attention: 'Attention',
    blocked: 'Blocked',
    queued: 'Queued',
};

const statusStyles: Record<CommandStatus, string> = {
    healthy:
        'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950/30 dark:text-emerald-300',
    attention:
        'border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900 dark:bg-amber-950/30 dark:text-amber-300',
    blocked:
        'border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-900 dark:bg-rose-950/30 dark:text-rose-300',
    queued:
        'border-sky-200 bg-sky-50 text-sky-700 dark:border-sky-900 dark:bg-sky-950/30 dark:text-sky-300',
};

const priorityStyles: Record<CommandPriority, string> = {
    critical: 'bg-rose-600 text-white',
    high: 'bg-amber-500 text-white',
    medium: 'bg-sky-600 text-white',
    low: 'bg-zinc-200 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-200',
};

function StatusBadge({ status }: { status: CommandStatus }) {
    return (
        <span className={cn('inline-flex h-6 items-center rounded-full border px-2 text-xs font-medium', statusStyles[status])}>
            {statusLabels[status]}
        </span>
    );
}

function PriorityBadge({ priority }: { priority: CommandPriority }) {
    return (
        <span className={cn('inline-flex h-5 items-center rounded px-1.5 text-[11px] font-semibold uppercase', priorityStyles[priority])}>
            {priority}
        </span>
    );
}

function SelectField<Value extends string>({
    label,
    value,
    options,
    onChange,
}: {
    label: string;
    value: Value;
    options: { label: string; value: Value }[];
    onChange: (value: Value) => void;
}) {
    return (
        <label className="grid gap-1 text-xs font-medium text-zinc-500 dark:text-zinc-400">
            {label}
            <select
                value={value}
                onChange={(event) => onChange(event.target.value as Value)}
                className="h-9 rounded-lg border border-zinc-200 bg-white px-3 text-sm text-zinc-900 outline-none transition focus:border-zinc-400 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-100"
            >
                {options.map((option) => (
                    <option key={option.value} value={option.value}>
                        {option.label}
                    </option>
                ))}
            </select>
        </label>
    );
}

function DomainMark({ domain }: { domain: string }) {
    const Icon = domainIcons[domain] ?? domainIcons.General!;
    return (
        <span className="inline-flex items-center gap-2 text-sm font-medium text-zinc-800 dark:text-zinc-100">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300">
                <Icon size={14} />
            </span>
            {domain}
        </span>
    );
}

function ProgressBar({ value }: { value: number }) {
    return (
        <div className="h-2 w-full rounded-full bg-zinc-100 dark:bg-zinc-800">
            <div
                className="h-full rounded-full bg-zinc-900 transition-all dark:bg-zinc-100"
                style={{ width: `${value}%` }}
            />
        </div>
    );
}

function WorkstreamTable({
    workstreams,
    selectedId,
    onSelect,
}: {
    workstreams: CommandWorkstream[];
    selectedId: string;
    onSelect: (id: string) => void;
}) {
    return (
        <div className="overflow-hidden rounded-lg border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
            <div className="grid min-w-[900px] grid-cols-[1.4fr_0.9fr_0.7fr_0.7fr_0.8fr_0.8fr] border-b border-zinc-100 bg-zinc-50 px-4 py-3 text-xs font-semibold uppercase text-zinc-500 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-400">
                <span>Workstream</span>
                <span>Domain</span>
                <span>Status</span>
                <span>Priority</span>
                <span>Progress</span>
                <span>Confidence</span>
            </div>
            <div className="max-h-[430px] min-w-[900px] overflow-y-auto">
                {workstreams.map((workstream) => (
                    <button
                        type="button"
                        key={workstream.id}
                        onClick={() => onSelect(workstream.id)}
                        className={cn(
                            'grid w-full grid-cols-[1.4fr_0.9fr_0.7fr_0.7fr_0.8fr_0.8fr] items-center gap-3 border-b border-zinc-100 px-4 py-4 text-left transition last:border-b-0 dark:border-zinc-800',
                            selectedId === workstream.id
                                ? 'bg-blue-50/70 dark:bg-blue-950/20'
                                : 'hover:bg-zinc-50 dark:hover:bg-zinc-950',
                        )}
                    >
                        <span className="min-w-0">
                            <span className="block truncate text-sm font-semibold text-zinc-950 dark:text-zinc-50">
                                {workstream.title}
                            </span>
                            {workstream.nextStep && (
                                <span className="mt-1 block truncate text-xs text-zinc-500 dark:text-zinc-400">
                                    {workstream.nextStep}
                                </span>
                            )}
                        </span>
                        <DomainMark domain={workstream.domain} />
                        <StatusBadge status={workstream.status} />
                        <PriorityBadge priority={workstream.priority} />
                        <span className="flex items-center gap-2 text-sm text-zinc-600 dark:text-zinc-300">
                            <ProgressBar value={workstream.progress} />
                            {workstream.progress}%
                        </span>
                        <span className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                            {workstream.confidence}%
                        </span>
                    </button>
                ))}
            </div>
        </div>
    );
}

export function CommandCenterPage() {
    const {
        filters,
        updateFilter,
        resetFilters,
        filteredWorkstreams,
        selectedWorkstream,
        selectedWorkstreamId,
        setSelectedWorkstreamId,
        domains,
        loading,
        createWorkstream,
    } = useCommandCenter();
    const toast = useToastContext();

    const [showForm, setShowForm] = useState(false);
    const [formTitle, setFormTitle] = useState('');
    const [formDomain, setFormDomain] = useState('General');
    const [formPriority, setFormPriority] = useState<CommandPriority>('medium');
    const [formStatus, setFormStatus] = useState<CommandStatus>('queued');
    const [formNextStep, setFormNextStep] = useState('');
    const [formDue, setFormDue] = useState('');
    const [submitting, setSubmitting] = useState(false);

    async function handleCreate(e: React.FormEvent) {
        e.preventDefault();
        if (!formTitle.trim()) return;
        setSubmitting(true);
        try {
            await createWorkstream({
                title: formTitle.trim(),
                domain: formDomain,
                priority: formPriority,
                status: formStatus,
                ...(formNextStep.trim() ? { next_step: formNextStep.trim() } : {}),
                ...(formDue.trim() ? { due: formDue.trim() } : {}),
            });
            setFormTitle('');
            setFormDomain('General');
            setFormPriority('medium');
            setFormStatus('queued');
            setFormNextStep('');
            setFormDue('');
            setShowForm(false);
            toast.success('Workstream created.');
        } catch {
            toast.error('Failed to create workstream.');
        } finally {
            setSubmitting(false);
        }
    }

    const domainOptions = [
        { label: 'All domains', value: 'all' as const },
        ...domains.map((domain) => ({ label: domain, value: domain })),
    ];

    return (
        <main className="min-h-screen bg-zinc-50 px-6 py-8 dark:bg-zinc-950 lg:px-12">
            <section className="mx-auto flex max-w-7xl flex-col gap-6">
                <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
                    <div className="max-w-3xl">
                        <div className="flex flex-wrap items-center gap-2">
                            <span className="inline-flex h-7 items-center gap-2 rounded-full border border-blue-200 bg-blue-50 px-3 text-xs font-semibold text-blue-700 dark:border-blue-900 dark:bg-blue-950/30 dark:text-blue-300">
                                <PanelsTopLeft size={13} />
                                Command center
                            </span>
                            <span className="inline-flex h-7 items-center gap-2 rounded-full border border-zinc-200 bg-white px-3 text-xs font-medium text-zinc-600 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300">
                                <ShieldCheck size={13} />
                                Workstream orchestration
                            </span>
                        </div>
                        <h1 className="mt-4 text-3xl font-semibold tracking-normal text-zinc-950 dark:text-zinc-50 md:text-4xl">
                            Operational cockpit for every workstream, signal, and automation queue.
                        </h1>
                        <p className="mt-3 max-w-2xl text-sm leading-6 text-zinc-600 dark:text-zinc-300">
                            A single surface for prioritizing workstreams, tracking progress, and managing the work that matters.
                        </p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                        <Button variant="secondary" icon={RotateCcw} onClick={resetFilters}>
                            Reset
                        </Button>
                        <Button icon={Plus} onClick={() => setShowForm(true)}>
                            New workstream
                        </Button>
                    </div>
                </div>

                {showForm && (
                    <form
                        onSubmit={handleCreate}
                        className="rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900 space-y-3"
                    >
                        <h2 className="text-sm font-semibold text-zinc-950 dark:text-zinc-50">New workstream</h2>
                        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                            <div>
                                <label className="text-xs font-medium text-zinc-500 dark:text-zinc-400">Title *</label>
                                <input
                                    value={formTitle}
                                    onChange={(e) => setFormTitle(e.target.value)}
                                    placeholder="Workstream title"
                                    required
                                    className="mt-1 w-full rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm outline-none dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-100"
                                />
                            </div>
                            <div>
                                <label className="text-xs font-medium text-zinc-500 dark:text-zinc-400">Domain</label>
                                <select
                                    value={formDomain}
                                    onChange={(e) => setFormDomain(e.target.value)}
                                    className="mt-1 w-full rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm outline-none dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-100"
                                >
                                    <option value="General">General</option>
                                    <option value="Inbox">Inbox</option>
                                    <option value="Finance">Finance</option>
                                    <option value="Tracking">Tracking</option>
                                    <option value="Calendar">Calendar</option>
                                    <option value="Knowledge">Knowledge</option>
                                    <option value="Automation">Automation</option>
                                </select>
                            </div>
                            <div>
                                <label className="text-xs font-medium text-zinc-500 dark:text-zinc-400">Priority</label>
                                <select
                                    value={formPriority}
                                    onChange={(e) => setFormPriority(e.target.value as CommandPriority)}
                                    className="mt-1 w-full rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm outline-none dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-100"
                                >
                                    <option value="low">Low</option>
                                    <option value="medium">Medium</option>
                                    <option value="high">High</option>
                                    <option value="critical">Critical</option>
                                </select>
                            </div>
                            <div>
                                <label className="text-xs font-medium text-zinc-500 dark:text-zinc-400">Status</label>
                                <select
                                    value={formStatus}
                                    onChange={(e) => setFormStatus(e.target.value as CommandStatus)}
                                    className="mt-1 w-full rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm outline-none dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-100"
                                >
                                    <option value="queued">Queued</option>
                                    <option value="attention">Attention</option>
                                    <option value="blocked">Blocked</option>
                                    <option value="healthy">Healthy</option>
                                </select>
                            </div>
                            <div>
                                <label className="text-xs font-medium text-zinc-500 dark:text-zinc-400">Next step</label>
                                <input
                                    value={formNextStep}
                                    onChange={(e) => setFormNextStep(e.target.value)}
                                    placeholder="What needs to happen next?"
                                    className="mt-1 w-full rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm outline-none dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-100"
                                />
                            </div>
                            <div>
                                <label className="text-xs font-medium text-zinc-500 dark:text-zinc-400">Due</label>
                                <input
                                    value={formDue}
                                    onChange={(e) => setFormDue(e.target.value)}
                                    placeholder="e.g. Today, 4pm"
                                    className="mt-1 w-full rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm outline-none dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-100"
                                />
                            </div>
                        </div>
                        <div className="flex gap-2">
                            <Button type="submit" disabled={submitting}>
                                {submitting ? 'Creating…' : 'Create workstream'}
                            </Button>
                            <Button type="button" variant="secondary" onClick={() => setShowForm(false)}>
                                Cancel
                            </Button>
                        </div>
                    </form>
                )}

                <section className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
                    <div className="space-y-6">
                        <div className="rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
                            <div className="flex flex-col gap-4 xl:flex-row xl:items-end">
                                <label className="min-w-0 flex-1 text-xs font-medium text-zinc-500 dark:text-zinc-400">
                                    Search
                                    <span className="mt-1 flex h-9 items-center gap-2 rounded-lg border border-zinc-200 bg-white px-3 dark:border-zinc-800 dark:bg-zinc-950">
                                        <Search size={15} className="text-zinc-400" />
                                        <input
                                            value={filters.query}
                                            onChange={(event) => updateFilter('query', event.target.value)}
                                            placeholder="Find workstream, owner, domain, next step"
                                            className="min-w-0 flex-1 bg-transparent text-sm text-zinc-900 outline-none placeholder:text-zinc-400 dark:text-zinc-100"
                                        />
                                    </span>
                                </label>
                                <SelectField
                                    label="Domain"
                                    value={filters.domain}
                                    options={domainOptions}
                                    onChange={(value) => updateFilter('domain', value)}
                                />
                                <SelectField
                                    label="Status"
                                    value={filters.status}
                                    options={[
                                        { label: 'All statuses', value: 'all' },
                                        { label: 'Healthy', value: 'healthy' },
                                        { label: 'Attention', value: 'attention' },
                                        { label: 'Blocked', value: 'blocked' },
                                        { label: 'Queued', value: 'queued' },
                                    ]}
                                    onChange={(value) => updateFilter('status', value)}
                                />
                                <SelectField
                                    label="Priority"
                                    value={filters.priority}
                                    options={[
                                        { label: 'All priorities', value: 'all' },
                                        { label: 'Critical', value: 'critical' },
                                        { label: 'High', value: 'high' },
                                        { label: 'Medium', value: 'medium' },
                                        { label: 'Low', value: 'low' },
                                    ]}
                                    onChange={(value) => updateFilter('priority', value)}
                                />
                                <SelectField
                                    label="Sort"
                                    value={filters.sort}
                                    options={[
                                        { label: 'Priority', value: 'priority' },
                                        { label: 'Due date', value: 'due' },
                                        { label: 'Confidence', value: 'confidence' },
                                        { label: 'Progress', value: 'progress' },
                                    ]}
                                    onChange={(value) => updateFilter('sort', value)}
                                />
                            </div>
                        </div>

                        <div>
                            <div className="mb-3 flex items-center justify-between gap-3">
                                <div>
                                    <h2 className="text-base font-semibold text-zinc-950 dark:text-zinc-50">
                                        Workstream matrix
                                    </h2>
                                    <p className="text-sm text-zinc-500 dark:text-zinc-400">
                                        {filteredWorkstreams.length} visible
                                    </p>
                                </div>
                                <IconButton icon={TableProperties} label="Table view" variant="secondary" />
                            </div>

                            {loading ? (
                                <div className="rounded-lg border border-zinc-200 bg-white p-8 text-center text-sm text-zinc-500 dark:border-zinc-800 dark:bg-zinc-900">
                                    Loading workstreams…
                                </div>
                            ) : filteredWorkstreams.length === 0 ? (
                                <div className="rounded-lg border border-dashed border-zinc-300 bg-white p-8 text-center dark:border-zinc-700 dark:bg-zinc-900">
                                    <p className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                                        No workstreams yet — add one to start organizing your work
                                    </p>
                                    <Button className="mt-4" icon={Plus} onClick={() => setShowForm(true)}>
                                        New workstream
                                    </Button>
                                </div>
                            ) : (
                                <div className="overflow-x-auto">
                                    <WorkstreamTable
                                        workstreams={filteredWorkstreams}
                                        selectedId={selectedWorkstreamId}
                                        onSelect={setSelectedWorkstreamId}
                                    />
                                </div>
                            )}
                        </div>
                    </div>

                    <aside className="space-y-4">
                        {selectedWorkstream ? (
                            <section className="rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
                                <div className="flex items-start justify-between gap-3">
                                    <div>
                                        <p className="text-xs font-semibold uppercase text-zinc-500 dark:text-zinc-400">
                                            Selected workstream
                                        </p>
                                        <h2 className="mt-2 text-lg font-semibold text-zinc-950 dark:text-zinc-50">
                                            {selectedWorkstream.title}
                                        </h2>
                                    </div>
                                    <StatusBadge status={selectedWorkstream.status} />
                                </div>
                                <div className="mt-4">
                                    <DomainMark domain={selectedWorkstream.domain} />
                                </div>
                                <dl className="mt-5 grid grid-cols-2 gap-3">
                                    {selectedWorkstream.owner && (
                                        <div className="rounded-lg bg-zinc-50 p-3 dark:bg-zinc-950">
                                            <dt className="text-xs text-zinc-500">Owner</dt>
                                            <dd className="mt-1 text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                                                {selectedWorkstream.owner}
                                            </dd>
                                        </div>
                                    )}
                                    {selectedWorkstream.due && (
                                        <div className="rounded-lg bg-zinc-50 p-3 dark:bg-zinc-950">
                                            <dt className="text-xs text-zinc-500">Due</dt>
                                            <dd className="mt-1 text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                                                {selectedWorkstream.due}
                                            </dd>
                                        </div>
                                    )}
                                    <div className="rounded-lg bg-zinc-50 p-3 dark:bg-zinc-950">
                                        <dt className="text-xs text-zinc-500">Blockers</dt>
                                        <dd className="mt-1 text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                                            {selectedWorkstream.blockers}
                                        </dd>
                                    </div>
                                    <div className="rounded-lg bg-zinc-50 p-3 dark:bg-zinc-950">
                                        <dt className="text-xs text-zinc-500">Confidence</dt>
                                        <dd className="mt-1 text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                                            {selectedWorkstream.confidence}%
                                        </dd>
                                    </div>
                                </dl>
                                <div className="mt-5">
                                    <div className="mb-2 flex items-center justify-between text-sm">
                                        <span className="text-zinc-500 dark:text-zinc-400">Progress</span>
                                        <span className="font-semibold text-zinc-900 dark:text-zinc-100">
                                            {selectedWorkstream.progress}%
                                        </span>
                                    </div>
                                    <ProgressBar value={selectedWorkstream.progress} />
                                </div>
                                {selectedWorkstream.nextStep && (
                                    <div className="mt-5 rounded-lg border border-zinc-200 p-3 dark:border-zinc-800">
                                        <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                                            <Workflow size={15} />
                                            Next step
                                        </div>
                                        <p className="text-sm leading-6 text-zinc-600 dark:text-zinc-300">
                                            {selectedWorkstream.nextStep}
                                        </p>
                                    </div>
                                )}
                            </section>
                        ) : (
                            !loading && (
                                <div className="rounded-lg border border-dashed border-zinc-300 bg-white p-6 text-center dark:border-zinc-700 dark:bg-zinc-900">
                                    <p className="text-sm text-zinc-500">Select a workstream to view details</p>
                                </div>
                            )
                        )}

                        <section className="rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
                            <div className="mb-4 flex items-center gap-2">
                                <Gauge className="text-emerald-500" size={17} />
                                <h2 className="text-base font-semibold text-zinc-950 dark:text-zinc-50">
                                    Quick filters
                                </h2>
                            </div>
                            <div className="flex flex-wrap gap-2">
                                <Button
                                    size="sm"
                                    variant="secondary"
                                    icon={Filter}
                                    onClick={() => updateFilter('status', 'attention' as CommandFilters['status'])}
                                >
                                    Attention
                                </Button>
                                <Button
                                    size="sm"
                                    variant="secondary"
                                    icon={Clock3}
                                    onClick={() => updateFilter('sort', 'confidence' as CommandFilters['sort'])}
                                >
                                    Confidence
                                </Button>
                                <Button
                                    size="sm"
                                    variant="secondary"
                                    icon={SlidersHorizontal}
                                    onClick={() => updateFilter('priority', 'critical' as CommandFilters['priority'])}
                                >
                                    Critical
                                </Button>
                                <Button
                                    size="sm"
                                    variant="secondary"
                                    icon={ArrowDownUp}
                                    onClick={resetFilters}
                                >
                                    Reset
                                </Button>
                            </div>
                        </section>
                    </aside>
                </section>
            </section>
        </main>
    );
}
