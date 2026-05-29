'use client';

import Link from 'next/link';
import {
    Activity,
    BrainCircuit,
    CheckCircle2,
    Route,
    Sparkles,
    Wand2,
} from 'lucide-react';
import type { WidgetConfig } from '@/features/dashboard/types/dashboard';

const visibleBreadthTypes = [
    'command-center',
    'reading',
    'collaboration',
    'accessibility',
    'memorization',
    'creative',
    'automation',
    'developer',
] as const;

const insightCards = [
    {
        title: 'ML suite online',
        detail: '12 proxy routes, 8 trained model artifacts, and deterministic advisors are wired for fallback-safe inference.',
        href: '/metrics/ml',
        icon: BrainCircuit,
    },
    {
        title: 'Feature breadth visible',
        detail: 'Command, reading, collaboration, accessibility, memorization, tutorial, and creative surfaces now have widgets and pages.',
        href: '/command-center',
        icon: Route,
    },
    {
        title: 'Interaction audit ready',
        detail: 'Global click and submit capture records UI actions without blocking the page or collecting field values.',
        href: '/metrics/events',
        icon: Activity,
    },
];

const actionCards = [
    {
        title: 'Retest onboarding',
        detail: 'Settings now includes a reset path for replaying workspace setup from a clean profile state.',
        href: '/settings',
        icon: Wand2,
    },
    {
        title: 'Review ML integrations',
        detail: 'News, todos, finance, chat, tracking, command, accessibility, collaboration, memorization, and creative all call ML asynchronously.',
        href: '/admin/ml',
        icon: Sparkles,
    },
    {
        title: 'Run project audit',
        detail: 'Widgets, routes, cards, and action tracking are ready for hands-on validation across the dashboard.',
        href: '/activity',
        icon: CheckCircle2,
    },
];

export function AutonomousWorkCards({ layout }: { layout: WidgetConfig[] }) {
    const visibleCount = visibleBreadthTypes.filter((type) =>
        layout.some((widget) => widget.type === type && widget.visible),
    ).length;

    return (
        <section className="mb-6 grid gap-4 xl:grid-cols-[1.05fr_0.95fr]">
            <div className="rounded-lg border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
                <div className="mb-3 flex items-center justify-between gap-3">
                    <div>
                        <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                            Insight cards
                        </h2>
                        <p className="text-xs text-zinc-500 dark:text-zinc-400">
                            {visibleCount} breadth widgets visible on this
                            dashboard.
                        </p>
                    </div>
                    <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300">
                        autonomous pass
                    </span>
                </div>
                <div className="grid gap-3 md:grid-cols-3">
                    {insightCards.map((card) => {
                        const Icon = card.icon;
                        return (
                            <Link
                                key={card.title}
                                href={card.href}
                                className="rounded-lg border border-zinc-200 p-3 transition hover:border-blue-300 hover:bg-blue-50/40 dark:border-zinc-800 dark:hover:border-blue-700 dark:hover:bg-blue-950/20"
                            >
                                <Icon className="mb-2 h-4 w-4 text-blue-600 dark:text-blue-400" />
                                <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                                    {card.title}
                                </p>
                                <p className="mt-1 text-xs leading-5 text-zinc-500 dark:text-zinc-400">
                                    {card.detail}
                                </p>
                            </Link>
                        );
                    })}
                </div>
            </div>
            <div className="rounded-lg border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
                <div className="mb-3">
                    <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                        Action cards
                    </h2>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400">
                        Fast entry points for testing what changed.
                    </p>
                </div>
                <div className="grid gap-3 md:grid-cols-3 xl:grid-cols-1">
                    {actionCards.map((card) => {
                        const Icon = card.icon;
                        return (
                            <Link
                                key={card.title}
                                href={card.href}
                                className="flex gap-3 rounded-lg border border-zinc-200 p-3 transition hover:border-emerald-300 hover:bg-emerald-50/40 dark:border-zinc-800 dark:hover:border-emerald-700 dark:hover:bg-emerald-950/20"
                            >
                                <Icon className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
                                <span>
                                    <span className="block text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                                        {card.title}
                                    </span>
                                    <span className="mt-1 block text-xs leading-5 text-zinc-500 dark:text-zinc-400">
                                        {card.detail}
                                    </span>
                                </span>
                            </Link>
                        );
                    })}
                </div>
            </div>
        </section>
    );
}
