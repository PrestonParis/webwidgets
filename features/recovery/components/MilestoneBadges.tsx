const MILESTONES = [
    { label: '1 Day', s: 86400 },
    { label: '7 Days', s: 604800 },
    { label: '30 Days', s: 2592000 },
    { label: '90 Days', s: 7776000 },
];

export default function MilestoneBadges({
    secondsClean,
}: {
    secondsClean: number;
}) {
    return (
        <div className="flex justify-center gap-2 flex-wrap">
            {MILESTONES.map((m) => (
                <span
                    key={m.label}
                    className={`px-3 py-1 text-xs font-bold rounded-full transition-colors ${
                        secondsClean >= m.s
                            ? 'bg-purple-600 text-white'
                            : 'bg-purple-50 dark:bg-zinc-900 text-purple-600 dark:text-purple-400'
                    }`}
                >
                    {m.label}
                </span>
            ))}
        </div>
    );
}
