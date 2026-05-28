'use client';

import {
    CircleAlert,
    Eye,
    Filter,
    ListChecks,
    RefreshCcw,
    Search,
    Sparkles,
} from 'lucide-react';
import { Button } from '@/features/ui/components/Button';
import { cn } from '@/lib/utils/utils';
import { categoryIcons } from '@/features/accessibility/data';
import { useAccessibilityCenter } from '@/features/accessibility/hooks/useAccessibilityCenter';
import type {
    AccessibilityCategory,
    AccessibilitySeverity,
    AccessibilityStatus,
} from '@/features/accessibility/types/accessibility';

const statusStyles: Record<AccessibilityStatus, string> = {
    passing:
        'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950/30 dark:text-emerald-300',
    'needs-review':
        'border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900 dark:bg-amber-950/30 dark:text-amber-300',
    failing:
        'border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-900 dark:bg-rose-950/30 dark:text-rose-300',
};

const severityStyles: Record<AccessibilitySeverity, string> = {
    critical: 'bg-rose-700 text-white',
    high: 'bg-rose-600 text-white',
    medium: 'bg-amber-500 text-white',
    low: 'bg-zinc-200 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-200',
};

function ProgressBar({ value }: { value: number }) {
    return (
        <div className="h-2 rounded-full bg-zinc-100 dark:bg-zinc-800">
            <div
                className="h-full rounded-full bg-zinc-900 dark:bg-zinc-100"
                style={{ width: `${value}%` }}
            />
        </div>
    );
}

function CategoryMark({ category }: { category: AccessibilityCategory }) {
    const Icon = categoryIcons[category];
    return (
        <span className="inline-flex items-center gap-2 text-sm font-medium text-zinc-800 dark:text-zinc-100">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300">
                <Icon size={14} />
            </span>
            {category}
        </span>
    );
}

