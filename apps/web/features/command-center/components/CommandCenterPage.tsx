'use client';

import Link from 'next/link';
import { LayoutDashboard, RadioTower } from 'lucide-react';
import Header from '@/features/ui/components/Header';
import { useCommandCenter } from '../hooks/useCommandCenter';
import { BriefingSection, ChangesSection } from './ChangesAndBriefing';
import { DecisionsSection, TasksSection } from './DecisionsAndTasks';
import {
    AutomationHealthSection,
    OutcomesSection,
    SourceFailuresSection,
} from './OperationsSections';

export function CommandCenterPage() {
    const controller = useCommandCenter();
    return (
        <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
            <Header />
            <main
                className="mx-auto max-w-7xl px-5 py-8 lg:px-12"
                id="main-content"
            >
                <header className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
                    <div>
                        <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-blue-600 dark:text-blue-400">
                            <RadioTower aria-hidden size={14} /> V1 command
                            center
                        </p>
                        <h1 className="mt-2 text-3xl font-semibold tracking-tight text-zinc-950 dark:text-zinc-50">
                            Decide what happens next
                        </h1>
                        <p className="mt-3 max-w-2xl text-sm leading-6 text-zinc-600 dark:text-zinc-300">
                            Changes, priorities, approvals, tasks, and verified
                            outcomes in one resilient loop. A failed source
                            never hides the rest of your work.
                        </p>
                    </div>
                    <nav
                        aria-label="Workspace shortcuts"
                        className="flex flex-wrap gap-2"
                    >
                        <Link
                            className="inline-flex items-center gap-2 rounded-xl border border-zinc-300 bg-white px-3 py-2 text-xs font-semibold hover:bg-zinc-100 dark:border-zinc-700 dark:bg-zinc-900 dark:hover:bg-zinc-800"
                            href="/dashboard"
                        >
                            <LayoutDashboard aria-hidden size={14} /> Widget
                            workspace
                        </Link>
                        <Link
                            className="rounded-xl border border-zinc-300 bg-white px-3 py-2 text-xs font-semibold hover:bg-zinc-100 dark:border-zinc-700 dark:bg-zinc-900 dark:hover:bg-zinc-800"
                            href="/inbox"
                        >
                            Inbox
                        </Link>
                        <Link
                            className="rounded-xl border border-zinc-300 bg-white px-3 py-2 text-xs font-semibold hover:bg-zinc-100 dark:border-zinc-700 dark:bg-zinc-900 dark:hover:bg-zinc-800"
                            href="/automation"
                        >
                            Automation
                        </Link>
                    </nav>
                </header>

                <div className="mt-8 grid gap-5 lg:grid-cols-2">
                    <ChangesSection controller={controller} />
                    <BriefingSection controller={controller} />
                    <DecisionsSection controller={controller} />
                    <TasksSection controller={controller} />
                </div>
                <div className="mt-5 grid gap-5 lg:grid-cols-3">
                    <AutomationHealthSection controller={controller} />
                    <SourceFailuresSection controller={controller} />
                    <OutcomesSection controller={controller} />
                </div>
            </main>
        </div>
    );
}
