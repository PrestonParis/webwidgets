import type { CoverageHealth } from '@/features/news/types/news';

const stats = (h: CoverageHealth) =>
    [
        { label: 'Sources checked', value: h.sourcesChecked },
        { label: 'Stories clustered', value: h.storiesClustered },
        { label: 'Developing', value: h.developingStories },
        { label: 'Updated this hour', value: h.updatedLastHour },
        { label: 'Conflicting reports', value: h.conflictingReports },
        {
            label: 'Hidden (low confidence)',
            value: h.lowConfidenceHidden,
        },
    ] as const;

export function CoverageHealthPanel({ health }: { health: CoverageHealth }) {
    if (health.sourcesChecked === 0) {
        return (
            <p className="text-sm text-zinc-500 dark:text-zinc-400">
                No sources connected yet.
            </p>
        );
    }

    return (
        <dl className="grid grid-cols-2 gap-x-4 gap-y-3">
            {stats(health).map(({ label, value }) => (
                <div key={label}>
                    <dt className="text-[11px] text-zinc-500 dark:text-zinc-400">
                        {label}
                    </dt>
                    <dd className="text-base font-bold text-zinc-950 dark:text-zinc-50">
                        {value}
                    </dd>
                </div>
            ))}
        </dl>
    );
}