export function AdminAccessibilityPage() {
    const {
        visibleAudits,
        filters,
        updateFilter,
        resetFilters,
        passingPercent,
    } = useAccessibilityCenter();

    return (
        <div className="space-y-6">
            <div className="flex items-end justify-between gap-4">
                <div>
                    <div className="flex items-center gap-2 mb-1">
                        <Eye size={16} className="text-blue-500" />
                        <h1 className="text-xl font-semibold text-zinc-950 dark:text-zinc-50">
                            Accessibility Audits
                        </h1>
                    </div>
                    <p className="text-sm text-zinc-500 dark:text-zinc-400">
                        WCAG compliance findings across all dashboard surfaces.
                    </p>
                </div>
                <Button
                    variant="secondary"
                    icon={RefreshCcw}
                    onClick={resetFilters}
                >
                    Reset filters
                </Button>
            </div>

            <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_280px]">
                <div className="space-y-4">
                    <div className="rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
                        <div className="flex flex-col gap-4 lg:flex-row lg:items-end">
                            <label className="min-w-0 flex-1 text-xs font-medium text-zinc-500 dark:text-zinc-400">
                                Search audits
                                <span className="mt-1 flex h-9 items-center gap-2 rounded-lg border border-zinc-200 bg-white px-3 dark:border-zinc-800 dark:bg-zinc-950">
                                    <Search
                                        size={15}
                                        className="text-zinc-400"
                                    />
                                    <input
                                        value={filters.query}
                                        onChange={(e) =>
                                            updateFilter(
                                                'query',
                                                e.target.value,
                                            )
                                        }
                                        placeholder="Dashboard, keyboard, charts, motion"
                                        className="min-w-0 flex-1 bg-transparent text-sm text-zinc-900 outline-none placeholder:text-zinc-400 dark:text-zinc-100"
                                    />
                                </span>
                            </label>
                            <label className="grid gap-1 text-xs font-medium text-zinc-500 dark:text-zinc-400">
                                Category
                                <select
                                    value={filters.category}
                                    onChange={(e) =>
                                        updateFilter(
                                            'category',
                                            e.target
                                                .value as typeof filters.category,
                                        )
                                    }
                                    className="h-9 rounded-lg border border-zinc-200 bg-white px-3 text-sm text-zinc-900 outline-none dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-100"
                                >
                                    <option value="all">All categories</option>
                                    <option value="Vision">Vision</option>
                                    <option value="Motion">Motion</option>
                                    <option value="Keyboard">Keyboard</option>
                                    <option value="Cognitive">Cognitive</option>
                                    <option value="Audio">Audio</option>
                                </select>
                            </label>
                            <label className="grid gap-1 text-xs font-medium text-zinc-500 dark:text-zinc-400">
                                Status
                                <select
                                    value={filters.status}
                                    onChange={(e) =>
                                        updateFilter(
                                            'status',
                                            e.target
                                                .value as typeof filters.status,
                                        )
                                    }
                                    className="h-9 rounded-lg border border-zinc-200 bg-white px-3 text-sm text-zinc-900 outline-none dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-100"
                                >
                                    <option value="all">All statuses</option>
                                    <option value="passing">Passing</option>
                                    <option value="needs-review">
                                        Needs review
                                    </option>
                                    <option value="failing">Failing</option>
                                </select>
                            </label>
                            <Button
                                variant="secondary"
                                icon={Filter}
                                onClick={() =>
                                    updateFilter('status', 'needs-review')
                                }
                            >
                                Review
                            </Button>
                        </div>
                    </div>

                    <div className="rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
                        <div className="mb-4 flex items-center justify-between gap-3">
                            <div>
                                <h2 className="text-base font-semibold text-zinc-950 dark:text-zinc-50">
                                    Audit findings
                                </h2>
                                <p className="text-sm text-zinc-500 dark:text-zinc-400">
                                    {visibleAudits.length} findings visible
                                </p>
                            </div>
                            <ListChecks size={18} className="text-zinc-400" />
                        </div>
                        <div className="grid gap-3">
                            {visibleAudits.map((audit) => (
                                <article
                                    key={audit.id}
                                    className="rounded-lg border border-zinc-200 p-4 dark:border-zinc-800"
                                >
                                    <div className="flex items-start justify-between gap-3">
                                        <div>
                                            <CategoryMark
                                                category={audit.category}
                                            />
                                            <h3 className="mt-3 text-sm font-semibold text-zinc-950 dark:text-zinc-50">
                                                {audit.title}
                                            </h3>
                                            <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
                                                {audit.surface}
                                            </p>
                                        </div>
                                        <div className="flex flex-col items-end gap-2">
                                            <span
                                                className={cn(
                                                    'inline-flex h-6 items-center rounded-full border px-2 text-xs font-medium',
                                                    statusStyles[audit.status],
                                                )}
                                            >
                                                {audit.status.replace('-', ' ')}
                                            </span>
                                            <span
                                                className={cn(
                                                    'rounded px-1.5 py-0.5 text-[11px] font-semibold uppercase',
                                                    severityStyles[
                                                        audit.severity
                                                    ],
                                                )}
                                            >
                                                {audit.severity}
                                            </span>
                                        </div>
                                    </div>
                                    <div className="mt-4 rounded-lg bg-zinc-50 p-3 text-sm leading-6 text-zinc-600 dark:bg-zinc-950 dark:text-zinc-300">
                                        {audit.recommendation}
                                    </div>
                                </article>
                            ))}
                        </div>
                    </div>
                </div>

                <aside className="space-y-4">
                    <div className="rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
                        <div className="mb-4 flex items-center justify-between gap-3">
                            <div>
                                <h2 className="text-base font-semibold text-zinc-950 dark:text-zinc-50">
                                    Passing baseline
                                </h2>
                                <p className="text-sm text-zinc-500 dark:text-zinc-400">
                                    Audit coverage
                                </p>
                            </div>
                            <Sparkles size={18} className="text-blue-500" />
                        </div>
                        <strong className="text-3xl font-semibold text-zinc-950 dark:text-zinc-50">
                            {passingPercent}%
                        </strong>
                        <div className="mt-4">
                            <ProgressBar value={passingPercent} />
                        </div>
                    </div>

                    <div className="rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
                        <div className="mb-3 flex items-center gap-2">
                            <CircleAlert size={15} className="text-amber-500" />
                            <h2 className="text-sm font-semibold text-zinc-950 dark:text-zinc-50">
                                By status
                            </h2>
                        </div>
                        <div className="space-y-2 text-sm">
                            {(
                                ['passing', 'needs-review', 'failing'] as const
                            ).map((s) => (
                                <button
                                    key={s}
                                    type="button"
                                    onClick={() => updateFilter('status', s)}
                                    className={cn(
                                        'w-full flex items-center justify-between rounded-lg border px-3 py-2 text-left transition hover:border-zinc-300 dark:hover:border-zinc-700',
                                        filters.status === s
                                            ? statusStyles[s]
                                            : 'border-zinc-200 dark:border-zinc-800',
                                    )}
                                >
                                    <span className="capitalize">
                                        {s.replace('-', ' ')}
                                    </span>
                                    <span className="font-semibold tabular-nums">
                                        {
                                            visibleAudits.filter(
                                                (a) => a.status === s,
                                            ).length
                                        }
                                    </span>
                                </button>
                            ))}
                        </div>
                    </div>
                </aside>
            </div>
        </div>
    );
}
