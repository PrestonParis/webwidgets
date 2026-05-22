import { Boxes, LayoutGrid, SlidersHorizontal } from 'lucide-react';

const concepts = [
    {
        icon: Boxes,
        title: 'Widgets are instruments',
        body: 'Email, notes, tracking, timers, calendar, and future intelligence surfaces work as small composable tools.',
    },
    {
        icon: LayoutGrid,
        title: 'Workspaces are operating modes',
        body: 'Arrange widgets into a command center now, then split scenes by recovery, focus, research, or development later.',
    },
    {
        icon: SlidersHorizontal,
        title: 'Setup stays yours',
        body: 'Recommendations give you a strong first system without hiding controls or locking the dashboard into a preset.',
    },
];

export function WelcomeStep() {
    return (
        <div className="grid gap-5 xl:grid-cols-[1.1fr_0.9fr]">
            <div className="rounded-lg border border-zinc-200 bg-white p-7 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
                <div className="grid min-h-[360px] place-items-center rounded-lg border border-dashed border-zinc-300 bg-[#f0f3ff] p-8 dark:border-zinc-700 dark:bg-zinc-950">
                    <div className="w-full max-w-xl">
                        <div className="mb-6 grid grid-cols-3 gap-3">
                            <div className="h-24 rounded-lg bg-white p-4 shadow-sm dark:bg-zinc-900">
                                <div className="h-3 w-16 rounded bg-[#4f6ef7]" />
                                <div className="mt-4 space-y-2">
                                    <div className="h-2 rounded bg-zinc-200 dark:bg-zinc-700" />
                                    <div className="h-2 w-2/3 rounded bg-zinc-200 dark:bg-zinc-700" />
                                </div>
                            </div>
                            <div className="h-24 rounded-lg bg-zinc-950 p-4 shadow-sm dark:bg-white">
                                <div className="h-3 w-12 rounded bg-white dark:bg-zinc-950" />
                                <div className="mt-4 grid grid-cols-4 gap-1">
                                    {[0, 1, 2, 3].map((item) => (
                                        <div
                                            key={item}
                                            className="h-8 rounded bg-[#9ccfbd]"
                                        />
                                    ))}
                                </div>
                            </div>
                            <div className="h-24 rounded-lg bg-white p-4 shadow-sm dark:bg-zinc-900">
                                <div className="h-12 rounded bg-[#f3c969]" />
                                <div className="mt-3 h-2 w-20 rounded bg-zinc-200 dark:bg-zinc-700" />
                            </div>
                        </div>
                        <div className="rounded-lg bg-white p-5 shadow-sm dark:bg-zinc-900">
                            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-zinc-500">
                                Generated starter system
                            </p>
                            <div className="mt-4 grid gap-3 md:grid-cols-3">
                                {['Dashboard', 'Tracking', 'Automations'].map(
                                    (label) => (
                                        <div
                                            key={label}
                                            className="rounded-lg border border-zinc-200 p-4 text-sm font-semibold dark:border-zinc-800"
                                        >
                                            {label}
                                        </div>
                                    ),
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="grid gap-4">
                {concepts.map((concept) => {
                    const Icon = concept.icon;
                    return (
                        <article
                            key={concept.title}
                            className="rounded-lg border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900"
                        >
                            <Icon className="h-5 w-5 text-[#4f6ef7]" />
                            <h3 className="mt-4 text-lg font-semibold">
                                {concept.title}
                            </h3>
                            <p className="mt-2 text-sm leading-6 text-zinc-600 dark:text-zinc-300">
                                {concept.body}
                            </p>
                        </article>
                    );
                })}
            </div>
        </div>
    );
}
